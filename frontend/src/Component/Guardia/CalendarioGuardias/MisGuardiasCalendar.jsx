// sin ;
import React, { useEffect, useMemo, useRef, useState } from 'react'

import { API_URLS, apiRequest } from '../../../config/api'

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'

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

// Colores (solo para la leyenda)
const BG_FILL = 'rgba(240,128,128,0.35)'
const BG_BORDER = '#b30000'

const formatearTooltip = (rangos = []) =>
  ['Guardias:', ...rangos.map(r => {
    const [d, h] = String(r).split('-')
    return `Desde ${d} hasta ${h}`
  })].join('\n')

const MisGuardiasCalendar = ({ dniUsuario, titulo = 'Mis Guardias', headerRight = null }) => {
  const [eventos, setEventos] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [resumenPorFecha, setResumenPorFecha] = useState(new Map())

  const calendarRef = useRef()
  const ultimoRangoRef = useRef({ start: '', end: '' })
  const overlaysRef = useRef(new Map())
  const tooltipsRef = useRef(new Map())

  const hoyStr = useMemo(() => yyyyMmDd(new Date()), [])

  const dni = useMemo(() => {
    if (dniUsuario) return Number(dniUsuario)
    try {
      const raw = localStorage.getItem('user') || localStorage.getItem('usuario') || ''
      if (!raw) return null
      const parsed = JSON.parse(raw)
      return parsed?.dni != null ? Number(parsed.dni) : null
    } catch {
      return null
    }
  }, [dniUsuario])

  useEffect(() => {
    return () => {
      for (const el of overlaysRef.current.values()) el?.parentNode?.removeChild(el)
      overlaysRef.current.clear()
      for (const tip of tooltipsRef.current.values()) tip?.parentNode?.removeChild(tip)
      tooltipsRef.current.clear()
    }
  }, [])

  // ====== NUEVO: helpers de carga por mes y merge ======
  const fetchMes = async (y, m0) => {
    const desde = yyyyMmDd(new Date(y, m0, 1))
    const hasta = yyyyMmDd(new Date(y, m0 + 1, 1)) // exclusivo
    const resp = await apiRequest(API_URLS.guardias.porDni(Number(dni), desde, hasta))
    const rows = resp?.data || []

    const map = new Map()
    for (const r of rows) {
      const f = (typeof r.fecha === 'string') ? r.fecha.slice(0, 10) : yyyyMmDd(new Date(r.fecha))
      const desdeH = (r.hora_desde || r.desde || '').toString().slice(0, 5)
      const hastaH = (r.hora_hasta || r.hasta || '').toString().slice(0, 5)
      if (!f || !desdeH || !hastaH) continue
      if (!map.has(f)) map.set(f, [])
      map.get(f).push(`${desdeH}-${hastaH}`)
    }
    return map
  }

  const mergeResumen = (base, extra) => {
    const res = new Map(base)
    for (const [fecha, arr] of extra) {
      if (!res.has(fecha)) res.set(fecha, [...arr])
      else res.set(fecha, [...res.get(fecha), ...arr])
    }
    return res
  }

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
  // =====================================================

  const cargarMesServidor = async (startDate, endDate) => {
    if (!dni) {
      setMensaje('No se encontró el DNI del usuario')
      return
    }
    try {
      setMensaje('')
      const start = yyyyMmDd(startDate)
      const end = yyyyMmDd(endDate)
      ultimoRangoRef.current = { start, end }

      // Identificamos hasta 3 meses visibles: start, centro, end-1
      const startY = startDate.getFullYear(), startM0 = startDate.getMonth()
      const endMinus1 = addDays(endDate, -1)
      const endY = endMinus1.getFullYear(), endM0 = endMinus1.getMonth()
      const center = new Date((startDate.getTime() + endDate.getTime()) / 2)
      const centerY = center.getFullYear(), centerM0 = center.getMonth()

      const claves = [
        `${startY}-${startM0}`,
        `${centerY}-${centerM0}`,
        `${endY}-${endM0}`
      ]
      // de-dupe manteniendo orden
      const uniq = []
      for (const k of claves) if (!uniq.includes(k)) uniq.push(k)

      // fetch en serie (puede hacerse en paralelo si querés)
      let merged = new Map()
      for (const k of uniq) {
        const [yStr, m0Str] = k.split('-')
        const part = await fetchMes(Number(yStr), Number(m0Str))
        merged = mergeResumen(merged, part)
      }

      setResumenPorFecha(merged)
      setEventos(buildBackEvents(merged))

      // bind tras pintar
      requestAnimationFrame(() => {
        requestAnimationFrame(() => { bindOverlaysAndTooltips() })
      })
    } catch (e) {
      setMensaje(`Error al cargar mis guardias: ${e.message}`)
      setTimeout(() => setMensaje(''), 4000)
    }
  }

  const ensureTodayBadge = (ov, isToday) => {
    if (!ov) return
    const sel = '.hoy-guardia-badge'
    const existing = ov.querySelector(sel)
    if (isToday) {
      if (!existing) {
        const badge = document.createElement('div')
        badge.className = 'hoy-guardia-badge'
        badge.textContent = '¡Hoy Guardia!'
        badge.style.pointerEvents = 'none'
        ov.appendChild(badge)
      }
    } else {
      if (existing?.parentNode) existing.parentNode.removeChild(existing)
    }
  }

  const crearOverlay = (tdEl, fechaStr) => {
    if (!tdEl) return
    const existentes = tdEl.querySelectorAll('.fc-guard-overlay')
    let ov = existentes[0] || null
    if (existentes.length > 1) {
      for (let i = 1; i < existentes.length; i++) existentes[i].parentNode?.removeChild(existentes[i])
    }
    if (!ov) {
      tdEl.style.position = 'relative'
      ov = document.createElement('div')
      ov.className = 'fc-guard-overlay'
      ov.style.pointerEvents = 'none' // no bloquear hover
      tdEl.appendChild(ov)
    }
    overlaysRef.current.set(fechaStr, ov)
    ov.classList.toggle('is-today', fechaStr === hoyStr)
    ensureTodayBadge(ov, fechaStr === hoyStr)
  }

  const crearTooltip = (fechaStr) => {
    if (tooltipsRef.current.has(fechaStr)) return tooltipsRef.current.get(fechaStr)
    const tip = document.createElement('div')
    tip.className = 'tooltip-dinamico'
    tip.style.position = 'fixed'   // coherente con tu CSS
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

  const quitarTooltip = (fechaStr) => {
    const tip = tooltipsRef.current.get(fechaStr)
    if (tip?.parentNode) tip.parentNode.removeChild(tip)
    tooltipsRef.current.delete(fechaStr)
  }

  const dayCellDidMount = info => {
    const fechaStr = yyyyMmDd(info.date)
    const rangos = resumenPorFecha.get(fechaStr)
    if (rangos && rangos.length) {
      crearOverlay(info.el, fechaStr)
      const tip = crearTooltip(fechaStr)
      const texto = formatearTooltip(rangos)
      tip.textContent = texto
      info.el.setAttribute('title', texto) // fallback nativo

      if (!info.el.dataset.tipBound) {
        const onEnter = e => { const t = tooltipsRef.current.get(fechaStr); if (!t) return; t.style.display = 'block'; t.style.left = `${e.pageX + 10}px`; t.style.top = `${e.pageY - 20}px` }
        const onMove  = e => { const t = tooltipsRef.current.get(fechaStr); if (!t) return; t.style.left = `${e.pageX + 10}px`; t.style.top = `${e.pageY - 20}px` }
        const onLeave = () => { const t = tooltipsRef.current.get(fechaStr); if (t) t.style.display = 'none' }
        info.el.addEventListener('mouseenter', onEnter)
        info.el.addEventListener('mousemove', onMove)
        info.el.addEventListener('mouseleave', onLeave)
        info.el.dataset.tipBound = '1'
      }
    }
  }

  const dayCellWillUnmount = info => {
    const fechaStr = yyyyMmDd(info.date)
    quitarTooltip(fechaStr)
    if (info.el?.dataset) delete info.el.dataset.tipBound
  }

  // --- Función para (re)aplicar overlays y tooltips sobre las celdas visibles
  const bindOverlaysAndTooltips = () => {
    const cells = document.querySelectorAll('.cal-mini-card td.fc-daygrid-day')
    cells.forEach(td => {
      const fechaStr = td.getAttribute('data-date')
      if (!fechaStr) return
      const rangos = resumenPorFecha.get(fechaStr)

      if (rangos && rangos.length) {
        crearOverlay(td, fechaStr)
        const tip = crearTooltip(fechaStr)
        const texto = formatearTooltip(rangos)
        tip.textContent = texto
        td.setAttribute('title', texto) // fallback nativo

        if (!td.dataset.tipBound) {
          const onEnter = e => { const t = tooltipsRef.current.get(fechaStr); if (!t) return; t.style.display = 'block'; t.style.left = `${e.pageX + 10}px`; t.style.top = `${e.pageY - 20}px` }
          const onMove  = e => { const t = tooltipsRef.current.get(fechaStr); if (!t) return; t.style.left = `${e.pageX + 10}px`; t.style.top = `${e.pageY - 20}px` }
          const onLeave = () => { const t = tooltipsRef.current.get(fechaStr); if (t) t.style.display = 'none' }
          td.addEventListener('mouseenter', onEnter)
          td.addEventListener('mousemove', onMove)
          td.addEventListener('mouseleave', onLeave)
          td.dataset.tipBound = '1'
        }
      } else {
        quitarTooltip(fechaStr)
        if (td?.dataset) delete td.dataset.tipBound
        td.removeAttribute('title')
      }
    })
  }

  // Cuando cambia el resumen, (re)aplicamos con el DOM ya pintado (doble RAF)
  useEffect(() => {
    let raf1, raf2
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        bindOverlaysAndTooltips()
      })
    })
    return () => {
      if (raf1) cancelAnimationFrame(raf1)
      if (raf2) cancelAnimationFrame(raf2)
    }
  }, [resumenPorFecha])

  // Cuando FullCalendar re-renderiza por 'events', aplicamos en el siguiente tick
  useEffect(() => {
    const t = setTimeout(() => { bindOverlaysAndTooltips() }, 0)
    return () => clearTimeout(t)
  }, [eventos])

  useEffect(() => {
    const api = calendarRef.current?.getApi?.()
    if (api) cargarMesServidor(api.view.currentStart, api.view.currentEnd)
  }, [])

  if (!dni) {
    return (
      <div className='container-fluid'>
        <div className='card border-0 shadow-sm cal-mini-card'>
          <div className='card-header bg-danger text-white d-flex align-items-center justify-content-between flex-wrap'>
            <div className='d-flex align-items-center gap-2'>
              <i className='bi bi-calendar3'></i>
              <strong>{titulo}</strong>
            </div>
            {headerRight}
          </div>
          <div className='card-body'>
            <div className='alert alert-warning mb-0'>No se pudo determinar el usuario logueado</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='container-fluid'>
      <div className='card border-0 shadow-sm cal-mini-card'>
        <div className='card-header bg-danger text-white d-flex align-items-center justify-content-between flex-wrap'>
          <div className='d-flex align-items-center gap-2'>
            <i className='bi bi-calendar3'></i>
            <strong>{titulo}</strong>
          </div>
          {headerRight}
        </div>

        <div className='card-body'>
          {mensaje && <div className='alert alert-warning'>{mensaje}</div>}

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
              height='100%'
              events={eventos}
              eventContent={() => ({ domNodes: [] })}
              datesSet={arg => {
                const s = yyyyMmDd(arg.start)
                const e = yyyyMmDd(arg.end)
                if (ultimoRangoRef.current.start !== s || ultimoRangoRef.current.end !== e) {
                  ultimoRangoRef.current = { start: s, end: e }
                  cargarMesServidor(arg.start, arg.end)
                } else {
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => bindOverlaysAndTooltips())
                  })
                }
              }}
              dayCellDidMount={dayCellDidMount}
              dayCellWillUnmount={dayCellWillUnmount}
            />
          </div>

          <div className='mt-3 d-flex align-items-center gap-2'>
            <span
              className='d-inline-block rounded'
              style={{ width: 16, height: 16, background: BG_FILL, border: `1px solid ${BG_BORDER}` }}
            />
            <small className='text-muted'>Día con guardias asignadas</small>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MisGuardiasCalendar
