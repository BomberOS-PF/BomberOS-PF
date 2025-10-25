import React, { useEffect, useMemo, useState } from 'react'
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
    return { start: `${anio}-01-01`, end: `${anio}-12-31` }
  }
  const last = ultimoDiaMes(anio, mes01)
  return { start: `${anio}-${pad2(mes01)}-01`, end: `${anio}-${pad2(mes01)}-${pad2(last)}` }
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

  const [tipos, setTipos] = useState([])
  const [datos, setDatos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const traerTipos = async () => {
      try {
        const res = await apiRequest(API_URLS.tiposIncidente)
        const arr = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
        setTipos(arr)
      } catch (e) {
        setTipos([])
      }
    }
    traerTipos()
  }, [])

  const mapTipos = useMemo(() => {
    const m = new Map()
    tipos.forEach(t => {
      const id = t.idTipoIncidente ?? t.id ?? t.value ?? t.tipoId
      const nombre = t.nombre ?? t.descripcion ?? t.label ?? String(id)
      m.set(String(id), nombre)
    })
    return m
  }, [tipos])

  const rango = useMemo(() => construirRango({ modo, anio, mes01 }), [modo, anio, mes01])

  const traerIncidentes = async () => {
    setCargando(true)
    setError('')
    try {
      const url = API_URLS.incidentes.listar({ start: rango.start, end: rango.end })
      const res = await apiRequest(url)
      const arr = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
      setDatos(arr)
    } catch (e) {
      try {
        const resAll = await apiRequest(API_URLS.incidentes.getAll)
        const arr = Array.isArray(resAll?.data) ? resAll.data : Array.isArray(resAll) ? resAll : []
        const startDate = new Date(rango.start + 'T00:00:00')
        const endDate = new Date(rango.end + 'T23:59:59')
        const filtrados = arr.filter(x => {
          const f = x.fecha ? new Date(x.fecha) : null
          return f && f >= startDate && f <= endDate
        })
        setDatos(filtrados)
      } catch (e2) {
        setError('No se pudieron obtener incidentes para el período seleccionado')
        setDatos([])
      }
    } finally {
      setCargando(false)
    }
  }

  const conteoPorTipo = useMemo(() => {
    const acc = new Map()
    datos.forEach(it => {
      const idTipo = it.idTipoIncidente ?? it.tipoIncidenteId ?? it.id_tipo
      if (idTipo == null) return
      const k = String(idTipo)
      acc.set(k, (acc.get(k) || 0) + 1)
    })
    return acc
  }, [datos])

  const categories = useMemo(() => {
    const keys = Array.from(conteoPorTipo.keys())
    if (keys.length === 0 && mapTipos.size > 0) {
      return Array.from(mapTipos.values()).sort((a, b) => a.localeCompare(b))
    }
    return keys.map(k => mapTipos.get(k) || `Tipo ${k}`)
  }, [conteoPorTipo, mapTipos])

  const series = useMemo(() => {
    const valores = Array.from(conteoPorTipo.keys()).map(k => conteoPorTipo.get(k))
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
