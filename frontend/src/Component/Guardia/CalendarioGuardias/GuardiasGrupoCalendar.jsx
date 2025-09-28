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

// ===== componente =====
const GuardiasGrupoCalendar = ({ titulo = 'Guardias por Grupo', headerRight = null }) => {
  const [grupos, setGrupos] = useState([])
  const [cargandoGrupos, setCargandoGrupos] = useState(false)
  const [errorGrupos, setErrorGrupos] = useState('')

  const [eventos, setEventos] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [resumenGruposPorFecha, setResumenGruposPorFecha] = useState(new Map())
  const [legendGrupos, setLegendGrupos] = useState(new Map())
  const [cargandoGuardias, setCargandoGuardias] = useState(false)

  const calendarRef = useRef()
  const ultimoRangoRef = useRef({ start: '', end: '' })
  const overlaysRef = useRef(new Map())
  const tooltipsRef = useRef(new Map())
  const hoyStr = useMemo(() => yyyyMmDd(new Date()), [])

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
  }, [])

  // ===== Tooltip (solo el negro, sin title nativo) =====
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

  // <<< CAMBIO PEDIDO: encabezado "Guardias:" y debajo los nombres >>>
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
      const t = tooltipsRef.current.get(fechaStr)
      if (!t) return
      t.style.left = `${e.pageX + 10}px`
      t.style.top = `${e.pageY - 20}px`
    }
    const onLeave = () => {
      const t = tooltipsRef.current.get(fechaStr)
      if (t) t.style.display = 'none'
    }

    tdEl.addEventListener('mouseenter', onEnter)
    tdEl.addEventListener('mousemove', onMove)
    tdEl.addEventListener('mouseleave', onLeave)
    tdEl.dataset.tipBound = '1'
  }

  const quitarTooltip = fechaStr => {
    const tip = tooltipsRef.current.get(fechaStr)
    if (tip?.parentNode) tip.parentNode.removeChild(tip)
    tooltipsRef.current.delete(fechaStr)
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

    // Handlers solo del tooltip negro (sin title)
    bindTooltipHandlers(cell, fechaStr, gmap)
  }

  // Redibuja overlays/tooltips sobre celdas visibles
  const bindOverlaysAndTooltips = () => {
    const cells = document.querySelectorAll('.cal-mini-card td.fc-daygrid-day')
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

  // ===== Carga de guardias =====
  const cargarMesTodosGrupos = async (startDate, endDate) => {
    try {
      setMensaje('')
      setCargandoGuardias(true)
      const start = yyyyMmDd(startDate)
      const end = yyyyMmDd(endDate)
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

      const peticiones = grupos.map(g =>
        apiRequest(API_URLS.grupos.guardias.listar(g.id, start, end))
          .then(res => ({ grupo: g, ok: true, data: Array.isArray(res) ? res : (res?.data ?? []) }))
          .catch(err => ({ grupo: g, ok: false, error: err }))
      )
      const resultados = await Promise.all(peticiones)

      const porFecha = new Map()
      const leyenda = new Map()

      for (const r of resultados) {
        if (!r.ok) continue
        const g = r.grupo
        const { bg, border } = colorForGroup(g.id)
        leyenda.set(g.id, { nombre: g.nombre || `Grupo ${g.id}`, colors: { bg, border } })

        for (const row of r.data) {
          const fecha = typeof row.fecha === 'string'
            ? row.fecha.slice(0, 10)
            : (row.fecha ? yyyyMmDd(new Date(row.fecha)) : null)
          const desde = (row.hora_desde || row.desde || '').toString().slice(0, 5)
          const hasta = (row.hora_hasta || row.hasta || '').toString().slice(0, 5)
          if (!fecha || !desde || !hasta) continue

          if (!porFecha.has(fecha)) porFecha.set(fecha, new Map())
          const gmap = porFecha.get(fecha)

          if (!gmap.has(g.id)) {
            gmap.set(g.id, { nombre: g.nombre || `Grupo ${g.id}`, bomberos: new Set(), rangos: new Set() })
          }
          const agg = gmap.get(g.id)
          agg.rangos.add(`${desde}-${hasta}`)
          const bombero =
            row.bomberoNombre || row.bombero || row.nombreBombero || row.nombre_bombero || null
          if (bombero) agg.bomberos.add(bombero)
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

      // doble RAF para asegurar DOM listo
      requestAnimationFrame(() => {
        requestAnimationFrame(() => bindOverlaysAndTooltips())
      })
    } catch (e) {
      setMensaje(`Error al cargar guardias: ${e.message}`)
      setEventos([]); setResumenGruposPorFecha(new Map()); setLegendGrupos(new Map())
    } finally {
      setCargandoGuardias(false)
    }
  }

  // ===== hooks de celdas =====
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

  // ===== recarga al cambiar mes =====
  const recargarSiCambioRango = arg => {
    const s = yyyyMmDd(arg.start)
    const e = yyyyMmDd(arg.end)
    if (ultimoRangoRef.current.start !== s || ultimoRangoRef.current.end !== e) {
      ultimoRangoRef.current = { start: s, end: e }
      if (grupos.length) cargarMesTodosGrupos(arg.start, arg.end)
    } else {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => bindOverlaysAndTooltips())
      })
    }
  }

  // cargar cuando ya tengamos grupos y la vista esté lista
  useEffect(() => {
    const api = calendarRef.current?.getApi?.()
    if (api && grupos.length) cargarMesTodosGrupos(api.view.currentStart, api.view.currentEnd)
  }, [grupos])

  return (
    <div className='container-fluid'>
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
