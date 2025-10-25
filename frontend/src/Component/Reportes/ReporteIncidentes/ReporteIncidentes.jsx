import React, { useMemo, useState } from 'react'
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
  if (modo === 'anual') {
    return { desde: `${anio}-01-01`, hasta: `${anio}-12-31` }
  }
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
  // seguridad extra por si el backend no aplica el filtro
  const startDate = new Date(`${desde}T00:00:00`)
  const endDate = new Date(`${hasta}T23:59:59`)
  return arr.filter(x => {
    const f = parseFecha(x.fecha || x.fechaIncidente || x.fechaHora || x.createdAt || x.updatedAt)
    return f && f >= startDate && f <= endDate
  })
}

// Paginación usando el MISMO contrato que ConsultarIncidente: pagina/limite/desde/hasta
const fetchTodasLasPaginasPorPeriodo = async ({ desde, hasta }, limite = 200, maxPages = 1000) => {
  let pagina = 1
  const acumulado = []
  let total = null

  while (pagina <= maxPages) {
    const params = new URLSearchParams({
      pagina: String(pagina),
      limite: String(limite)
    })
    if (desde) params.append('desde', desde)
    if (hasta) params.append('hasta', hasta)

    const url = `${API_URLS.incidentes.getAll}?${params.toString()}`
    const res = await apiRequest(url, { method: 'GET' })

    // El listado que funciona interpreta así:
    // - res = { data: [], total: N }  (más común)
    // - o a veces un array directo
    const pageItems = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : (res?.data || [])
    const pageTotal = typeof res?.total === 'number'
      ? res.total
      : (Array.isArray(res) ? res.length : (Array.isArray(res?.data) ? res.data.length : 0))

    if (total == null) total = pageTotal

    acumulado.push(...pageItems)

    // corte por longitud (cuando ya descargamos todo) o cuando la página trae menos que el límite
    if (acumulado.length >= total) break
    if (pageItems.length < limite) break

    pagina += 1
  }

  return { items: acumulado, total: total ?? acumulado.length }
}

const meses = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' }
]

const aniosPorDefecto = (() => {
  const y = now.getFullYear()
  return [y - 3, y - 2, y - 1, y, y + 1]
})()

const ReporteIncidentes = ({ onVolver }) => {
  const [modo, setModo] = useState('anual') // 'anual' | 'mensual'
  const [anio, setAnio] = useState(now.getFullYear())
  const [mes01, setMes01] = useState(now.getMonth() + 1)

  const [datos, setDatos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const rango = useMemo(() => construirRango({ modo, anio, mes01 }), [modo, anio, mes01])

  const traerIncidentes = async () => {
    setCargando(true)
    setError('')
    setDatos([])

    try {
      // 1) Bajamos TODAS las páginas usando pagina/limite/desde/hasta
      const { items } = await fetchTodasLasPaginasPorPeriodo(rango, 200)

      // 2) Seguridad: recorte en cliente por si el backend ignora filtros
      const filtrados = filtrarPorRango(items, rango)

      setDatos(filtrados)
    } catch (e) {
      setError('No se pudieron obtener incidentes para el período seleccionado')
      setDatos([])
    } finally {
      setCargando(false)
    }
  }

  // Conteo por tipo: preferimos tipoDescripcion; si no, agrupamos por id
  const conteoPorTipo = useMemo(() => {
    const acc = new Map()
    datos.forEach(it => {
      const nombreTipo =
        it.tipoDescripcion ||
        (it.idTipoIncidente != null ? `Tipo ${it.idTipoIncidente}` : 'Sin tipo')

      acc.set(nombreTipo, (acc.get(nombreTipo) || 0) + 1)
    })
    return acc
  }, [datos])

  // Ordenamos categorías por cantidad desc para una lectura más clara
  const categories = useMemo(() => {
    const pares = Array.from(conteoPorTipo.entries()) // [ [tipo, count], ... ]
    pares.sort((a, b) => b[1] - a[1])
    return pares.map(([tipo]) => tipo)
  }, [conteoPorTipo])

  const series = useMemo(() => {
    const pares = Array.from(conteoPorTipo.entries()).sort((a, b) => b[1] - a[1])
    const valores = pares.map(([, count]) => count)
    return [{ name: 'Incidentes', data: valores }]
  }, [conteoPorTipo])

  const options = useMemo(() => ({
    chart: { type: 'bar', toolbar: { show: true } },
    plotOptions: { bar: { horizontal: false, borderRadius: 6, columnWidth: '45%' } },
    dataLabels: { enabled: true },
    xaxis: { categories },
    yaxis: { labels: { formatter: val => Math.trunc(val) } },
    tooltip: { y: { formatter: val => `${val} incidente${val === 1 ? '' : 's'}` } },
    noData: { text: 'Sin datos para el período seleccionado' }
  }), [categories])

  const tituloPeriodo = useMemo(() => {
    if (modo === 'anual') return `Período ${anio}`
    const nomMes = meses.find(m => m.value === mes01)?.label || mes01
    return `Período ${nomMes} ${anio}`
  }, [modo, anio, mes01])

  const hayDatos = series[0]?.data?.length > 0

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
                <button
                  className={`btn btn-sm ${modo === 'anual' ? 'btn-danger' : 'btn-outline-danger'}`}
                  onClick={() => setModo('anual')}
                >
                  Anual
                </button>
                <button
                  className={`btn btn-sm ${modo === 'mensual' ? 'btn-danger' : 'btn-outline-danger'}`}
                  onClick={() => setModo('mensual')}
                >
                  Mensual
                </button>
              </div>
            </div>

            <div className='col-6 col-md-3'>
              <label className='form-label text-dark fw-semibold'>Año</label>
              <select
                className='form-select form-select-sm'
                value={anio}
                onChange={e => setAnio(parseInt(e.target.value))}
              >
                {aniosPorDefecto.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {modo === 'mensual' && (
              <div className='col-6 col-md-3'>
                <label className='form-label text-dark fw-semibold'>Mes</label>
                <select
                  className='form-select form-select-sm'
                  value={mes01}
                  onChange={e => setMes01(parseInt(e.target.value))}
                >
                  {meses.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div className='col-12 col-md-3 text-md-end'>
              <button
                className='btn btn-danger w-100 btn-sm'
                onClick={traerIncidentes}
                disabled={cargando}
              >
                {cargando ? (
                  <>
                    <Loader2 className='spin me-1' size={16} />
                    Generando…
                  </>
                ) : 'Generar'}
              </button>
            </div>
          </div>

          {error && (
            <div className='alert alert-danger mt-3'>{error}</div>
          )}

          <hr className='my-4' />

          <div className='mb-3 d-flex align-items-center gap-2'>
            <BarChart3 className='text-danger' />
            <h5 className='mb-0 text-dark'>Incidentes por tipo</h5>
          </div>

          <div className='mt-2'>
            {cargando && (
              <div className='text-center py-4'>
                <div className='spinner-border' role='status'>
                  <span className='visually-hidden'>Cargando…</span>
                </div>
                <div className='small text-muted mt-2'>Procesando datos</div>
              </div>
            )}

            {!cargando && (
              hayDatos ? (
                <ReactApexChart options={options} series={series} type='bar' height={360} />
              ) : (
                <div className='text-center text-muted py-4'>
                  No hay datos para mostrar. Elegí un período y presioná <b>Generar</b>.
                </div>
              )
            )}
          </div>

          <div className='d-flex justify-content-center align-items-center gap-3 mt-4'>
            {onVolver && <BackToMenuButton onClick={onVolver} />}
            <button
              type='button'
              className='btn btn-outline-secondary btn-sm'
              onClick={() => {
                setError('')
                setDatos([])
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
