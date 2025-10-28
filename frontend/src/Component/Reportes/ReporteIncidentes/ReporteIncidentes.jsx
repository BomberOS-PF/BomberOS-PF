// frontend/src/Component/Reportes/ReporteIncidentes/ReporteIncidentes.jsx
import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import ReactApexChart from 'react-apexcharts'
import { BarChart3, Calendar, Filter, Loader2 } from 'lucide-react'
import { API_URLS, apiRequest } from '../../../config/api.js'
import { BackToMenuButton } from '../../Common/Button.jsx'
import './ReporteIncidentes.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import html2canvas from 'html2canvas'

/* =========================
   Helpers de fecha y rango
========================= */
const now = new Date()
const pad2 = n => String(n).padStart(2, '0')

const ultimoDiaMes = (anio, mes01) => {
  const d = new Date(anio, mes01, 0)
  return d.getDate()
}

const construirRango = ({ modo, anio, mes01 }) => {
  if (modo === 'anual') return { desde: `${anio}-01-01`, hasta: `${anio}-12-31` }
  const last = ultimoDiaMes(anio, mes01)
  return { desde: `${anio}-${pad2(mes01)}-01`, hasta: `${anio}-${pad2(mes01)}-${pad2(last)}` }
}

const parseFecha = f => {
  try {
    if (!f) return null
    const s = typeof f === 'string' ? f.replace(' ', 'T') : f
    const d = new Date(s)
    return isNaN(d.getTime()) ? null : d
  } catch { return null }
}

const filtrarPorRango = (arr, { desde, hasta }) => {
  try {
    const startDate = new Date(`${desde}T00:00:00`)
    const endDate = new Date(`${hasta}T23:59:59`)
    if (isNaN(startDate) || isNaN(endDate)) return Array.isArray(arr) ? arr : []
    return (arr || []).filter(x => {
      const f = parseFecha(x?.fecha || x?.fechaIncidente || x?.fechaHora || x?.createdAt || x?.updatedAt)
      return f && f >= startDate && f <= endDate
    })
  } catch { return Array.isArray(arr) ? arr : [] }
}

/* =========================
   Fetch paginado
========================= */
const fetchTodasLasPaginasPorPeriodo = async ({ desde, hasta }, limite = 200, maxPages = 1000) => {
  if (!API_URLS?.incidentes?.getAll) throw new Error('API_URLS.incidentes.getAll no está definido')

  let pagina = 1
  const acumulado = []
  let total = null

  while (pagina <= maxPages) {
    const params = new URLSearchParams({ pagina: String(pagina), limite: String(limite) })
    if (desde) params.append('desde', desde)
    if (hasta) params.append('hasta', hasta)
    const url = `${API_URLS.incidentes.getAll}?${params.toString()}`

    const res = await apiRequest(url, { method: 'GET' }).catch(err => {
      console.error('Error apiRequest:', err)
      throw new Error('Falló la petición al backend de incidentes')
    })

    const pageItems = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res)
      ? res
      : Array.isArray(res?.items)
      ? res.items
      : []

    const pageTotal = Number.isFinite(res?.total)
      ? Number(res.total)
      : (Array.isArray(res?.data) ? res.data.length : Array.isArray(res) ? res.length : pageItems.length)

    if (total == null) total = pageTotal
    acumulado.push(...pageItems)

    if (acumulado.length >= total) break
    if (pageItems.length < limite) break
    pagina += 1
  }

  return { items: acumulado, total: total ?? acumulado.length }
}

/* =========================
   Constantes UI
========================= */
const meses = [
  { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
]

const aniosPorDefecto = (() => {
  const y = now.getFullYear()
  return [y - 3, y - 2, y - 1, y, y + 1]
})()

/* =========================
   Utilidades de UI
========================= */
const getCategoriaFromEvent = (chartCtx, config) => {
  const byX = chartCtx?.w?.config?.xaxis?.categories?.[config?.dataPointIndex]
  if (byX) return byX
  const byGlobals = chartCtx?.w?.globals?.labels?.[config?.dataPointIndex]
  if (byGlobals) return byGlobals
  const byCatLabels = chartCtx?.w?.globals?.categoryLabels?.[config?.dataPointIndex]
  if (byCatLabels) return byCatLabels
  return null
}

const getLocalizacionDesdeObjeto = (o) => {
  if (!o || typeof o !== 'object') return ''
  const direccion = o.direccion ?? o.descripcion ?? ''
  const calle = o.calle ?? o.calleNombre
  const altura = o.altura ?? o.numero ?? o.alt
  const barrio = o.barrio
  const ciudad = o.ciudad ?? o.localidad ?? o.poblacion
  const provincia = o.provincia ?? o.depto ?? o.region
  const lat = o.lat ?? o.latitud
  const lng = o.lng ?? o.longitud ?? o.lon

  const partes = []
  if (direccion) partes.push(direccion)
  else {
    const calleAltura = [calle, altura].filter(Boolean).join(' ')
    if (calleAltura) partes.push(calleAltura)
  }
  if (barrio) partes.push(barrio)
  if (ciudad) partes.push(ciudad)
  if (provincia) partes.push(provincia)

  let txt = partes.join(', ')
  if (!txt && (lat != null && lng != null)) txt = `(${lat}, ${lng})`
  else if (txt && (lat != null && lng != null)) txt += ` (${lat}, ${lng})`
  return txt
}

const getLocalizacionTexto = (it) => {
  if (typeof it?.localizacion === 'string') {
    const s = it.localizacion.trim()
    if (!s) return '-'
    if (s.startsWith('{') || s.startsWith('[')) {
      try { const obj = JSON.parse(s); return getLocalizacionDesdeObjeto(obj) || s } catch { return s }
    }
    return s
  }
  if (it?.localizacion && typeof it.localizacion === 'object') {
    const txt = getLocalizacionDesdeObjeto(it.localizacion)
    if (txt) return txt
  }
  const txtRoot = getLocalizacionDesdeObjeto(it)
  if (txtRoot) return txtRoot
  if (it?.localizacionDescripcion) return it.localizacionDescripcion
  if (typeof it?.ubicacion === 'string') return it.ubicacion
  if (typeof it?.direccion === 'string') return it.direccion
  const lat = it?.lat ?? it?.latitud
  const lng = it?.lng ?? it?.longitud ?? it?.lon
  if (lat != null && lng != null) return `(${lat}, ${lng})`
  if (it?.idLocalizacion != null) return `Localización #${it.idLocalizacion}`
  return '-'
}

/* =========================
   Export helpers + Logo + Header
========================= */
const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Carga una imagen y devuelve dataURL (ideal para /public)
const loadImageDataURL = (url) => new Promise((resolve, reject) => {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    } catch (e) { reject(e) }
  }
  img.onerror = () => reject(new Error('No se pudo cargar el logo'))
  img.src = url
})

// Dibuja encabezado con barra roja + logo + título y devuelve Y inicial
const drawHeader = (doc, { logoDataUrl, title = 'Reporte de Incidentes' }) => {
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 32
  const headerH = 64

  doc.setFillColor(213, 43, 30)
  doc.rect(0, 0, pageW, headerH, 'F')

  if (logoDataUrl) {
    const logoH = 40
    const logoW = 40
    const xLogo = margin
    const yLogo = (headerH - logoH) / 2
    doc.addImage(logoDataUrl, 'PNG', xLogo, yLogo, logoW, logoH)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.text(title, xLogo + logoW + 12, 40)
  } else {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.text(title, margin, 40)
  }

  return headerH + 20
}

/* =========================================================
   ErrorBoundary global
========================================================= */
function ErrorBoundary({ children }) {
  const [err, setErr] = React.useState(null)

  React.useEffect(() => {
    const onError = (e) => { console.error('Global error:', e?.error || e?.message || e); setErr(e?.error || new Error(e?.message || 'Error')) }
    const onUnhandled = (e) => { console.error('Unhandled rejection:', e?.reason); setErr(e?.reason || new Error('Promesa rechazada')) }
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandled)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandled)
    }
  }, [])

  if (err) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          <b>Ocurrió un error al renderizar el reporte.</b><br/>
          Revisá la consola del navegador (F12) para el detalle técnico.<br/>
          Mensaje: {String(err?.message || err)}
        </div>
      </div>
    )
  }
  return children
}

/* =========================================================
   ChartShell (toolbar de ApexCharts deshabilitada)
========================================================= */
function ChartShell ({ options, series, chartId, height = 360, onMountedRef }) {
  const hostRef = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let raf1, raf2
    raf1 = requestAnimationFrame(() => {
      if (!hostRef.current) return
      raf2 = requestAnimationFrame(() => setReady(true))
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      setReady(false)
      if (onMountedRef) onMountedRef.current = false
    }
  }, [options?.xaxis?.categories?.join('|'), JSON.stringify(series?.[0]?.data || [])])

  const handleMounted = () => {
    if (onMountedRef) onMountedRef.current = true
  }

  return (
    <div ref={hostRef} style={{ minHeight: height }}>
      {ready && (
        <ReactApexChart
          key={`${chartId}-${options?.xaxis?.categories?.join('|') || 'nocat'}`}
          options={{
            ...options,
            chart: {
              ...options?.chart,
              id: chartId,
              animations: { enabled: false },
              parentHeightOffset: 0,
              redrawOnParentResize: true,
              redrawOnWindowResize: true,
              toolbar: { show: false }, // ocultar menú ApexCharts
              events: {
                ...(options?.chart?.events || {}),
                mounted: (...args) => {
                  handleMounted()
                  options?.chart?.events?.mounted?.(...args)
                },
                updated: (...args) => {
                  handleMounted()
                  options?.chart?.events?.updated?.(...args)
                }
              }
            }
          }}
          series={series}
          type='bar'
          height={height}
        />
      )}
    </div>
  )
}

/* =========================================================
   Helpers para "Generado por"
========================================================= */
const leerJSON = k => {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null } catch { return null }
}
const obtenerNombreUsuario = () => {
  const u = leerJSON('user') || leerJSON('authUser') || leerJSON('usuario') || leerJSON('currentUser') || leerJSON('auth') || {}
  const nombre = u?.nombre ?? u?.bombero?.nombre
  const apellido = u?.apellido ?? u?.bombero?.apellido
  const full = [nombre, apellido].filter(Boolean).join(' ').trim()
  return full || u?.nombreCompleto || u?.displayName || u?.usuario || u?.email || '-'
}

/* =========================
   Componente principal
========================= */
function ReporteIncidentesCore({ onVolver }) {
  const [modo, setModo] = useState('anual')
  const [anio, setAnio] = useState(now.getFullYear())
  const [mes01, setMes01] = useState(now.getMonth() + 1)

  const [datos, setDatos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  // Nombre de usuario para "Generado por" (solo PDF)
  const [nombreUsuario, setNombreUsuario] = useState('-')
  useEffect(() => { setNombreUsuario(obtenerNombreUsuario()) }, [])

  // Drill-down
  const [detalleAbierto, setDetalleAbierto] = useState(false)
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null)
  const [detalleItems, setDetalleItems] = useState([])
  const [detalleCargando, setDetalleCargando] = useState(false)
  const [detalleError, setDetalleError] = useState('')

  // Refs
  const detalleRef = useRef(null)
  const [pendingFocusDetalle, setPendingFocusDetalle] = useState(false)

  const CHART_ID = 'incidentes-chart'
  const chartMountedRef = useRef(false)

  // Refs de captura para exportación DOM→imagen
  const kpisRef = useRef(null)          // contenedor KPIs
  const chartBoxRef = useRef(null)      // contenedor del gráfico
  const exportRef = useRef(null)        // contenedor del botón Exportar (para ocultarlo durante la captura)

  // Dropdown Exportar
  const [showExport, setShowExport] = useState(false)
  useEffect(() => {
    const onDocClick = e => { if (!exportRef.current) return; if (!exportRef.current.contains(e.target)) setShowExport(false) }
    const onEsc = e => { if (e.key === 'Escape') setShowExport(false) }
    document.addEventListener('click', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('click', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [])

  const rango = useMemo(() => construirRango({ modo, anio, mes01 }), [modo, anio, mes01])

  const traerIncidentes = async () => {
    setCargando(true); setError(''); setDatos([])
    setDetalleAbierto(false); setTipoSeleccionado(null); setDetalleItems([]); setDetalleError('')
    chartMountedRef.current = false
    try {
      const { items } = await fetchTodasLasPaginasPorPeriodo(rango, 200)
      const filtrados = filtrarPorRango(items, rango)
      setDatos(Array.isArray(filtrados) ? filtrados : [])
    } catch (e) {
      console.error(e)
      setError(e?.message || 'No se pudieron obtener incidentes para el período seleccionado')
      setDatos([])
    } finally { setCargando(false) }
  }

  /* ====== Export: CSV ====== */
  const csvEscape = (v) => {
    const s = (v ?? '').toString()
    if (s.includes('"') || s.includes(',') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const getId = it => it?.idIncidente ?? it?.id ?? it?.ID ?? it?.id_incidente ?? '-'
  const getFecha = it => it?.fecha ?? it?.fechaIncidente ?? it?.fechaHora ?? it?.createdAt ?? it?.updatedAt ?? '-'
  const getDescripcion = it => it?.descripcion ?? it?.descripcionIncidente ?? it?.detalle ?? '-'

  const exportCSV = () => {
    const fuente = detalleAbierto ? detalleItems : datos
    const rows = [
      ['ID', 'Fecha', 'Descripción', 'Localización'],
      ...fuente.map(it => [getId(it), getFecha(it), getDescripcion(it), getLocalizacionTexto(it)])
    ]
    const csv = rows.map(r => r.map(csvEscape).join(',')).join('\n')
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
      `incidentes_${rango.desde}_${rango.hasta}${detalleAbierto ? '_detalle' : ''}.csv`)
  }

  /* ====== Export: PNG del gráfico ====== */
  const exportPNG = async () => {
    try {
      if (!chartBoxRef.current) throw new Error('El contenedor del gráfico no está listo')
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
      const canvas = await html2canvas(chartBoxRef.current, { backgroundColor: '#ffffff', useCORS: true, scale: 2, logging: false })
      canvas.toBlob(blob => {
        if (!blob) throw new Error('No se pudo generar la imagen')
        downloadBlob(blob, `grafico_incidentes_${rango.desde}_${rango.hasta}.png`)
      })
    } catch (e) {
      console.error('exportPNG error:', e)
      alert(`No se pudo exportar el gráfico a PNG: ${e?.message || e}`)
    }
  }

  /* ====== Export: PDF (KPIs + Gráfico + Listado COMPLETO con paginado) ====== */
  const exportPDF = async () => {
    try {
      const [{ default: jsPDF }] = await Promise.all([
        import('jspdf')
      ])
      // importa y registra autotable (si está instalada)
      try { await import('jspdf-autotable') } catch {}

      // ocultamos el dropdown durante la captura
      const exportNode = exportRef.current
      const prevDisplay = exportNode ? exportNode.style.display : null
      if (exportNode) exportNode.style.display = 'none'

      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))

      if (!kpisRef.current) throw new Error('Los KPIs no están listos')
      if (!chartBoxRef.current) throw new Error('El contenedor del gráfico no está listo')

      const [kpiCanvas, chartCanvas] = await Promise.all([
        html2canvas(kpisRef.current, { backgroundColor: '#ffffff', useCORS: true, scale: 2, logging: false }),
        html2canvas(chartBoxRef.current, { backgroundColor: '#ffffff', useCORS: true, scale: 2, logging: false })
      ])

      if (exportNode) exportNode.style.display = prevDisplay ?? ''

      const kpiImg = kpiCanvas.toDataURL('image/png')
      const chartImg = chartCanvas.toDataURL('image/png')

      const doc = new jsPDF({ orientation: 'l', unit: 'pt', format: 'a4' })
      const pageW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()
      const margin = 32
      const innerW = pageW - margin * 2

      // logo + encabezado
      let logoDataUrl = null
      try { logoDataUrl = await loadImageDataURL('/img/logo-bomberos.png') } catch {}
      let y = drawHeader(doc, { logoDataUrl, title: 'Reporte de Incidentes' })
      doc.setTextColor(0, 0, 0)
      doc.setFont('helvetica', 'normal')

      // metadatos
      const fechaEmision = new Date().toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })
      const periodoTexto = (() => {
        if (modo === 'anual') return `Período: Anual • Año ${anio}`
        const nomMes = meses.find(m => m.value === mes01)?.label || mes01
        return `Período: Mensual • ${nomMes} ${anio}`
      })()

      doc.setFontSize(12)
      doc.text(`Fecha de emisión: ${fechaEmision}`, margin, y); y += 18
      doc.text(periodoTexto, margin, y); y += 16
      // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
      // *** Generado por (SOLO EN PDF, debajo del período) ***
      doc.text(`Generado por: ${nombreUsuario}`, margin, y); y += 16
      // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

      // KPIs
      const kpiTargetW = innerW
      const kpiScale = kpiTargetW / kpiCanvas.width
      const kpiH = kpiCanvas.height * kpiScale
      doc.addImage(kpiImg, 'PNG', margin, y, kpiTargetW, kpiH)
      y += kpiH + 16

      // título gráfico
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('Incidentes por tipo', margin, y); y += 8
      doc.setFont('helvetica', 'normal')

      // gráfico
      const chartTargetW = innerW
      const chartScale = chartTargetW / chartCanvas.width
      const chartH = chartCanvas.height * chartScale
      const maxH = pageH - y - 24
      const finalChartH = Math.min(chartH, maxH)
      const finalChartW = chartCanvas.width * (finalChartH / chartCanvas.height)
      doc.addImage(chartImg, 'PNG', margin, y, finalChartW, finalChartH)

      /* =========================
         LISTADO COMPLETO + PAGINADO EN PDF
      ========================== */
      const fuenteListado = Array.isArray(datos) ? datos : []
      const fuenteOrdenada = [...fuenteListado].sort((a, b) => {
        const fa = parseFecha(getFecha(a))?.getTime() ?? 0
        const fb = parseFecha(getFecha(b))?.getTime() ?? 0
        return fb - fa
      })

      const tituloListado = `Listado de incidentes considerados (${fuenteOrdenada.length})`

      if (typeof doc.autoTable === 'function') {
        const totalPagesExp = '{total_pages_count_string}'
        doc.addPage()
        const top = drawHeader(doc, { logoDataUrl, title: 'Reporte de Incidentes' })
        doc.setTextColor(0, 0, 0)
        doc.setFont('helvetica', 'bold'); doc.setFontSize(12)
        doc.text(tituloListado, margin, top)
        doc.setFont('helvetica', 'normal')

        const rows = fuenteOrdenada.map(it => ([
          String(getId(it) ?? ''),
          String(getFecha(it) ?? ''),
          String(getDescripcion(it) ?? ''),
          String(getLocalizacionTexto(it) ?? '')
        ]))

        doc.autoTable({
          startY: top + 18,
          margin: { left: margin, right: margin },
          head: [['ID', 'Fecha', 'Descripción', 'Localización']],
          body: rows,
          theme: 'grid',
          styles: { font: 'helvetica', fontSize: 10, fontStyle: 'normal', cellPadding: 4, overflow: 'linebreak', textColor: [20,20,20] },
          headStyles: { fillColor: [213, 43, 30], textColor: 255, fontStyle: 'bold', halign: 'left' },
          alternateRowStyles: { fillColor: [245,245,245] },
          tableLineColor: [200,200,200],
          tableLineWidth: 0.5,
          didDrawPage: (data) => {
            const str = (typeof doc.putTotalPages === 'function')
              ? `Página ${doc.internal.getNumberOfPages()} de ${totalPagesExp}`
              : `Página ${doc.internal.getNumberOfPages()}`
            doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
            doc.text(
              str,
              doc.internal.pageSize.getWidth() - data.settings.margin.right,
              doc.internal.pageSize.getHeight() - 10,
              { align: 'right' }
            )
          }
        })

        if (typeof doc.putTotalPages === 'function') {
          doc.putTotalPages(totalPagesExp)
        }
      } else {
        // Fallback manual sin autoTable
        const pageW2 = doc.internal.pageSize.getWidth()
        const pageH2 = doc.internal.pageSize.getHeight()
        const margin2 = 32
        const col = {
          id:    { x: margin2,       w: 90,  label: 'ID' },
          fecha: { x: margin2 + 90,  w: 120, label: 'Fecha' },
          desc:  { x: margin2 + 210, w: 350, label: 'Descripción' },
          loc:   { x: margin2 + 560, w: (pageW2 - margin2) - (margin2 + 560), label: 'Localización' }
        }
        const lineH = 14
        const headerH = 22

        const drawTableHeader = (opts = { showTitle: true }) => {
          doc.addPage()
          const yHead = drawHeader(doc, { logoDataUrl, title: 'Reporte de Incidentes' })
          doc.setTextColor(0, 0, 0)
          doc.setFont('helvetica', 'normal')
          let yy = yHead

          if (opts.showTitle) {
            doc.setFont('helvetica', 'bold'); doc.setFontSize(12)
            doc.text(tituloListado, margin2, yy)
            yy += 10
            doc.setFont('helvetica', 'normal')
          }

          doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.5)
          doc.line(margin2, yy, pageW2 - margin2, yy)
          yy += 10

          doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
          doc.text(col.id.label, col.id.x, yy)
          doc.text(col.fecha.label, col.fecha.x, yy)
          doc.text(col.desc.label, col.desc.x, yy)
          doc.text(col.loc.label, col.loc.x, yy)
          yy += headerH

          doc.setFont('helvetica', 'normal')
          return yy
        }

        const addFooter = () => {
          const pageNumber = doc.internal.getNumberOfPages()
          doc.setFont('helvetica','normal'); doc.setFontSize(10)
          doc.text(`Página ${pageNumber}`, pageW2 - margin2, pageH2 - 10, { align: 'right' })
        }

        const addDetailRows = (yy, items) => {
          doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
          doc.setTextColor(0, 0, 0)
          let yCursor = yy

          const safe = v => (v == null ? '' : String(v))

          for (const it of items) {
            const idTxt = safe(getId(it))
            const fechaTxt = safe(getFecha(it))
            const descTxt = doc.splitTextToSize(safe(getDescripcion(it)), col.desc.w - 4)
            const locTxt = doc.splitTextToSize(safe(getLocalizacionTexto(it)), col.loc.w - 4)

            const lines = Math.max(descTxt.length, locTxt.length, 1)
            const rowHeight = 6 + lines * lineH + 6

            if (yCursor + rowHeight > pageH2 - 32) {
              addFooter()
              yCursor = drawTableHeader({ showTitle: false })
            }

            doc.setDrawColor(245,245,245); doc.setLineWidth(0.5)
            doc.line(margin2, yCursor - 10, pageW2 - margin2, yCursor - 10)

            doc.setFont('helvetica', 'normal')
            doc.text(idTxt, col.id.x, yCursor)
            doc.text(fechaTxt, col.fecha.x, yCursor)

            let yText = yCursor
            for (let i = 0; i < descTxt.length; i++) { doc.text(descTxt[i], col.desc.x, yText); yText += lineH }

            yText = yCursor
            for (let i = 0; i < locTxt.length; i++) { doc.text(locTxt[i], col.loc.x, yText); yText += lineH }

            yCursor += rowHeight
          }
          return yCursor
        }

        const yDetailStart = drawTableHeader({ showTitle: true })
        if (fuenteOrdenada.length) {
          addDetailRows(yDetailStart, fuenteOrdenada)
          addFooter()
        } else {
          doc.setFont('helvetica', 'normal'); doc.setFontSize(11)
          doc.setTextColor(0, 0, 0)
          doc.text('No hay incidentes en el período seleccionado.', margin2, yDetailStart)
          addFooter()
        }
      }

      doc.save(`reporte_incidentes_${rango.desde}_${rango.hasta}.pdf`)
    } catch (e) {
      console.error('exportPDF error:', e)
      alert(`No se pudo exportar el reporte a PDF: ${e?.message || e}`)
    }
  }

  /* ====== KPIs y series ====== */
  const kpiTotal = useMemo(() => (Array.isArray(datos) ? datos.length : 0), [datos])

  const kpiTopTipos = useMemo(() => {
    if (!Array.isArray(datos) || !datos.length) return []
    const conteo = datos.reduce((acc, it) => {
      const nombre = it?.tipoDescripcion || (it?.idTipoIncidente != null ? `Tipo ${it.idTipoIncidente}` : 'Sin tipo')
      acc[nombre] = (acc[nombre] || 0) + 1
      return acc
    }, {})
    const entries = Object.entries(conteo)
    if (!entries.length) return []
    const max = Math.max(...entries.map(([, c]) => c))
    return entries
      .filter(([, c]) => c === max)
      .map(([nombre, cantidad]) => ({
        nombre,
        cantidad,
        porcentaje: Number(((cantidad / (kpiTotal || 1)) * 100).toFixed(1))
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [datos, kpiTotal])

  const kpiPromedioDia = useMemo(() => {
    if (!Array.isArray(datos) || !datos.length) return 0
    const inicio = new Date(`${rango.desde}T00:00:00`)
    const fin = new Date(`${rango.hasta}T23:59:59`)
    const dias = Math.max(1, Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)))
    return Number((kpiTotal / dias).toFixed(2))
  }, [datos, rango, kpiTotal])

  const conteoPorTipo = useMemo(() => {
    const acc = new Map()
    ;(Array.isArray(datos) ? datos : []).forEach(it => {
      const nombreTipo = it?.tipoDescripcion || (it?.idTipoIncidente != null ? `Tipo ${it.idTipoIncidente}` : 'Sin tipo')
      acc.set(nombreTipo, (acc.get(nombreTipo) || 0) + 1)
    })
    return acc
  }, [datos])

  const categories = useMemo(() => {
    const pares = Array.from(conteoPorTipo.entries()).sort((a, b) => b[1] - a[1])
    return pares.map(([tipo]) => tipo)
  }, [conteoPorTipo])

  const series = useMemo(() => {
    const pares = Array.from(conteoPorTipo.entries()).sort((a, b) => b[1] - a[1])
    return [{ name: 'Incidentes', data: pares.map(([, count]) => count) }]
  }, [conteoPorTipo])

  const tituloPeriodo = useMemo(() => {
    if (modo === 'anual') return `Período ${anio}`
    const nomMes = meses.find(m => m.value === mes01)?.label || mes01
    return `Período ${nomMes} ${anio}`
  }, [modo, anio, mes01])

  const hayDatos = series?.[0]?.data?.length > 0

  /* ====== Drill-down ====== */
  const inferirIdTipoDesdeNombre = useCallback((nombreTipo) => {
    if (!nombreTipo) return null
    const lower = String(nombreTipo).toLowerCase()
    if (lower.includes('accidente') && (lower.includes('trán') || lower.includes('tran'))) return 1
    const ids = [
      ...new Set(
        (Array.isArray(datos) ? datos : [])
          .filter(d => (d?.tipoDescripcion || (d?.idTipoIncidente != null ? `Tipo ${d.idTipoIncidente}` : 'Sin tipo')) === nombreTipo)
          .map(d => d?.idTipoIncidente)
          .filter(Boolean)
      )
    ]
    return ids.length ? ids[0] : null
  }, [datos])

  const abrirDetallePorCategoria = useCallback(async (categoriaNombre) => {
    const tipoId = inferirIdTipoDesdeNombre(categoriaNombre)
    if (!tipoId) {
      setTipoSeleccionado({ id: null, nombre: categoriaNombre })
      setDetalleAbierto(true); setDetalleError('No se pudo determinar el tipo de incidente seleccionado')
      setDetalleItems([]); return
    }
    setTipoSeleccionado({ id: tipoId, nombre: categoriaNombre })
    setDetalleAbierto(true); setDetalleCargando(true); setDetalleError(''); setDetalleItems([])

    try {
      const params = new URLSearchParams({ pagina: '1', limite: '50', desde: rango.desde, hasta: rango.hasta, tipo: String(tipoId) })
      const url = `${API_URLS.incidentes.getAll}?${params.toString()}`
      const res = await apiRequest(url, { method: 'GET' })
      const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : (Array.isArray(res?.items) ? res.items : [])
      setDetalleItems(items)
    } catch (e) {
      console.error(e)
      setDetalleError('No se pudo cargar el detalle del tipo seleccionado'); setDetalleItems([])
    } finally { setDetalleCargando(false) }
  }, [inferirIdTipoDesdeNombre, rango])

  /* ====== Opciones del gráfico (sin toolbar) ====== */
  const options = useMemo(() => ({
    chart: {
      id: CHART_ID,
      type: 'bar',
      animations: { enabled: false },
      toolbar: { show: false },
      parentHeightOffset: 0,
      redrawOnParentResize: true,
      redrawOnWindowResize: true,
      events: {
        mounted: () => { chartMountedRef.current = true },
        updated: () => { chartMountedRef.current = true },
        dataPointSelection: (event, chartCtx, config) => {
          const categoria = getCategoriaFromEvent(chartCtx, config)
          if (categoria) abrirDetallePorCategoria(categoria)
        }
      }
    },
    plotOptions: { bar: { horizontal: false, borderRadius: 6, columnWidth: '45%' } },
    dataLabels: { enabled: true },
    xaxis: { categories },
    yaxis: { labels: { formatter: val => Math.trunc(val) } },
    tooltip: { y: { formatter: val => `${val} incidente${val === 1 ? '' : 's'}` } },
    noData: { text: 'Sin datos para el período seleccionado' }
  }), [categories, abrirDetallePorCategoria])

  return (
    <div className='container-fluid py-5 consultar-incidente registrar-guardia consultar-grupo'>
      <div className='text-center mb-4'>
        <div className='d-flex justify-content-center align-items-center gap-3 mb-3'>
          <div className='bg-danger p-3 rounded-circle'>
            <BarChart3 size={32} color='white' />
          </div>
          <h1 className='fw-bold text-white fs-3 mb-0'>Reporte de Incidentes</h1>
        </div>
        <span className='badge bg-danger-subtle text-danger'>
          <Filter className='me-2' />
          Incidentes por Tipo • {tituloPeriodo}
        </span>
        {/* Se QUITA "Generado por" del front, queda solo en el PDF */}
      </div>

      <div className='card edge-to-edge shadow-sm border-0 bg-white bg-opacity-1 backdrop-blur-sm'>
        <div className='card-header bg-danger text-white d-flex align-items-center gap-2 py-4'>
          <Calendar />
          <strong>Filtros del Reporte</strong>
        </div>

        <div className='card-body'>
          <div className='row g-3 align-items-end filtros-reporte'>
            <div className='col-12 col-md-3'>
              <label className='form-label text-dark fw-semibold'>Periodo</label>
              <div className='btn-group w-100' role='group'>
                <button className={`btn ${modo === 'anual' ? 'btn-danger' : 'btn-outline-danger'} ctrl-sm`} onClick={() => setModo('anual')}>Anual</button>
                <button className={`btn ${modo === 'mensual' ? 'btn-danger' : 'btn-outline-danger'} ctrl-sm`} onClick={() => setModo('mensual')}>Mensual</button>
              </div>
            </div>

            <div className='col-6 col-md-3'>
              <label className='form-label text-dark fw-semibold'>Año</label>
              <select className='form-select form-select-sm' value={anio} onChange={e => setAnio(parseInt(e.target.value))}>
                {aniosPorDefecto.map(y => (<option key={y} value={y}>{y}</option>))}
              </select>
            </div>

            {modo === 'mensual' && (
              <div className='col-6 col-md-3'>
                <label className='form-label text-dark fw-semibold'>Mes</label>
                <select className='form-select form-select-sm' value={mes01} onChange={e => setMes01(parseInt(e.target.value))}>
                  {meses.map(m => (<option key={m.value} value={m.value}>{m.label}</option>))}
                </select>
              </div>
            )}

            <div className='col-12 col-md-3 text-md-end'>
              <button className='btn btn-danger w-100 ctrl-sm' onClick={traerIncidentes} disabled={cargando}>
                {cargando ? (<><Loader2 className='spin me-1' size={16} /> Generando…</>) : 'Generar'}
              </button>
            </div>
          </div>

          {error && (<div className='alert alert-danger mt-3'>{error}</div>)}

          {/* KPIs + Exportar */}
          <div ref={kpisRef} className="row g-3 mb-4 text-center mt-4">
            <div className="col-md-3">
              <div className="card shadow-sm border-0 bg-danger text-white h-100">
                <div className="card-body">
                  <h6 className="text-uppercase fw-bold mb-1">Total incidentes</h6>
                  <h2 className="fw-bolder mb-0">{kpiTotal}</h2>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card shadow-sm border-0 bg-secondary text-white h-100">
                <div className="card-body">
                  <h6 className="text-uppercase fw-bold mb-1">Promedio por día</h6>
                  <h2 className="fw-bolder mb-0">{kpiPromedioDia}</h2>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card shadow-sm border-0 bg-dark text-white h-100">
                <div className="card-body">
                  <h6 className="text-uppercase fw-bold mb-1">Top tipo</h6>
                  {kpiTopTipos.length ? (
                    <>
                      <h5 className="fw-semibold mb-1">
                        {kpiTopTipos.map(t => t.nombre).join(' - ')}
                      </h5>
                      <small>
                        {kpiTopTipos[0].cantidad} ({kpiTopTipos[0].porcentaje}%)
                        {kpiTopTipos.length > 1 ? ' • empate' : ''}
                      </small>
                    </>
                  ) : (
                    <>
                      <h5 className="fw-semibold mb-0">-</h5>
                      <small>0 (0%)</small>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Único botón Exportar */}
            <div className="col-md-3">
              <div className="card shadow-sm border-0 h-100 d-flex align-items-center justify-content-center">
                <div className="p-3 w-100 text-center">
                  <div ref={exportRef} className="w-100 position-relative" style={{ zIndex: 2050 }}>
                    <button
                      type="button"
                      className="btn btn-outline-dark w-100 dropdown-toggle"
                      aria-expanded={showExport ? 'true' : 'false'}
                      onClick={(e) => { e.preventDefault(); setShowExport(s => !s) }}
                      disabled={!hayDatos}
                    >
                      Exportar
                    </button>

                    <ul
                      className={`dropdown-menu w-100 ${showExport ? 'show' : ''}`}
                      style={{ position: 'absolute', inset: 'auto 0 0 0', transform: 'translateY(100%)' }}
                      role="menu"
                    >
                      <li>
                        <button className="dropdown-item" onClick={() => { setShowExport(false); exportCSV() }} disabled={!hayDatos}>
                          Descargar CSV
                        </button>
                      </li>
                      <li>
                        <button className="dropdown-item" onClick={() => { setShowExport(false); exportPNG() }} disabled={!hayDatos}>
                          Descargar PNG
                        </button>
                      </li>
                      <li>
                        <button className="dropdown-item" onClick={() => { setShowExport(false); exportPDF() }} disabled={!hayDatos}>
                          Descargar PDF
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr className='my-3' />

          <div className='mb-3 d-flex align-items-center gap-2'>
            <BarChart3 className='text-danger' />
            <h5 className='mb-0 text-dark'>Incidentes por tipo</h5>
          </div>

          <div className='mt-2'>
            {cargando && (
              <div className='text-center py-4'>
                <div className='spinner-border' role='status'><span className='visually-hidden'>Cargando…</span></div>
                <div className='small text-muted mt-2'>Procesando datos</div>
              </div>
            )}

            {!cargando && (hayDatos ? (
              <>
                {/* Contenedor capturable del gráfico */}
                <div ref={chartBoxRef}>
                  <ChartShell
                    options={options}
                    series={series}
                    chartId={CHART_ID}
                    height={360}
                  />
                </div>

                {detalleAbierto && (
                  <div className='card mt-4 shadow-sm' ref={detalleRef} tabIndex={-1} aria-label='Detalle de incidentes por tipo'>
                    <div className='card-header d-flex align-items-center justify-content-between'>
                      <div>
                        <strong>Detalle</strong>{' '}
                        {tipoSeleccionado?.nombre ? `• ${tipoSeleccionado.nombre}` : ''}
                      </div>
                      <button
                        type='button'
                        className='btn btn-sm btn-outline-secondary'
                        onClick={() => {
                          setDetalleAbierto(false)
                          setTipoSeleccionado(null)
                          setDetalleItems([])
                          setDetalleError('')
                        }}
                      >
                        Volver al gráfico
                      </button>
                    </div>

                    <div className='card-body'>
                      {detalleCargando && (
                        <div className='text-center py-3'>
                          <div className='spinner-border' role='status'><span className='visually-hidden'>Cargando…</span></div>
                        </div>
                      )}

                      {detalleError && (<div className='alert alert-danger'>{detalleError}</div>)}

                      {!detalleCargando && !detalleError && (
                        detalleItems.length ? (
                          <div className='table-responsive'>
                            <table className='table table-sm align-middle'>
                              <thead className='table-light'>
                                <tr>
                                  <th>ID</th>
                                  <th>Fecha</th>
                                  <th>Descripción</th>
                                  <th>Localización</th>
                                </tr>
                              </thead>
                              <tbody>
                                {detalleItems.map((it, idx) => (
                                  <tr key={getId(it) || idx}>
                                    <td className='text-nowrap'>{getId(it)}</td>
                                    <td className='text-nowrap'>{getFecha(it)}</td>
                                    <td>{getDescripcion(it)}</td>
                                    <td>{getLocalizacionTexto(it)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className='text-center text-muted py-3'>
                            No hay resultados para el filtro seleccionado.
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className='text-center text-muted py-4'>
                No hay datos para mostrar. Elegí un período y presioná <b>Generar</b>.
              </div>
            ))}
          </div>

          <div className='d-flex justify-content-center align-items-center gap-3 mt-4'>
            {onVolver && <BackToMenuButton onClick={onVolver} />}
            <button
              type='button'
              className='btn btn-outline-secondary'
              onClick={() => {
                setError('')
                setDatos([])
                setDetalleAbierto(false)
                setTipoSeleccionado(null)
                setDetalleItems([])
                setDetalleError('')
                setPendingFocusDetalle(false)
                chartMountedRef.current = false
              }}
            >
              <Loader2 className='me-1' size={16} />
              Limpiar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* =========================
   Wrapper con ErrorBoundary
========================= */
export default function ReporteIncidentes (props) {
  return (
    <ErrorBoundary>
      <ReporteIncidentesCore {...props} />
    </ErrorBoundary>
  )
}
