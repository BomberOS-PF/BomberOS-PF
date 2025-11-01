import React, { useState, useEffect, useMemo } from 'react'
import './DashboardRespuestas.css'
import { buildApiUrl } from '../../config/api'
import TendenciasGrafico from './TendenciasGrafico'

const DashboardRespuestas = () => {
  const [dashboard, setDashboard] = useState(null)
  const [incidenteSeleccionado, setIncidenteSeleccionado] = useState(null)
  const [respuestasDetalle, setRespuestasDetalle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
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

  const cargarDashboard = async () => {
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
  }

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
      acc.totalDeclinados += incidente.declinados || 0
      acc.totalPendientes += incidente.pendientes || 0
      return acc
    }, {
      totalIncidentes: 0,
      totalRespuestas: 0,
      totalConfirmados: 0,
      totalDeclinados: 0,
      totalPendientes: 0
    })
  }, [incidentesFiltrados])

  const limpiarFiltros = () => {
    setFiltroFechaDesde('')
    setFiltroFechaHasta('')
    setFiltroTipoIncidente('')
  }

  const exportarCSV = () => {
    if (!incidentesFiltrados || incidentesFiltrados.length === 0) {
      alert('No hay datos para exportar')
      return
    }

    // Función para formatear fecha en formato legible para CSV
    const formatearFechaCSV = (fecha) => {
      const d = new Date(fecha)
      const dia = String(d.getDate()).padStart(2, '0')
      const mes = String(d.getMonth() + 1).padStart(2, '0')
      const año = d.getFullYear()
      const horas = String(d.getHours()).padStart(2, '0')
      const minutos = String(d.getMinutes()).padStart(2, '0')
      return `${dia}/${mes}/${año} ${horas}:${minutos}`
    }

    // Función para limpiar texto y hacerlo seguro para CSV
    const limpiarTexto = (texto) => {
      if (!texto) return ''
      // Remover saltos de línea y caracteres problemáticos
      return String(texto)
        .replace(/[\r\n]+/g, ' ') // Reemplazar saltos de línea con espacio
        .replace(/"/g, '""') // Escapar comillas dobles
        .trim()
    }

    // Crear encabezados
    const headers = [
      'ID',
      'Fecha',
      'Tipo',
      'Descripcion',
      'Confirmados',
      'Declinados',
      'Pendientes',
      'Total'
    ]
    
    // Crear filas
    const rows = incidentesFiltrados.map(inc => [
      inc.idIncidente,
      formatearFechaCSV(inc.fecha),
      limpiarTexto(inc.nombreTipoIncidente || 'N/A'),
      limpiarTexto(inc.descripcion || ''),
      inc.confirmados || 0,
      inc.declinados || 0,
      inc.pendientes || 0,
      inc.totalRespuestas || 0
    ])
    
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
      }).join(';'))
    ].join('\n')
    
    // Descargar archivo con BOM para UTF-8
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    // Nombre de archivo con fecha y hora
    const ahora = new Date()
    const nombreArchivo = `BomberOS-Respuestas-${ahora.getFullYear()}${String(ahora.getMonth() + 1).padStart(2, '0')}${String(ahora.getDate()).padStart(2, '0')}-${String(ahora.getHours()).padStart(2, '0')}${String(ahora.getMinutes()).padStart(2, '0')}.csv`
    
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
    const respondidos = stats.totalConfirmados + stats.totalDeclinados
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
          <button className="btn-export" onClick={exportarCSV} title="Exportar a CSV">
            📥 Exportar CSV
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="filtros-container">
        <h3>🔍 Filtros</h3>
        <div className="filtros-grid">
          <div className="filtro-item">
            <label>Fecha Desde:</label>
            <input 
              type="date" 
              value={filtroFechaDesde}
              onChange={(e) => setFiltroFechaDesde(e.target.value)}
            />
          </div>
          <div className="filtro-item">
            <label>Fecha Hasta:</label>
            <input 
              type="date" 
              value={filtroFechaHasta}
              onChange={(e) => setFiltroFechaHasta(e.target.value)}
            />
          </div>
          <div className="filtro-item">
            <label>Tipo de Incidente:</label>
            <select 
              value={filtroTipoIncidente}
              onChange={(e) => setFiltroTipoIncidente(e.target.value)}
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
            <button className="btn-limpiar" onClick={limpiarFiltros}>
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
            <h3>{estadisticasFiltradas.totalDeclinados}</h3>
            <p>Declinados</p>
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
                  <div className="tipo-badge">{incidente.nombreTipoIncidente}</div>
                )}
                
                <div className="respuestas-resumen">
                  <div className="respuesta-stat confirmado">
                    <span className="icon">✅</span>
                    <span className="count">{incidente.confirmados}</span>
                  </div>
                  <div className="respuesta-stat declinado">
                    <span className="icon">❌</span>
                    <span className="count">{incidente.declinados}</span>
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
                  <span>❌ {respuestasDetalle.estadisticas?.declinados || 0}</span>
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
