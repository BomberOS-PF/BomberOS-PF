import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import ReactApexChart from 'react-apexcharts'
import { BarChart3, Calendar, Filter, Loader2 } from 'lucide-react'
import { API_URLS, apiRequest } from '../../../config/api.js'
import { BackToMenuButton } from '../../Common/Button.jsx'
import './ReporteIncidentes.css'

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
  if (!f) return null
  const s = typeof f === 'string' ? f.replace(' ', 'T') : f
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

const filtrarPorRango = (arr, { desde, hasta }) => {
  const startDate = new Date(`${desde}T00:00:00`)
  const endDate = new Date(`${hasta}T23:59:59`)
  return arr.filter(x => {
    const f = parseFecha(x.fecha || x.fechaIncidente || x.fechaHora || x.createdAt || x.updatedAt)
    return f && f >= startDate && f <= endDate
  })
}

// Paginación usando el MISMO contrato que ConsultarIncidente
const fetchTodasLasPaginasPorPeriodo = async ({ desde, hasta }, limite = 200, maxPages = 1000) => {
  let pagina = 1
  const acumulado = []
  let total = null
  while (pagina <= maxPages) {
    const params = new URLSearchParams({ pagina: String(pagina), limite: String(limite) })
    if (desde) params.append('desde', desde)
    if (hasta) params.append('hasta', hasta)
    const url = `${API_URLS.incidentes.getAll}?${params.toString()}`
    const res = await apiRequest(url, { method: 'GET' })
    const pageItems = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : (res?.data || [])
    const pageTotal = typeof res?.total === 'number'
      ? res.total
      : (Array.isArray(res) ? res.length : (Array.isArray(res?.data) ? res.data.length : 0))
    if (total == null) total = pageTotal
    acumulado.push(...pageItems)
    if (acumulado.length >= total) break
    if (pageItems.length < limite) break
    pagina += 1
  }
  return { items: acumulado, total: total ?? acumulado.length }
}

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

// ===== ApexCharts: obtener categoría del click =====
const getCategoriaFromEvent = (chartCtx, config) => {
  const byX = chartCtx?.w?.config?.xaxis?.categories?.[config?.dataPointIndex]
  if (byX) return byX
  const byGlobals = chartCtx?.w?.globals?.labels?.[config?.dataPointIndex]
  if (byGlobals) return byGlobals
  const byCatLabels = chartCtx?.w?.globals?.categoryLabels?.[config?.dataPointIndex]
  if (byCatLabels) return byCatLabels
  return null
}

// ===== Helpers de LOCALIZACIÓN =====
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
  if (it.localizacionDescripcion) return it.localizacionDescripcion
  if (typeof it.ubicacion === 'string') return it.ubicacion
  if (typeof it.direccion === 'string') return it.direccion
  const lat = it.lat ?? it.latitud
  const lng = it.lng ?? it.longitud ?? it.lon
  if (lat != null && lng != null) return `(${lat}, ${lng})`
  if (it.idLocalizacion != null) return `Localización #${it.idLocalizacion}`
  return '-'
}

// ===== Scroll helpers: detectar contenedor y llevar al inicio exacto =====
const isScrollable = (el) => {
  if (!el) return false
  const style = window.getComputedStyle(el)
  const oy = style.overflowY
  return (oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight
}
const getScrollableParent = (el) => {
  let p = el?.parentElement
  while (p) {
    if (isScrollable(p)) return p
    p = p.parentElement
  }
  return window // fallback
}
const scrollToElementStart = (el, offset = 0) => {
  const parent = getScrollableParent(el)
  if (parent === window) {
    const top = el.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top, behavior: 'smooth' })
  } else {
    const parentRect = parent.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const target = parent.scrollTop + (elRect.top - parentRect.top) - offset
    parent.scrollTo({ top: target, behavior: 'smooth' })
  }
}

const ReporteIncidentes = ({ onVolver }) => {
  const [modo, setModo] = useState('anual')
  const [anio, setAnio] = useState(now.getFullYear())
  const [mes01, setMes01] = useState(now.getMonth() + 1)

  const [datos, setDatos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  // Drill-down
  const [detalleAbierto, setDetalleAbierto] = useState(false)
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null) // { id, nombre }
  const [detalleItems, setDetalleItems] = useState([])
  const [detalleCargando, setDetalleCargando] = useState(false)
  const [detalleError, setDetalleError] = useState('')

  // Enfoque/scroll a la card
  const detalleRef = useRef(null)
  const [pendingFocusDetalle, setPendingFocusDetalle] = useState(false)
  const SCROLL_OFFSET = 0 // si tenés header sticky, poné su altura (p.ej., 80)

  const rango = useMemo(() => construirRango({ modo, anio, mes01 }), [modo, anio, mes01])

  const traerIncidentes = async () => {
    setCargando(true); setError(''); setDatos([])
    try {
      const { items } = await fetchTodasLasPaginasPorPeriodo(rango, 200)
      setDatos(filtrarPorRango(items, rango))
      setDetalleAbierto(false); setTipoSeleccionado(null); setDetalleItems([]); setDetalleError('')
    } catch {
      setError('No se pudieron obtener incidentes para el período seleccionado'); setDatos([])
    } finally { setCargando(false) }
  }

  // KPIs
  const kpiTotal = useMemo(() => datos.length, [datos])
  const kpiTopTipo = useMemo(() => {
    if (!datos.length) return { nombre: '-', cantidad: 0, porcentaje: 0 }
    const conteo = datos.reduce((acc, it) => {
      const nombre = it.tipoDescripcion || (it.idTipoIncidente != null ? `Tipo ${it.idTipoIncidente}` : 'Sin tipo')
      acc[nombre] = (acc[nombre] || 0) + 1
      return acc
    }, {})
    const [nombre, cantidad] = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0]
    const porcentaje = kpiTotal > 0 ? ((cantidad / kpiTotal) * 100) : 0
    return { nombre, cantidad, porcentaje: Number(porcentaje.toFixed(1)) }
  }, [datos, kpiTotal])
  const kpiPromedioDia = useMemo(() => {
    if (!datos.length) return 0
    const inicio = new Date(`${rango.desde}T00:00:00`)
    const fin = new Date(`${rango.hasta}T23:59:59`)
    const dias = Math.max(1, Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)))
    return Number((kpiTotal / dias).toFixed(2))
  }, [datos, rango, kpiTotal])

  // Series
  const conteoPorTipo = useMemo(() => {
    const acc = new Map()
    datos.forEach(it => {
      const nombreTipo = it.tipoDescripcion || (it.idTipoIncidente != null ? `Tipo ${it.idTipoIncidente}` : 'Sin tipo')
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

  // Drill-down helpers
  const inferirIdTipoDesdeNombre = useCallback((nombreTipo) => {
    if (!nombreTipo) return null
    const lower = String(nombreTipo).toLowerCase()
    if (lower.includes('accidente') && (lower.includes('trán') || lower.includes('tran'))) return 1
    const ids = [
      ...new Set(
        datos
          .filter(d => (d.tipoDescripcion || (d.idTipoIncidente != null ? `Tipo ${d.idTipoIncidente}` : 'Sin tipo')) === nombreTipo)
          .map(d => d.idTipoIncidente)
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
      setDetalleItems([]); setPendingFocusDetalle(true)
      return
    }
    setTipoSeleccionado({ id: tipoId, nombre: categoriaNombre })
    setDetalleAbierto(true); setDetalleCargando(true); setDetalleError(''); setDetalleItems([])
    setPendingFocusDetalle(true)

    try {
      const params = new URLSearchParams({ pagina: '1', limite: '50', desde: rango.desde, hasta: rango.hasta, tipo: String(tipoId) })
      const url = `${API_URLS.incidentes.getAll}?${params.toString()}`
      const res = await apiRequest(url, { method: 'GET' })
      const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : (res?.data || [])
      setDetalleItems(items)
    } catch {
      setDetalleError('No se pudo cargar el detalle del tipo seleccionado'); setDetalleItems([])
    } finally { setDetalleCargando(false) }
  }, [inferirIdTipoDesdeNombre, rango])

  // >>> Scroll EXACTO al inicio de la card (maneja contenedor scrollable)
  useEffect(() => {
    if (detalleAbierto && pendingFocusDetalle) {
      const el = detalleRef.current
      if (el) {
        // Esperar a que el DOM pinte (dos frames por seguridad)
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            scrollToElementStart(el, SCROLL_OFFSET)
            try { el.focus({ preventScroll: true }) } catch {}
            setPendingFocusDetalle(false)
          })
        })
      } else {
        setPendingFocusDetalle(false)
      }
    }
  }, [detalleAbierto, pendingFocusDetalle])

  const options = useMemo(() => ({
    chart: {
      type: 'bar',
      toolbar: { show: true },
      events: {
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

  const tituloPeriodo = useMemo(() => {
    if (modo === 'anual') return `Período ${anio}`
    const nomMes = meses.find(m => m.value === mes01)?.label || mes01
    return `Período ${nomMes} ${anio}`
  }, [modo, anio, mes01])

  const hayDatos = series[0]?.data?.length > 0

  // Table mappers
  const getId = it => it.idIncidente ?? it.id ?? it.ID ?? it.id_incidente ?? '-'
  const getFecha = it => it.fecha ?? it.fechaIncidente ?? it.fechaHora ?? it.createdAt ?? it.updatedAt ?? '-'
  const getDescripcion = it => it.descripcion ?? it.descripcionIncidente ?? it.detalle ?? '-'

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
      </div>

      <div className='card edge-to-edge shadow-sm border-0 bg-white bg-opacity-1 backdrop-blur-sm'>
        <div className='card-header bg-danger text-white d-flex align-items-center gap-2 py-4'>
          <Calendar />
          <strong>Filtros del Reporte</strong>
        </div>

        <div className='card-body'>
          <div className='row g-3 align-items-end filtros-reporte'>
            <div className='col-12 col-md-3'>
              <label className='form-label text-dark fw-semibold'>Modo</label>
              <div className='btn-group w-100' role='group'>
                <button className={`btn btn-sm ${modo === 'anual' ? 'btn-danger' : 'btn-outline-danger'}`} onClick={() => setModo('anual')}>Anual</button>
                <button className={`btn btn-sm ${modo === 'mensual' ? 'btn-danger' : 'btn-outline-danger'}`} onClick={() => setModo('mensual')}>Mensual</button>
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
              <button className='btn btn-danger w-100 btn-sm' onClick={traerIncidentes} disabled={cargando}>
                {cargando ? (<><Loader2 className='spin me-1' size={16} /> Generando…</>) : 'Generar'}
              </button>
            </div>
          </div>

          {error && (<div className='alert alert-danger mt-3'>{error}</div>)}

          {/* KPIs */}
          <div className="row g-3 mb-4 text-center mt-4">
            <div className="col-md-3">
              <div className="card shadow-sm border-0 bg-danger text-white h-100">
                <div className="card-body">
                  <h6 className="text-uppercase fw-bold mb-1">Total incidentes</h6>
                  <h2 className="fw-bolder mb-0">{kpiTotal}</h2>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card shadow-sm border-0 bg-dark text-white h-100">
                <div className="card-body">
                  <h6 className="text-uppercase fw-bold mb-1">Top tipo</h6>
                  <h5 className="fw-semibold mb-0">{kpiTopTipo.nombre}</h5>
                  <small>{kpiTopTipo.cantidad} ({kpiTopTipo.porcentaje}%)</small>
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
                <ReactApexChart options={options} series={series} type='bar' height={360} />

                {detalleAbierto && (
                  <div
                    className='card mt-4 shadow-sm'
                    ref={detalleRef}
                    tabIndex={-1}
                    aria-label='Detalle de incidentes por tipo'
                  >
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
              className='btn btn-outline-secondary btn-sm'
              onClick={() => {
                setError('')
                setDatos([])
                setDetalleAbierto(false)
                setTipoSeleccionado(null)
                setDetalleItems([])
                setDetalleError('')
                setPendingFocusDetalle(false)
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

export default ReporteIncidentes
