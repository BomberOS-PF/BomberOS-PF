// GuardiasGrupoCalendar.jsx  // sin ;
import React, { useEffect, useMemo, useRef, useState } from 'react'
import './CalendarioGuardias.css'

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'
import { API_URLS, apiRequest } from '../../../config/api'

// ===== helpers =====
const yyyyMmDd = d => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const addDays = (date, days) => { const d = new Date(date); d.setDate(d.getDate() + days); return d }

// Golden-angle hashing (tonos separados por grupo)
const goldenHue = n => (Math.floor(n * 137.508) % 360)
const colorForGroup = id => {
  const n = typeof id === 'number' ? id : (String(id).split('').reduce((a,c)=>a+c.charCodeAt(0),0))
  const h = goldenHue(n)
  const bg = `hsla(${h}, 78%, 60%, .85)`
  const border = `hsla(${h}, 82%, 35%, 1)`
  return { bg, border }
}

// ===== componente =====
const GuardiasGrupoCalendar = ({ titulo = 'Guardias por Grupo', headerRight = null }) => {
  // estado
  const [grupos, setGrupos] = useState([])
  const [cargandoGrupos, setCargandoGrupos] = useState(false)
  const [errorGrupos, setErrorGrupos] = useState('')

  const [eventos, setEventos] = useState([]) // background events (por fecha)
  const [resumenGruposPorFecha, setResumenGruposPorFecha] = useState(new Map()) // fecha -> Map(gid -> {nombre, rangos:Set, bomberos:Set})
  const [legendGrupos, setLegendGrupos] = useState(new Map())
  const [cargandoGuardias, setCargandoGuardias] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // refs UI
  const rootRef = useRef(null)
  const calendarRef = useRef()
  const overlaysRef = useRef(new Map())
  const tooltipsRef = useRef(new Map())
  const gridObserverRef = useRef(null)
  const ultimoRangoRef = useRef({ start: '', end: '' })
  const hoyStr = useMemo(() => yyyyMmDd(new Date()), [])

  // <<<< NUEVO: remount control >>>>
  const [calKey, setCalKey] = useState(0)
  const didFirstHydrateRef = useRef(false)

  // ========= Carga de grupos (una vez) =========
  useEffect(() => {
    const cargar = async () => {
      try {
        setCargandoGrupos(true)
        setErrorGrupos('')
        if (!API_URLS?.grupos?.buscar) { setErrorGrupos('Falta API_URLS.grupos.buscar'); return }
        const url = `${API_URLS.grupos.buscar}?q=&limit=500`
        const resp = await apiRequest(url)
        const body = Array.isArray(resp) ? resp : (resp?.data ?? resp?.results ?? resp?.rows ?? resp?.items ?? resp?.content ?? [])
        const lista = body.map(r => {
          const id = r.id ?? r.idGrupo ?? r.grupoId ?? r.ID ?? r.id_grupo
          const nombre = r.nombre ?? r.nombreGrupo ?? r.grupo ?? r.descripcion ?? (id != null ? `Grupo ${id}` : null)
          return id != null ? { id: Number(id), nombre: String(nombre || `Grupo ${id}`) } : null
        }).filter(Boolean)
        setGrupos(lista)
        const leyenda = new Map()
        for (const g of lista) {
          const { bg, border } = colorForGroup(g.id)
          leyenda.set(g.id, { nombre: g.nombre, colors: { bg, border } })
        }
        setLegendGrupos(leyenda)
      } catch (e) {
        setErrorGrupos(`No se pudo cargar grupos: ${e.message}`)
      } finally {
        setCargandoGrupos(false)
      }
    }
    cargar()
  }, [])

  // cleanup fuerte
  useEffect(() => {
    return () => {
      for (const el of overlaysRef.current.values()) el?.parentNode?.removeChild(el)
      overlaysRef.current.clear()
      for (const tip of tooltipsRef.current.values()) tip?.parentNode?.removeChild(tip)
      tooltipsRef.current.clear()
      gridObserverRef.current?.disconnect?.()
    }
  }, [])

  // ===== Tooltip negro =====
  const formatearTooltip = gmap => {
    const nombres = Array.from(gmap.values()).map(v => v?.nombre || 'Grupo')
    return ['Guardias:', ...nombres].join('\n')
  }

  const ensureTooltip = fechaStr => {
    if (tooltipsRef.current.has(fechaStr)) return tooltipsRef.current.get(fechaStr)
    const tip = document.createElement('div')
    tip.className = 'tooltip-dinamico'
    tip.style.position = 'fixed'
    tip.style.display = 'none'
    tip.style.pointerEvents = 'none'
    tip.style.whiteSpace = 'pre'
    tip.style.padding = '6px 8px'
    tip.style.background = '#222'
    tip.style.color = '#fff'
    tip.style.borderRadius = '6px'
    tip.style.fontSize = '12px'
    tip.style.boxShadow = '0 2px 8px rgba(0,0,0,.25)'
    tip.style.zIndex = '3000'
    document.body.appendChild(tip)
    tooltipsRef.current.set(fechaStr, tip)
    return tip
  }

  const quitarTooltip = fechaStr => {
    const tip = tooltipsRef.current.get(fechaStr)
    if (tip?.parentNode) tip.parentNode.removeChild(tip)
    tooltipsRef.current.delete(fechaStr)
  }

  // ===== Overlays por grupo (bandas de color) =====
  const removeNativeTitles = el => {
    el?.removeAttribute?.('title')
    el?.querySelectorAll?.('[title]')?.forEach(n => n.removeAttribute('title'))
  }

  const crearOverlay = (cell, fechaStr, isOther = false) => {
    if (!cell) return
    const frame = cell.querySelector('.fc-daygrid-day-frame') || cell
    let ov = frame.querySelector('.fc-guard-overlay')
    if (!ov) {
      frame.style.position = 'relative'
      ov = document.createElement('div')
      ov.className = 'fc-guard-overlay'
      ov.style.pointerEvents = 'none'
      frame.appendChild(ov)
    }
    overlaysRef.current.set(fechaStr, ov)

    const esHoy = (fechaStr === hoyStr)
    ov.classList.toggle('is-today', esHoy && !isOther)

    ov.innerHTML = ''
    const gmap = resumenGruposPorFecha.get(fechaStr)
    if (gmap && gmap.size) {
      ov.style.display = 'flex'
      ov.style.flexDirection = 'column'
      ov.style.gap = '4px'
      for (const [gid, meta] of gmap) {
        const { bg, border } = colorForGroup(gid)
        const band = document.createElement('div')
        band.className = 'band-grupo'
        band.style.background = bg
        band.style.border = `1px solid ${border}`
        band.style.borderRadius = '6px'
        band.style.height = '12px'
        band.style.boxShadow = 'inset 0 0 0 1px rgba(255,255,255,.15)'

        const label = document.createElement('span')
        label.className = 'band-label'
        label.textContent = (meta?.nombre || `G${gid}`).slice(0, 16)
        label.style.fontSize = '9px'
        label.style.lineHeight = '12px'
        label.style.padding = '0 4px'
        label.style.color = '#111'
        label.style.fontWeight = '700'
        label.style.opacity = '.85'
        band.appendChild(label)

        ov.appendChild(band)
      }
    } else {
      ov.style.display = 'none'
    }

    if (gmap && gmap.size) {
      removeNativeTitles(cell)
      if (!cell.dataset.tipBound) {
        const onEnter = e => { const t = ensureTooltip(fechaStr); t.textContent = formatearTooltip(gmap); t.style.display = 'block'; t.style.left = `${e.pageX + 10}px`; t.style.top = `${e.pageY - 20}px` }
        const onMove  = e => { const t = tooltipsRef.current.get(fechaStr); if (!t) return; t.style.left = `${e.pageX + 10}px`; t.style.top = `${e.pageY - 20}px` }
        const onLeave = () => { const t = tooltipsRef.current.get(fechaStr); if (t) t.style.display = 'none' }
        cell.addEventListener('mouseenter', onEnter)
        cell.addEventListener('mousemove', onMove)
        cell.addEventListener('mouseleave', onLeave)
        cell.dataset.tipBound = '1'
      }
    } else {
      quitarTooltip(fechaStr)
      if (cell?.dataset) delete cell.dataset.tipBound
    }
  }

  const getDayCells = () =>
    rootRef.current?.querySelectorAll('.fc-daygrid .fc-daygrid-day[data-date]') || []

  const bindOverlaysAndTooltips = () => {
    const cells = getDayCells()
    cells.forEach(td => {
      const fechaStr = td.getAttribute('data-date')
      if (!fechaStr) return
      const frame = td.querySelector('.fc-daygrid-day-frame') || td
      const gmap = resumenGruposPorFecha.get(fechaStr)
      if (gmap && gmap.size) {
        crearOverlay(td, fechaStr, td.classList.contains('fc-day-other'))
      } else {
        quitarTooltip(fechaStr)
        if (td?.dataset) delete td.dataset.tipBound
        const ov = frame.querySelector('.fc-guard-overlay')
        if (ov?.parentNode) ov.parentNode.removeChild(ov)
        overlaysRef.current.delete(fechaStr)
      }
    })
  }

  // ===== Background events por fecha con datos =====
  const buildBackEvents = (mapa) => {
    const out = []
    for (const [fecha] of mapa) {
      const [y, m, d] = fecha.split('-').map(Number)
      const startCell = new Date(y, (m || 1) - 1, d || 1)
      out.push({
        id: `bg-${fecha}`,
        start: startCell,
        end: addDays(startCell, 1),
        display: 'background',
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        extendedProps: { fecha }
      })
    }
    return out
  }

  // ===== Igual que MisGuardias: 3 meses visibles (inicio, centro, fin-1) =====
  const fetchMes = async (y, m0) => {
    const desde = yyyyMmDd(new Date(y, m0, 1))
    const hasta = yyyyMmDd(new Date(y, m0 + 1, 1)) // exclusivo
    const tasks = grupos.map(async g => {
      try {
        const resp = await apiRequest(API_URLS.grupos.guardias.listar(g.id, desde, hasta))
        const rows = Array.isArray(resp) ? resp : (resp?.data || [])
        return { g, rows }
      } catch {
        return { g, rows: [] }
      }
    })
    const results = await Promise.all(tasks)

    const porFecha = new Map()
    for (const { g, rows } of results) {
      for (const r of rows) {
        const f = (typeof r.fecha === 'string') ? r.fecha.slice(0, 10) : (r.fecha ? yyyyMmDd(new Date(r.fecha)) : null)
        const desdeH = (r.hora_desde || r.desde || '').toString().slice(0, 5)
        const hastaH = (r.hora_hasta || r.hasta || '').toString().slice(0, 5)
        if (!f || !desdeH || !hastaH) continue
        if (!porFecha.has(f)) porFecha.set(f, new Map())
        const gmap = porFecha.get(f)
        if (!gmap.has(g.id)) gmap.set(g.id, { nombre: g.nombre, rangos: new Set(), bomberos: new Set() })
        gmap.get(g.id).rangos.add(`${desdeH}-${hastaH}`)
        const bombero = r.bomberoNombre || r.bombero || r.nombreBombero || r.nombre_bombero || null
        if (bombero) gmap.get(g.id).bomberos.add(bombero)
      }
    }
    return porFecha
  }

  const mergeResumenDeep = (base, extra) => {
    const res = new Map(base)
    for (const [fecha, gmap] of extra) {
      if (!res.has(fecha)) res.set(fecha, new Map())
      const tgt = res.get(fecha)
      for (const [gid, agg] of gmap) {
        if (!tgt.has(gid)) {
          tgt.set(gid, {
            nombre: agg.nombre,
            rangos: new Set(agg.rangos),
            bomberos: new Set(agg.bomberos)
          })
        } else {
          const t = tgt.get(gid)
          t.nombre = t.nombre || agg.nombre
          for (const r of agg.rangos) t.rangos.add(r)
          for (const b of agg.bomberos) t.bomberos.add(b)
        }
      }
    }
    return res
  }

  const cargarMesServidor = async (startDate, endDate) => {
    if (!grupos.length) return
    try {
      setErrorMsg('')
      setCargandoGuardias(true)

      const start = yyyyMmDd(startDate)
      const end = yyyyMmDd(endDate)
      ultimoRangoRef.current = { start, end }

      const endMinus1 = addDays(endDate, -1)
      const center = new Date((startDate.getTime() + endDate.getTime()) / 2)

      const meses = [
        { y: startDate.getFullYear(), m0: startDate.getMonth() },
        { y: center.getFullYear(),    m0: center.getMonth() },
        { y: endMinus1.getFullYear(), m0: endMinus1.getMonth() }
      ]

      let merged = new Map()
      for (const { y, m0 } of meses) {
        const part = await fetchMes(y, m0)
        merged = mergeResumenDeep(merged, part)
      }

      setResumenGruposPorFecha(merged)
      setEventos(buildBackEvents(merged))

      // <<<< CLAVE: una sola vez, remonto el calendario con datos ya cargados >>>>
      const api = calendarRef.current?.getApi?.()
      requestAnimationFrame(() => {
        if (!didFirstHydrateRef.current) {
          didFirstHydrateRef.current = true
          setCalKey(k => k + 1)   // fuerza remount => pinta tb. los días del mes siguiente visibles
        } else {
          api?.rerenderEvents?.()
          requestAnimationFrame(() => bindOverlaysAndTooltips())
        }
      })
    } catch (e) {
      setErrorMsg(`Error al cargar guardias por grupo: ${e.message}`)
    } finally {
      setCargandoGuardias(false)
    }
  }

  // ===== hooks de pintado (idénticos a MisGuardias)
  useEffect(() => {
    let raf1, raf2
    raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(() => { bindOverlaysAndTooltips() }) })
    return () => { if (raf1) cancelAnimationFrame(raf1); if (raf2) cancelAnimationFrame(raf2) }
  }, [resumenGruposPorFecha])

  useEffect(() => {
    const t = setTimeout(() => { bindOverlaysAndTooltips() }, 0)
    return () => clearTimeout(t)
  }, [eventos])

  useEffect(() => {
    const grid = rootRef.current?.querySelector('.fc-daygrid-body')
    if (!grid) return
    gridObserverRef.current?.disconnect?.()
    const obs = new MutationObserver(() => { requestAnimationFrame(() => bindOverlaysAndTooltips()) })
    obs.observe(grid, { childList: true, subtree: true })
    gridObserverRef.current = obs
    return () => obs.disconnect()
  }, [eventos, resumenGruposPorFecha])

  // disparo inicial como MisGuardias (cuando hay grupos y existe el calendar)
  useEffect(() => {
    const api = calendarRef.current?.getApi?.()
    if (api && grupos.length) cargarMesServidor(api.view.currentStart, api.view.currentEnd)
  }, [grupos])

  return (
    <div className='container-fluid' ref={rootRef}>
      <div className='card border-0 shadow-sm cal-mini-card'>
        <div className='card-header bg-danger text-white d-flex align-items-center justify-content-between flex-wrap'>
          <div className='d-flex align-items-center gap-2'>
            <i className='bi bi-people-fill'></i>
            <strong>{titulo}</strong>
            {cargandoGrupos && <small className='ms-2 text-white-50'>Cargando grupos…</small>}
            {errorGrupos && <small className='ms-2 text-warning'>{errorGrupos}</small>}
          </div>
          {headerRight}
        </div>

        <div className='card-body'>
          {errorMsg && <div className='alert alert-danger py-2'>{errorMsg}</div>}

          <div className='calendar-mini-wrapper position-relative' style={{ minHeight: 520 }}>
            {cargandoGuardias && (
              <div className='position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center'
                   style={{ background: 'rgba(0,0,0,0.05)', zIndex: 5 }}>
                <div className='text-center'>
                  <div className='spinner-border' role='status'><span className='visually-hidden'>Cargando…</span></div>
                  <div className='mt-2 small text-muted'>Cargando guardias…</div>
                </div>
              </div>
            )}

            <FullCalendar
              key={calKey}   // <<<< fuerza remount después del primer fetch
              ref={calendarRef}
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView='dayGridMonth'
              locale={esLocale}
              headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
              firstDay={1}
              fixedWeekCount={false}
              showNonCurrentDates={true}
              height='auto'
              contentHeight={650}
              events={eventos}
              eventContent={() => ({ domNodes: [] })}

              eventDidMount={info => {
                const fecha = info.event.extendedProps?.fecha
                if (!fecha) return
                const td = rootRef.current?.querySelector(`.fc-daygrid-day[data-date="${fecha}"]`)
                if (td) crearOverlay(td, fecha, td.classList.contains('fc-day-other'))
              }}

              viewDidMount={() => {
                requestAnimationFrame(() => bindOverlaysAndTooltips())
                const api = calendarRef.current?.getApi?.()
                if (api && grupos.length) cargarMesServidor(api.view.currentStart, api.view.currentEnd)
              }}

              datesSet={arg => {
                const s = yyyyMmDd(arg.start)
                const e = yyyyMmDd(arg.end)
                if (ultimoRangoRef.current.start !== s || ultimoRangoRef.current.end !== e) {
                  ultimoRangoRef.current = { start: s, end: e }
                  cargarMesServidor(arg.start, arg.end)
                } else {
                  requestAnimationFrame(() => { requestAnimationFrame(() => bindOverlaysAndTooltips()) })
                }
              }}

              dayCellDidMount={info => {
                const fechaStr = yyyyMmDd(info.date)
                info.el.removeAttribute?.('title')
                const gmap = resumenGruposPorFecha.get(fechaStr)
                if (gmap && gmap.size) {
                  crearOverlay(info.el, fechaStr, info.el.classList.contains('fc-day-other'))
                }
              }}

              dayCellWillUnmount={info => {
                const fechaStr = yyyyMmDd(info.date)
                quitarTooltip(fechaStr)
                if (info.el?.dataset) delete info.el.dataset.tipBound
              }}
            />
          </div>

          {legendGrupos && legendGrupos.size > 0 && (
            <div className='mt-3 d-flex flex-wrap gap-3'>
              {Array.from(legendGrupos.entries()).map(([gid, { nombre, colors }]) => (
                <div key={gid} className='d-flex align-items-center gap-2'>
                  <span className='d-inline-block rounded' style={{ width: 18, height: 18, background: colors.bg, border: `1px solid ${colors.border}` }} />
                  <small className='text-muted'>{nombre}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GuardiasGrupoCalendar
