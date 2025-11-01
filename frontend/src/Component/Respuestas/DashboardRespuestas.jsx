import React, { useState, useEffect, useMemo, useCallback } from 'react'
import './DashboardRespuestas.css'
import { buildApiUrl } from '../../config/api'
import TendenciasGrafico from './TendenciasGrafico'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import html2canvas from 'html2canvas'

const DashboardRespuestas = () => {
  const [dashboard, setDashboard] = useState(null)
  const [incidenteSeleccionado, setIncidenteSeleccionado] = useState(null)
  const [respuestasDetalle, setRespuestasDetalle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingPDF, setLoadingPDF] = useState(false)
  const [error, setError] = useState(null)
  const [notification, setNotification] = useState({ show: false, message: '', type: '' })
  
  // Estados para filtros
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('')
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('')
  const [filtroTipoIncidente, setFiltroTipoIncidente] = useState('')
  const [tiposIncidente, setTiposIncidente] = useState([])
  
  // Estado para WhatsApp
  const [estadoWhatsApp, setEstadoWhatsApp] = useState({
    enabled: true,
    configured: true,
    bomberosSinTelefono: 0
  })

  // Función para mostrar notificaciones
  const mostrarNotificacion = useCallback((message, type = 'info') => {
    setNotification({ show: true, message, type })
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' })
    }, 4000)
  }, [])

  // Función para obtener color por tipo de incidente
  const getIncidentTypeColor = (idTipoIncidente, tipoDescripcion) => {
    const coloresPorId = {
      1: 'danger',      // Accidente de tránsito - Rojo
      2: 'info',        // Factor climático - Azul claro
      3: 'warning',     // Incendio estructural - Amarillo
      4: 'success',     // Incendio forestal - Verde
      5: 'secondary',   // Material peligroso - Gris
      6: 'primary'      // Rescate - Azul
    }

    if (idTipoIncidente && coloresPorId[idTipoIncidente]) {
      return coloresPorId[idTipoIncidente]
    }

    const coloresPorNombre = {
      'Accidente de tránsito': 'danger',
      'Rescate': 'primary',
      'Incendio forestal': 'success',
      'Incendio estructural': 'warning',
      'Factor climático': 'info',
      'Material peligroso': 'secondary'
    }

    return coloresPorNombre[tipoDescripcion] || 'dark'
  }

  // Cargar dashboard inicial
  useEffect(() => {
    cargarDashboard()
    cargarTiposIncidente()
    cargarEstadoWhatsApp()
    
    // Actualizar cada 30 segundos
    const interval = setInterval(() => {
      cargarDashboard()
      cargarEstadoWhatsApp()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const cargarDashboard = useCallback(async () => {
    try {
      const response = await fetch(buildApiUrl('/api/dashboard/respuestas'))
      const data = await response.json()
      
      if (data.success) {
        setDashboard(data.data)
        setError(null)
      } else {
        setError('Error al cargar dashboard')
      }
    } catch (err) {
      setError('Error de conexión')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const cargarTiposIncidente = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/tipos-incidente'))
      const data = await response.json()
      if (data && data.success && data.data) {
        setTiposIncidente(data.data)
      } else if (Array.isArray(data)) {
        // Fallback: si devuelve array directamente
        setTiposIncidente(data)
      }
    } catch (err) {
      console.error('Error al cargar tipos de incidente:', err)
      setTiposIncidente([]) // Array vacío en caso de error
    }
  }

  const cargarEstadoWhatsApp = async () => {
    try {
      // Obtener bomberos sin teléfono
      const response = await fetch(buildApiUrl('/api/bomberos'))
      const data = await response.json()
      
      // Manejar respuesta con { success, data } o array directo
      const bomberos = (data && data.data) ? data.data : (Array.isArray(data) ? data : [])
      
      if (bomberos.length > 0) {
        const sinTelefono = bomberos.filter(b => !b.telefono || b.telefono === '').length
        setEstadoWhatsApp(prev => ({
          ...prev,
          bomberosSinTelefono: sinTelefono
        }))
      }
    } catch (err) {
      console.error('Error al cargar estado WhatsApp:', err)
    }
  }

  const cargarDetalleIncidente = async (idIncidente) => {
    try {
      setLoading(true)
      const response = await fetch(buildApiUrl(`/api/incidentes/${idIncidente}/respuestas`))
      const data = await response.json()
      
      if (data.success) {
        setRespuestasDetalle(data.data)
        setIncidenteSeleccionado(idIncidente)
      } else {
        setError('Error al cargar detalles del incidente')
      }
    } catch (err) {
      setError('Error de conexión')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar incidentes según los criterios seleccionados
  const incidentesFiltrados = useMemo(() => {
    if (!dashboard?.incidentesRecientes) return []
    
    return dashboard.incidentesRecientes.filter(incidente => {
      // Filtro por fecha desde
      if (filtroFechaDesde) {
        const fechaIncidente = new Date(incidente.fecha)
        const fechaDesde = new Date(filtroFechaDesde)
        if (fechaIncidente < fechaDesde) return false
      }
      
      // Filtro por fecha hasta
      if (filtroFechaHasta) {
        const fechaIncidente = new Date(incidente.fecha)
        const fechaHasta = new Date(filtroFechaHasta)
        fechaHasta.setHours(23, 59, 59, 999) // Incluir todo el día
        if (fechaIncidente > fechaHasta) return false
      }
      
      // Filtro por tipo de incidente
      if (filtroTipoIncidente && incidente.idTipoIncidente) {
        if (incidente.idTipoIncidente.toString() !== filtroTipoIncidente) return false
      }
      
      return true
    })
  }, [dashboard, filtroFechaDesde, filtroFechaHasta, filtroTipoIncidente])

  // Calcular estadísticas filtradas
  const estadisticasFiltradas = useMemo(() => {
    return incidentesFiltrados.reduce((acc, incidente) => {
      acc.totalIncidentes++
      acc.totalRespuestas += incidente.totalRespuestas || 0
      acc.totalConfirmados += incidente.confirmados || 0
      acc.totalRechazados += incidente.rechazados || 0
      acc.totalPendientes += incidente.pendientes || 0
      return acc
    }, {
      totalIncidentes: 0,
      totalRespuestas: 0,
      totalConfirmados: 0,
      totalRechazados: 0,
      totalPendientes: 0
    })
  }, [incidentesFiltrados])

  const limpiarFiltros = () => {
    setFiltroFechaDesde('')
    setFiltroFechaHasta('')
    setFiltroTipoIncidente('')
  }

  const exportarPDF = async () => {
    if (!incidentesFiltrados || incidentesFiltrados.length === 0) {
      mostrarNotificacion('No hay datos para exportar', 'warning')
      return
    }

    setLoadingPDF(true)
    mostrarNotificacion('Generando PDF...', 'info')

    try {
      console.log('✅ Iniciando generación de PDF...')
      
      // Capturar gráficos si existen
      let graficosImg = null
      const tendenciasElement = document.querySelector('.tendencias-grafico')
      if (tendenciasElement) {
        try {
          const canvas = await html2canvas(tendenciasElement, {
            backgroundColor: '#f8f9fa',
            useCORS: true,
            scale: 2,
            logging: false
          })
          graficosImg = canvas.toDataURL('image/png')
        } catch (error) {
          console.warn('No se pudieron capturar los gráficos:', error)
        }
      }

      const doc = new jsPDF('l', 'pt', 'a4') // Landscape para más columnas
      console.log('📄 Documento PDF creado')
      console.log('🔧 autoTable importado:', typeof autoTable)
      console.log('🔧 doc.autoTable:', typeof doc.autoTable)
      
      // Si doc.autoTable no está disponible pero tenemos autoTable importado, lo usamos directamente
      const useAutoTable = doc.autoTable || autoTable
      if (!useAutoTable) {
        console.error('❌ ERROR: ni doc.autoTable ni autoTable están disponibles')
        throw new Error('jspdf-autotable no está disponible.')
      }
      
      console.log('✅ autoTable listo para usar (tipo:', typeof useAutoTable, ')')
      
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 40

      // Header con logo
      doc.setFillColor(213, 43, 30)
      doc.rect(0, 0, pageWidth, 60, 'F')
      
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.text('Dashboard de Notificaciones WhatsApp', margin, 35)

      // Metadata
      let yPos = 80
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(10)
      
      const fechaEmision = new Date().toLocaleString('es-AR', { 
        dateStyle: 'medium', 
        timeStyle: 'short' 
      })
      doc.text(`Fecha de emisión: ${fechaEmision}`, margin, yPos)
      yPos += 15

      // Información de filtros si aplica
      if (filtroFechaDesde || filtroFechaHasta || filtroTipoIncidente) {
        doc.setFont('helvetica', 'bold')
        doc.text('Filtros aplicados:', margin, yPos)
        doc.setFont('helvetica', 'normal')
        yPos += 15

        if (filtroFechaDesde) {
          doc.text(`  • Desde: ${filtroFechaDesde}`, margin, yPos)
          yPos += 12
        }
        if (filtroFechaHasta) {
          doc.text(`  • Hasta: ${filtroFechaHasta}`, margin, yPos)
          yPos += 12
        }
        if (filtroTipoIncidente) {
          const tipoNombre = tiposIncidente.find(t => 
            t.idTipoIncidente.toString() === filtroTipoIncidente
          )?.nombre || 'Desconocido'
          doc.text(`  • Tipo: ${tipoNombre}`, margin, yPos)
          yPos += 12
        }
        yPos += 5
      }

      // Resumen de estadísticas
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('Resumen de Estadísticas', margin, yPos)
      yPos += 15
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      
      const stats = estadisticasFiltradas
      const statsText = [
        `Total de Incidentes: ${stats.totalIncidentes}`,
        `Total Notificaciones: ${stats.totalRespuestas}`,
        `Confirmados: ${stats.totalConfirmados}`,
        `Rechazados: ${stats.totalRechazados}`,
        `Pendientes: ${stats.totalPendientes}`,
        `Tasa de Respuesta: ${calcularTasaRespuesta()}%`
      ]
      
      const statsPerRow = 3
      for (let i = 0; i < statsText.length; i += statsPerRow) {
        const rowStats = statsText.slice(i, i + statsPerRow)
        const colWidth = (pageWidth - margin * 2) / statsPerRow
        rowStats.forEach((stat, idx) => {
          doc.text(stat, margin + (idx * colWidth), yPos)
        })
        yPos += 15
      }

      yPos += 10

      // Agregar gráficos de tendencias si existen
      if (graficosImg) {
        // Verificar si necesitamos una nueva página
        if (yPos + 250 > pageHeight - margin) {
          doc.addPage()
          yPos = margin + 20
        }

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.text('Tendencias de los Últimos 7 Días', margin, yPos)
        yPos += 20

        // Calcular dimensiones del gráfico para ajustarlo al ancho de la página
        const imgWidth = pageWidth - (margin * 2)
        const imgHeight = 200 // Altura fija para mantener proporción

        doc.addImage(graficosImg, 'PNG', margin, yPos, imgWidth, imgHeight)
        yPos += imgHeight + 30

        // Si hay espacio suficiente, agregar una nota
        if (yPos + 40 < pageHeight - margin) {
          doc.setFont('helvetica', 'italic')
          doc.setFontSize(9)
          doc.setTextColor(100)
          doc.text(
            'El gráfico muestra la distribución de incidentes por día durante los últimos 7 días.',
            margin,
            yPos
          )
          doc.setTextColor(0, 0, 0)
          yPos += 25
        }
      }

      // Verificar si necesitamos nueva página antes de la tabla
      if (yPos + 100 > pageHeight - margin) {
        doc.addPage()
        yPos = margin + 20
      }

      // Título de la tabla
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      const tituloTabla = filtroFechaDesde || filtroFechaHasta || filtroTipoIncidente
        ? 'Detalle de Incidentes (Filtrados)'
        : 'Detalle de Incidentes'
      doc.text(tituloTabla, margin, yPos)
      yPos += 20

      // Tabla de incidentes con datos consistentes
      const tableData = incidentesFiltrados.map(inc => {
        const fecha = new Date(inc.fecha)
        const tasaRespuesta = inc.totalRespuestas > 0 
          ? (((inc.confirmados || 0) + (inc.rechazados || 0)) / inc.totalRespuestas * 100).toFixed(1)
          : '0.0'
        
        return [
          String(inc.idIncidente || 'N/A'),
          fecha.toLocaleDateString('es-AR'),
          fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
          inc.nombreTipoIncidente || 'N/A',
          (inc.descripcion || 'Sin descripción').substring(0, 45) + ((inc.descripcion?.length || 0) > 45 ? '...' : ''),
          String(inc.totalRespuestas || 0),
          String(inc.confirmados || 0),
          String(inc.rechazados || 0),
          String(inc.pendientes || 0),
          `${tasaRespuesta}%`
        ]
      })

      // Usar autoTable - puede ser doc.autoTable o autoTable(doc, {...})
      if (typeof doc.autoTable === 'function') {
        // Método extendido en el prototipo
        doc.autoTable({
          startY: yPos,
          head: [[
            'ID',
            'Fecha',
            'Hora',
            'Tipo',
            'Descripción',
            'Total',
            'Conf.',
            'Decl.',
            'Pend.',
            'Tasa %'
          ]],
          body: tableData,
          theme: 'grid',
          styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 5,
            overflow: 'linebreak',
            textColor: [20, 20, 20],
            lineColor: [200, 200, 200],
            lineWidth: 0.5
          },
          headStyles: {
            fillColor: [213, 43, 30],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9,
            halign: 'center',
            valign: 'middle',
            cellPadding: 6
          },
          columnStyles: {
            0: { cellWidth: 35, halign: 'center', fontSize: 9 },
            1: { cellWidth: 65, halign: 'left', fontSize: 9 },
            2: { cellWidth: 45, halign: 'center', fontSize: 9 },
            3: { cellWidth: 100, halign: 'left', fontSize: 9 },
            4: { cellWidth: 'auto', halign: 'left', fontSize: 9 },
            5: { cellWidth: 42, halign: 'center', fontSize: 9 },
            6: { cellWidth: 42, halign: 'center', fontSize: 9 },
            7: { cellWidth: 42, halign: 'center', fontSize: 9 },
            8: { cellWidth: 42, halign: 'center', fontSize: 9 },
            9: { cellWidth: 50, halign: 'center', fontSize: 9 }
          },
          alternateRowStyles: {
            fillColor: [248, 249, 250]
          },
          margin: { left: margin, right: margin },
          didParseCell: function(data) {
            if (data.section === 'body') {
              data.cell.styles.valign = 'middle'
            }
          }
        })
      } else if (typeof autoTable === 'function') {
        // Función importada directamente
        autoTable(doc, {
          startY: yPos,
          head: [[
            'ID',
            'Fecha',
            'Hora',
            'Tipo',
            'Descripción',
            'Total',
            'Conf.',
            'Decl.',
            'Pend.',
            'Tasa %'
          ]],
          body: tableData,
          theme: 'grid',
          styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 5,
            overflow: 'linebreak',
            textColor: [20, 20, 20],
            lineColor: [200, 200, 200],
            lineWidth: 0.5
          },
          headStyles: {
            fillColor: [213, 43, 30],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9,
            halign: 'center',
            valign: 'middle',
            cellPadding: 6
          },
          columnStyles: {
            0: { cellWidth: 35, halign: 'center', fontSize: 9 },
            1: { cellWidth: 65, halign: 'left', fontSize: 9 },
            2: { cellWidth: 45, halign: 'center', fontSize: 9 },
            3: { cellWidth: 100, halign: 'left', fontSize: 9 },
            4: { cellWidth: 'auto', halign: 'left', fontSize: 9 },
            5: { cellWidth: 42, halign: 'center', fontSize: 9 },
            6: { cellWidth: 42, halign: 'center', fontSize: 9 },
            7: { cellWidth: 42, halign: 'center', fontSize: 9 },
            8: { cellWidth: 42, halign: 'center', fontSize: 9 },
            9: { cellWidth: 50, halign: 'center', fontSize: 9 }
          },
          alternateRowStyles: {
            fillColor: [248, 249, 250]
          },
          margin: { left: margin, right: margin },
          didParseCell: function(data) {
            if (data.section === 'body') {
              data.cell.styles.valign = 'middle'
            }
          }
        })
      }

      // Agregar numeración de páginas
      const totalPages = doc.internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(100)
        doc.text(
          `Página ${i} de ${totalPages}`,
          pageWidth - margin,
          pageHeight - 20,
          { align: 'right' }
        )
      }

      // Guardar PDF con nombre descriptivo
      const ahora = new Date()
      const timestamp = `${ahora.getFullYear()}${String(ahora.getMonth() + 1).padStart(2, '0')}${String(ahora.getDate()).padStart(2, '0')}`
      let nombreArchivo = `BomberOS-Dashboard-Respuestas-${timestamp}.pdf`
      
      doc.save(nombreArchivo)
      console.log('PDF generado exitosamente:', nombreArchivo)
      mostrarNotificacion('PDF generado exitosamente', 'success')
    } catch (error) {
      console.error('Error detallado al generar PDF:', error)
      console.error('Stack trace:', error.stack)
      mostrarNotificacion(`Error al generar PDF: ${error.message || 'Error desconocido'}`, 'error')
    } finally {
      setLoadingPDF(false)
    }
  }

  const exportarCSV = () => {
    if (!incidentesFiltrados || incidentesFiltrados.length === 0) {
      mostrarNotificacion('No hay datos para exportar', 'warning')
      return
    }
    mostrarNotificacion('CSV exportado exitosamente', 'success')

    // Debug: Ver estructura del primer incidente
    if (incidentesFiltrados.length > 0) {
      console.log('📊 Estructura del incidente:', incidentesFiltrados[0])
      console.log('📍 Campos disponibles:', Object.keys(incidentesFiltrados[0]))
    }

    // Función para formatear fecha
    const formatearFechaCSV = (fecha) => {
      const d = new Date(fecha)
      const dia = String(d.getDate()).padStart(2, '0')
      const mes = String(d.getMonth() + 1).padStart(2, '0')
      const año = d.getFullYear()
      return `${dia}/${mes}/${año}`
    }

    // Función para formatear hora
    const formatearHoraCSV = (fecha) => {
      const d = new Date(fecha)
      const horas = String(d.getHours()).padStart(2, '0')
      const minutos = String(d.getMinutes()).padStart(2, '0')
      return `${horas}:${minutos}`
    }

    // Función para limpiar texto y hacerlo seguro para CSV
    const limpiarTexto = (texto) => {
      if (!texto) return ''
      return String(texto)
        .replace(/[\r\n]+/g, ' ')
        .replace(/"/g, '""')
        .trim()
    }

    // Función para calcular tasa de respuesta (como número para alineación correcta)
    const calcularTasaRespuestaCSV = (inc) => {
      const total = inc.totalRespuestas || 0
      if (total === 0) return '0.0'
      const respondidos = (inc.confirmados || 0) + (inc.rechazados || 0)
      return ((respondidos / total) * 100).toFixed(1)
    }

    // Crear encabezados simplificados (sin localización que no está disponible)
    const headers = [
      'ID Incidente',
      'Fecha',
      'Hora',
      'Tipo Incidente',
      'Descripcion',
      'Total Notificaciones',
      'Confirmados',
      'Rechazados',
      'Pendientes',
      'Tasa Respuesta (%)'
    ]
    
    // Crear filas con información completa
    const rows = incidentesFiltrados.map(inc => [
      inc.idIncidente || 'N/A',
      formatearFechaCSV(inc.fecha),
      formatearHoraCSV(inc.fecha),
      limpiarTexto(inc.nombreTipoIncidente || 'N/A'),
      limpiarTexto(inc.descripcion || 'Sin descripción'),
      inc.totalRespuestas || 0,
      inc.confirmados || 0,
      inc.rechazados || 0,
      inc.pendientes || 0,
      calcularTasaRespuestaCSV(inc)
    ])
    
    // Calcular totales para fila de resumen
    const totales = incidentesFiltrados.reduce((acc, inc) => {
      acc.totalNotificaciones += inc.totalRespuestas || 0
      acc.totalConfirmados += inc.confirmados || 0
      acc.totalRechazados += inc.rechazados || 0
      acc.totalPendientes += inc.pendientes || 0
      return acc
    }, { totalNotificaciones: 0, totalConfirmados: 0, totalRechazados: 0, totalPendientes: 0 })
    
    const tasaRespuestaTotal = totales.totalNotificaciones > 0
      ? (((totales.totalConfirmados + totales.totalRechazados) / totales.totalNotificaciones) * 100).toFixed(1)
      : '0.0'
    
    // Fila de resumen (alineada con las columnas de números)
    const filaResumen = [
      '', // ID Incidente
      '', // Fecha
      '', // Hora
      '', // Tipo Incidente
      `TOTALES: ${incidentesFiltrados.length} incidentes`, // Descripción (última columna de texto)
      totales.totalNotificaciones,
      totales.totalConfirmados,
      totales.totalRechazados,
      totales.totalPendientes,
      tasaRespuestaTotal
    ]
    
    // Combinar todo - usar punto y coma como separador (mejor para Excel en español)
    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => {
        // Si el campo contiene coma, punto y coma o comillas, envolverlo en comillas
        const cellStr = String(cell)
        if (cellStr.includes(';') || cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr}"`
        }
        return cellStr
      }).join(';')),
      '', // Línea en blanco antes del resumen
      filaResumen.map(cell => {
        const cellStr = String(cell)
        if (cellStr.includes(';') || cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr}"`
        }
        return cellStr
      }).join(';')
    ].join('\n')
    
    // Descargar archivo con BOM para UTF-8
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    // Nombre de archivo descriptivo con fecha y rango si aplica
    const ahora = new Date()
    const timestamp = `${ahora.getFullYear()}${String(ahora.getMonth() + 1).padStart(2, '0')}${String(ahora.getDate()).padStart(2, '0')}-${String(ahora.getHours()).padStart(2, '0')}${String(ahora.getMinutes()).padStart(2, '0')}`
    
    let nombreArchivo = `BomberOS-Dashboard-Respuestas`
    
    // Agregar rango de fechas si hay filtros
    if (filtroFechaDesde || filtroFechaHasta) {
      const desde = filtroFechaDesde ? filtroFechaDesde.replace(/-/g, '') : 'inicio'
      const hasta = filtroFechaHasta ? filtroFechaHasta.replace(/-/g, '') : 'hoy'
      nombreArchivo += `-${desde}_${hasta}`
    }
    
    // Agregar tipo de incidente si hay filtro
    if (filtroTipoIncidente) {
      const tipoNombre = tiposIncidente.find(t => t.idTipoIncidente.toString() === filtroTipoIncidente)?.nombre || 'filtrado'
      nombreArchivo += `-${tipoNombre.replace(/\s+/g, '_')}`
    }
    
    nombreArchivo += `-${timestamp}.csv`
    
    link.setAttribute('href', url)
    link.setAttribute('download', nombreArchivo)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Limpiar URL del objeto
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const obtenerIconoRespuesta = (asistio) => {
    if (asistio === 1) return '✅'
    if (asistio === 0) return '❌'
    return '❓'
  }

  const obtenerTipoRespuesta = (asistio) => {
    if (asistio === 1) return 'CONFIRMADO'
    if (asistio === 0) return 'DECLINADO'
    return 'PENDIENTE'
  }

  const calcularTasaRespuesta = () => {
    const stats = estadisticasFiltradas
    if (stats.totalRespuestas === 0) return 0
    const respondidos = stats.totalConfirmados + stats.totalRechazados
    return ((respondidos / stats.totalRespuestas) * 100).toFixed(1)
  }

  if (loading && !dashboard) {
    return (
      <div className="dashboard-respuestas">
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (error && !dashboard) {
    return (
      <div className="dashboard-respuestas">
        <div className="error">
          <h3>❌ Error</h3>
          <p>{error}</p>
          <button onClick={cargarDashboard}>Reintentar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-respuestas">
      {/* Toast de Notificaciones */}
      {notification.show && (
        <div className={`toast-notification toast-${notification.type}`}>
          <span className="toast-icon">
            {notification.type === 'success' && '✅'}
            {notification.type === 'error' && '❌'}
            {notification.type === 'warning' && '⚠️'}
            {notification.type === 'info' && 'ℹ️'}
          </span>
          <span className="toast-message">{notification.message}</span>
        </div>
      )}

      <div className="dashboard-header">
        <div className="header-content">
          <h1>📊 Dashboard de Notificaciones</h1>
          <div className="whatsapp-indicator">
            <span className={`status-dot ${estadoWhatsApp.enabled && estadoWhatsApp.configured ? 'active' : 'inactive'}`}></span>
            <span className="status-text">
              WhatsApp {estadoWhatsApp.enabled && estadoWhatsApp.configured ? 'Activo' : 'Inactivo'}
            </span>
            {estadoWhatsApp.bomberosSinTelefono > 0 && (
              <span className="warning-badge">
                ⚠️ {estadoWhatsApp.bomberosSinTelefono} sin teléfono
              </span>
            )}
          </div>
        </div>
        <div className="header-actions">
          <div className="timestamp">
            Última actualización: {dashboard?.timestamp ? formatearFecha(dashboard.timestamp) : 'N/A'}
          </div>
          <div className="export-buttons">
            <button 
              className="btn-export btn-csv" 
              onClick={exportarCSV} 
              title="Exportar a CSV" 
              disabled={loadingPDF}
              aria-label="Exportar datos a formato CSV"
            >
              📥 CSV
            </button>
            <button 
              className="btn-export btn-pdf" 
              onClick={exportarPDF} 
              title="Exportar a PDF con gráficos"
              disabled={loadingPDF}
              aria-label={loadingPDF ? "Generando PDF..." : "Exportar datos a formato PDF con gráficos"}
              aria-busy={loadingPDF}
            >
              {loadingPDF ? (
                <>
                  <span className="spinner-small" role="status"></span> Generando...
                </>
              ) : (
                <>📄 PDF</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filtros-container" role="search" aria-label="Filtros de búsqueda">
        <h3>🔍 Filtros</h3>
        <div className="filtros-grid">
          <div className="filtro-item">
            <label htmlFor="fecha-desde">Fecha Desde:</label>
            <input 
              id="fecha-desde"
              type="date" 
              value={filtroFechaDesde}
              onChange={(e) => setFiltroFechaDesde(e.target.value)}
              aria-label="Filtrar desde fecha"
            />
          </div>
          <div className="filtro-item">
            <label htmlFor="fecha-hasta">Fecha Hasta:</label>
            <input 
              id="fecha-hasta"
              type="date" 
              value={filtroFechaHasta}
              onChange={(e) => setFiltroFechaHasta(e.target.value)}
              aria-label="Filtrar hasta fecha"
            />
          </div>
          <div className="filtro-item">
            <label htmlFor="tipo-incidente">Tipo de Incidente:</label>
            <select 
              id="tipo-incidente"
              value={filtroTipoIncidente}
              onChange={(e) => setFiltroTipoIncidente(e.target.value)}
              aria-label="Filtrar por tipo de incidente"
            >
              <option value="">Todos</option>
              {tiposIncidente.map(tipo => (
                <option key={tipo.idTipoIncidente} value={tipo.idTipoIncidente}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="filtro-item filtro-actions">
            <button 
              className="btn-limpiar" 
              onClick={limpiarFiltros}
              aria-label="Limpiar todos los filtros"
            >
              🗑️ Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas Generales */}
      <div className="estadisticas-generales">
        <div className="stat-card">
          <div className="stat-icon">🚨</div>
          <div className="stat-content">
            <h3>{estadisticasFiltradas.totalIncidentes}</h3>
            <p>Incidentes</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <h3>{estadisticasFiltradas.totalRespuestas}</h3>
            <p>Respuestas Totales</p>
          </div>
        </div>

        <div className="stat-card confirmado">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{estadisticasFiltradas.totalConfirmados}</h3>
            <p>Confirmados</p>
          </div>
        </div>

        <div className="stat-card declinado">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <h3>{estadisticasFiltradas.totalRechazados}</h3>
            <p>Rechazados</p>
          </div>
        </div>

        <div className="stat-card pendiente">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <h3>{estadisticasFiltradas.totalPendientes}</h3>
            <p>Pendientes</p>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>{calcularTasaRespuesta()}%</h3>
            <p>Tasa Respuesta</p>
          </div>
        </div>
      </div>

      {/* Gráfico de Tendencias */}
      {dashboard?.incidentesRecientes && dashboard.incidentesRecientes.length > 0 && (
        <TendenciasGrafico incidentes={dashboard.incidentesRecientes} />
      )}

      {/* Lista de Incidentes Recientes */}
      <div className="incidentes-recientes">
        <h2>🚒 Incidentes Recientes ({incidentesFiltrados.length})</h2>
        
        {incidentesFiltrados.length === 0 ? (
          <div className="no-data">
            <p>No hay incidentes que coincidan con los filtros seleccionados</p>
          </div>
        ) : (
          <div className="incidentes-lista">
            {incidentesFiltrados.map((incidente) => (
              <div 
                key={incidente.idIncidente} 
                className="incidente-card"
                onClick={() => cargarDetalleIncidente(incidente.idIncidente)}
              >
                <div className="incidente-header">
                  <h3>Incidente #{incidente.idIncidente}</h3>
                  <span className="fecha">{formatearFecha(incidente.fecha)}</span>
                </div>
                
                <p className="descripcion">{incidente.descripcion}</p>
                
                {incidente.nombreTipoIncidente && (
                  <div className={`tipo-badge badge-${getIncidentTypeColor(incidente.idTipoIncidente, incidente.nombreTipoIncidente)}`}>
                    {incidente.nombreTipoIncidente}
                  </div>
                )}
                
                <div className="respuestas-resumen">
                  <div className="respuesta-stat confirmado">
                    <span className="icon">✅</span>
                    <span className="count">{incidente.confirmados}</span>
                  </div>
                  <div className="respuesta-stat declinado">
                    <span className="icon">❌</span>
                    <span className="count">{incidente.rechazados}</span>
                  </div>
                  <div className="respuesta-stat pendiente">
                    <span className="icon">⏰</span>
                    <span className="count">{incidente.pendientes}</span>
                  </div>
                  <div className="total-respuestas">
                    Total: {incidente.totalRespuestas}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalle de Respuestas */}
      {respuestasDetalle && (
        <div className="modal-overlay" onClick={() => setRespuestasDetalle(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📱 Respuestas - Incidente #{incidenteSeleccionado}</h2>
              <button 
                className="close-button"
                onClick={() => setRespuestasDetalle(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Estadísticas del Incidente */}
              <div className="estadisticas-incidente">
                <div className="stat-mini confirmado">
                  <span>✅ {respuestasDetalle.estadisticas?.confirmados || 0}</span>
                </div>
                <div className="stat-mini declinado">
                  <span>❌ {respuestasDetalle.estadisticas?.rechazados || 0}</span>
                </div>
                <div className="stat-mini pendiente">
                  <span>⏰ {respuestasDetalle.estadisticas?.pendientes || 0}</span>
                </div>
                <div className="stat-mini total">
                  <span>💬 {respuestasDetalle.estadisticas?.totalRespuestas || 0}</span>
                </div>
              </div>

              {/* Lista de Respuestas */}
              <div className="respuestas-lista">
                {respuestasDetalle.respuestas.length === 0 ? (
                  <p>No hay respuestas registradas para este incidente</p>
                ) : (
                  respuestasDetalle.respuestas.map((respuesta) => (
                    <div key={respuesta.id} className="respuesta-item">
                      <div className="respuesta-icon">
                        {obtenerIconoRespuesta(respuesta.asistio)}
                      </div>
                      <div className="respuesta-info">
                        <div className="bombero-info">
                          <strong>{respuesta.nombreBombero || 'Bombero no identificado'}</strong>
                          <span className="telefono">{respuesta.telefonoBombero}</span>
                          {respuesta.viaWhatsapp && (
                            <span className="whatsapp-badge">📱 WhatsApp</span>
                          )}
                        </div>
                        <div className="respuesta-detalle">
                          <span 
                            className="tipo-respuesta"
                            style={{ 
                              color: respuesta.asistio === 1 ? '#28a745' : 
                                     respuesta.asistio === 0 ? '#dc3545' : '#ffc107' 
                            }}
                          >
                            {obtenerTipoRespuesta(respuesta.asistio)}
                          </span>
                          {respuesta.respuestaWhatsapp && (
                            <span className="respuesta-original">
                              "{respuesta.respuestaWhatsapp}"
                            </span>
                          )}
                        </div>
                        <div className="respuesta-meta">
                          <span className="fecha">{formatearFecha(respuesta.fechaRespuesta)}</span>
                          {respuesta.messageSid && (
                            <span className="message-id">ID: {respuesta.messageSid.slice(-8)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardRespuestas
