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

const addDays = (date, days) => {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

// Golden-angle hashing (tonos bien separados)
const goldenHue = n => (Math.floor(n * 137.508) % 360)
const colorForGroup = id => {
  const n = typeof id === 'number' ? id : (String(id).split('').reduce((a,c)=>a+c.charCodeAt(0),0))
  const h = goldenHue(n)
  const bg = `hsla(${h}, 78%, 60%, .85)`
  const border = `hsla(${h}, 82%, 35%, 1)`
  return { bg, border }
}

const GuardiasGrupoCalendar = ({ titulo = 'Guardias por Grupo', headerRight = null }) => {
  const [grupos, setGrupos] = useState([])
  const [cargandoGrupos, setCargandoGrupos] = useState(false)
  const [errorGrupos, setErrorGrupos] = useState('')

  const [eventos, setEventos] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [resumenGruposPorFecha, setResumenGruposPorFecha] = useState(new Map())
  const [legendGrupos, setLegendGrupos] = useState(new Map())
  const [cargandoGuardias, setCargandoGuardias] = useState(false)

  const rootRef = useRef(null)
  const calendarRef = useRef()
  const ultimoRangoRef = useRef({ start: '', end: '' })
  const overlaysRef = useRef(new Map())
  const tooltipsRef = useRef(new Map())
  const gridObserverRef = useRef(null)
  const compIdRef = useRef(`gg-${Math.random().toString(36).slice(2)}`) // namespace
  const hoyStr = useMemo(() => yyyyMmDd(new Date()), [])
  const [viewReady, setViewReady] = useState(false)
  const [initialWindow, setInitialWindow] = useState(null)

  const tipKey = (fechaStr) => `${compIdRef.current}:${fechaStr}`

  const getDayCells = () =>
    rootRef.current?.querySelectorAll('.fc-daygrid .fc-daygrid-day[data-date]') || []

  // ------- cargar lista de grupos -------
  useEffect(() => {
    const cargarGrupos = async () => {
      try {
        setCargandoGrupos(true)
        setErrorGrupos('')
        if (!API_URLS?.grupos?.buscar) {
          setErrorGrupos('Falta API_URLS.grupos.buscar')
          return
        }
        const url = `${API_URLS.grupos.buscar}?q=&limit=500`
        const resp = await apiRequest(url)
        const body = Array.isArray(resp) ? resp
          : resp?.data ?? resp?.results ?? resp?.rows ?? resp?.items ?? resp?.content ?? []

        const lista = body
          .map(r => {
            const id = r.id ?? r.idGrupo ?? r.grupoId ?? r.ID ?? r.id_grupo
            const nombre = r.nombre ?? r.nombreGrupo ?? r.grupo ?? r.descripcion ?? (id != null ? `Grupo ${id}` : null)
            return id != null ? { id: Number(id), nombre } : null
          })
          .filter(Boolean)

        setGrupos(lista)
      } catch (e) {
        setErrorGrupos(`No se pudo cargar grupos: ${e.message}`)
      } finally {
        setCargandoGrupos(false)
      }
    }
    cargarGrupos()
  }, [])

  // ------- cleanup total al desmontar -------
  useEffect(() => () => {
    for (const el of overlaysRef.current.values()) el?.parentNode?.removeChild(el)
    overlaysRef.current.clear()
    for (const tip of tooltipsRef.current.values()) tip?.parentNode?.removeChild(tip)
    tooltipsRef.current.clear()
    gridObserverRef.current?.disconnect?.()
  }, [])

  // ===== Tooltip (solo el negro, sin title nativo) =====
  const ensureTooltip = fechaStr => {
    const key = tipKey(fechaStr)
    if (tooltipsRef.current.has(key)) return tooltipsRef.current.get(key)
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
    tooltipsRef.current.set(key, tip)
    return tip
  }

  const getTooltip = (fechaStr) => tooltipsRef.current.get(tipKey(fechaStr))

  const textoTooltip = gmap => {
    const nombres = Array.from(gmap.values()).map(v => v?.nombre || 'Grupo')
    return ['Guardias:', ...nombres].join('\n')
  }

  const removeNativeTitles = rootEl => {
    rootEl.removeAttribute?.('title')
    rootEl.querySelectorAll?.('[title]').forEach(n => n.removeAttribute('title'))
  }

  const bindTooltipHandlers = (tdEl, fechaStr, gmap) => {
    if (!tdEl || tdEl.dataset.tipBound === '1') return
    removeNativeTitles(tdEl)

    const onEnter = e => {
      if (!gmap || !gmap.size) return
      const t = ensureTooltip(fechaStr)
      t.textContent = textoTooltip(gmap)
      t.style.display = 'block'
      t.style.left = `${e.pageX + 10}px`
      t.style.top = `${e.pageY - 20}px`
    }
    const onMove  = e => {
      const t = getTooltip(fechaStr)
      if (!t) return
      t.style.left = `${e.pageX + 10}px`
      t.style.top = `${e.pageY - 20}px`
    }
    const onLeave = () => {
      const t = getTooltip(fechaStr)
      if (t) t.style.display = 'none'
    }

    tdEl.addEventListener('mouseenter', onEnter)
    tdEl.addEventListener('mousemove', onMove)
    tdEl.addEventListener('mouseleave', onLeave)
    tdEl.dataset.tipBound = '1'
  }

  const quitarTooltip = fechaStr => {
    const tip = getTooltip(fechaStr)
    if (tip?.parentNode) tip.parentNode.removeChild(tip)
    tooltipsRef.current.delete(tipKey(fechaStr))
  }

  // ===== Overlays (bandas por grupo) =====
  const crearOverlay = (tdOrFrameEl, fechaStr, isOther = false) => {
    const frameEl = tdOrFrameEl
    if (!frameEl) return

    const cell = frameEl.closest('.fc-daygrid-day') || frameEl
    removeNativeTitles(cell)

    let ov = frameEl.querySelector('.fc-guard-overlay')
    if (!ov) {
      frameEl.style.position = 'relative'
      ov = document.createElement('div')
      ov.className = 'fc-guard-overlay'
      ov.style.pointerEvents = 'none'
      frameEl.appendChild(ov)
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
        band.style.boxShadow = 'inset 0 0 0 1px rgba(255,255,255,.15)' // <- FIX acá

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

    bindTooltipHandlers(cell, fechaStr, gmap)
  }

  // Redibuja overlays/tooltips sobre celdas visibles
  const bindOverlaysAndTooltips = () => {
    const cells = getDayCells()
    cells.forEach(td => {
      const fechaStr = td.getAttribute('data-date')
      if (!fechaStr) return
      const gmap = resumenGruposPorFecha.get(fechaStr)
      const frame = td.querySelector('.fc-daygrid-day-frame') || td
      if (gmap && gmap.size) {
        crearOverlay(frame, fechaStr, td.classList.contains('fc-day-other'))
      } else {
        quitarTooltip(fechaStr)
        if (td?.dataset) delete td.dataset.tipBound
        removeNativeTitles(td)
      }
    })
  }

  const forceRender = () => {
    requestAnimationFrame(() => {
      const api = calendarRef.current?.getApi?.()
      api?.render?.()
      requestAnimationFrame(() => bindOverlaysAndTooltips())
    })
  }

  // ===== Carga de guardias (3 meses visibles) =====
  const cargarRangoGrupos = async (startDate, endDate) => {
    try {
      setMensaje('')
      setCargandoGuardias(true)

      const start = yyyyMmDd(startDate)
      const end = yyyyMmDd(endDate) // exclusivo
      ultimoRangoRef.current = { start, end }

      if (!grupos.length) {
        setEventos([]); setResumenGruposPorFecha(new Map()); setLegendGrupos(new Map())
        setMensaje('No hay grupos para consultar')
        return
      }
      if (!API_URLS?.grupos?.guardias?.listar) {
        setMensaje('Falta API_URLS.grupos.guardias.listar(idGrupo, start, end)')
        setEventos([]); setResumenGruposPorFecha(new Map()); setLegendGrupos(new Map())
        return
      }

      const endMinus1 = addDays(endDate, -1)
      const center = new Date((startDate.getTime() + endDate.getTime()) / 2)

      const months = [
        { y: startDate.getFullYear(), m0: startDate.getMonth() },
        { y: center.getFullYear(),    m0: center.getMonth() },
        { y: endMinus1.getFullYear(), m0: endMinus1.getMonth() }
      ]
      const uniqKeys = []
      const uniqMonths = []
      for (const { y, m0 } of months) {
        const k = `${y}-${m0}`
        if (!uniqKeys.includes(k)) { uniqKeys.push(k); uniqMonths.push({ y, m0 }) }
      }

      const porFecha = new Map()
      const leyenda = new Map()

      for (const g of grupos) {
        const { bg, border } = colorForGroup(g.id)
        leyenda.set(g.id, { nombre: g.nombre || `Grupo ${g.id}`, colors: { bg, border } })

        for (const { y, m0 } of uniqMonths) {
          const desde = yyyyMmDd(new Date(y, m0, 1))
          const hasta = yyyyMmDd(new Date(y, m0 + 1, 1)) // exclusivo
          let res
          try {
            res = await apiRequest(API_URLS.grupos.guardias.listar(g.id, desde, hasta))
          } catch {
            res = null
          }
          const data = Array.isArray(res) ? res : (res?.data ?? [])

          for (const row of data) {
            const fecha = typeof row.fecha === 'string'
              ? row.fecha.slice(0, 10)
              : (row.fecha ? yyyyMmDd(new Date(row.fecha)) : null)
            const desdeH = (row.hora_desde || row.desde || '').toString().slice(0, 5)
            const hastaH = (row.hora_hasta || row.hasta || '').toString().slice(0, 5)
            if (!fecha || !desdeH || !hastaH) continue

            if (!porFecha.has(fecha)) porFecha.set(fecha, new Map())
            const gmap = porFecha.get(fecha)

            if (!gmap.has(g.id)) {
              gmap.set(g.id, { nombre: g.nombre || `Grupo ${g.id}`, bomberos: new Set(), rangos: new Set() })
            }
            const agg = gmap.get(g.id)
            agg.rangos.add(`${desdeH}-${hastaH}`)
            const bombero =
              row.bomberoNombre || row.bombero || row.nombreBombero || row.nombre_bombero || null
            if (bombero) agg.bomberos.add(bombero)
          }
        }
      }

      const backEvents = []
      for (const [fecha] of porFecha) {
        const [y, m, d] = fecha.split('-').map(Number)
        const startCell = new Date(y, (m || 1) - 1, d || 1)
        backEvents.push({
          id: `bg-${fecha}`,
          start: startCell,
          end: addDays(startCell, 1),
          display: 'background',
          backgroundColor: 'transparent',
          borderColor: 'transparent',
          extendedProps: { fecha }
        })
      }

      if (!backEvents.length) setMensaje('No hay guardias en el rango visible')

      setEventos(backEvents)
      setResumenGruposPorFecha(porFecha)
      setLegendGrupos(leyenda)
      forceRender()
    } catch (e) {
      setMensaje(`Error al cargar guardias: ${e.message}`)
      setEventos([]); setResumenGruposPorFecha(new Map()); setLegendGrupos(new Map())
    } finally {
      setCargandoGuardias(false)
    }
  }

  const dayCellDidMount = info => {
    const fechaStr = yyyyMmDd(info.date)
    const frame = info.el.querySelector('.fc-daygrid-day-frame') || info.el
    crearOverlay(frame, fechaStr, info.isOther)
  }

  const dayCellWillUnmount = info => {
    const fechaStr = yyyyMmDd(info.date)
    quitarTooltip(fechaStr)
    if (info.el?.dataset) delete info.el.dataset.tipBound
  }

  const recargarSiCambioRango = arg => {
    const s = yyyyMmDd(arg.start)
    const e = yyyyMmDd(arg.end) // end exclusivo propio de la vista
    if (ultimoRangoRef.current.start !== s || ultimoRangoRef.current.end !== e) {
      ultimoRangoRef.current = { start: s, end: e }
      if (grupos.length) cargarRangoGrupos(arg.start, arg.end)
    } else {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => bindOverlaysAndTooltips())
      })
    }
  }

  // Disparo inicial cuando la vista y los grupos están listos
  useEffect(() => {
    if (!viewReady || !initialWindow || !grupos.length) return
    const { startDate, endDate } = initialWindow
    cargarRangoGrupos(startDate, endDate)
    const t = setTimeout(() => {
      const api = calendarRef.current?.getApi?.()
      if (api) cargarRangoGrupos(api.view.currentStart, api.view.currentEnd)
    }, 0)
    return () => clearTimeout(t)
  }, [viewReady, initialWindow, grupos])

  // Observer para rebind confiable
  useEffect(() => {
    const grid = rootRef.current?.querySelector('.fc-daygrid-body')
    if (!grid) return

    gridObserverRef.current?.disconnect?.()
    const obs = new MutationObserver(() => {
      requestAnimationFrame(() => bindOverlaysAndTooltips())
    })
    obs.observe(grid, { childList: true, subtree: true })
    gridObserverRef.current = obs

    return () => obs.disconnect()
  }, [eventos, resumenGruposPorFecha])

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
          {cargandoGuardias && <div className='alert alert-info py-2'>Cargando guardias…</div>}
          {mensaje && !cargandoGuardias && <div className='alert alert-warning py-2'>{mensaje}</div>}

          <div className='calendar-mini-wrapper'>
            <FullCalendar
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
              viewDidMount={(arg) => {
                setViewReady(true)
                const startDate = arg.view?.currentStart ?? arg?.start ?? new Date()
                const endDate   = arg.view?.currentEnd   ?? arg?.end   ?? addDays(new Date(), 42)
                setInitialWindow({ startDate, endDate })
                requestAnimationFrame(() => bindOverlaysAndTooltips())
              }}
              datesSet={recargarSiCambioRango}
              dayCellDidMount={dayCellDidMount}
              dayCellWillUnmount={dayCellWillUnmount}
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
