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

// Colores alineados con GestionarGuardias
const BG_FILL = 'rgba(240,128,128,0.35)' // #f08080 con transparencia
const BG_BORDER = '#b30000'

// Utilidad: formatea los rangos "HH:MM-HH:MM" a líneas para el tooltip
const formatearTooltip = (rangos = []) =>
  ['Guardias:', ...rangos.map(r => {
    const [d, h] = String(r).split('-')
    return `Desde ${d} hasta ${h}`
  })].join('\n')

/**
 * Calendario mensual que pinta los días con guardias del bombero logueado
 */
const MisGuardiasCalendar = ({ dniUsuario, titulo = 'Mis Guardias', headerRight = null }) => {
  const [eventos, setEventos] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [resumenPorFecha, setResumenPorFecha] = useState(new Map())

  const calendarRef = useRef()
  const ultimoRangoRef = useRef({ start: '', end: '' })
  const overlaysRef = useRef(new Map())  // fechaStr -> overlay DIV
  const tooltipsRef = useRef(new Map())  // fechaStr -> tooltip DIV

  // Fecha de HOY en formato YYYY-MM-DD
  const hoyStr = useMemo(() => yyyyMmDd(new Date()), [])

  // DNI del usuario actual
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

  // Limpieza total al desmontar
  useEffect(() => {
    return () => {
      for (const el of overlaysRef.current.values()) {
        if (el?.parentNode) el.parentNode.removeChild(el)
      }
      overlaysRef.current.clear()
      for (const tip of tooltipsRef.current.values()) {
        if (tip?.parentNode) tip.parentNode.removeChild(tip)
      }
      tooltipsRef.current.clear()
    }
  }, [])

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

      const resp = await apiRequest(API_URLS.guardias.porDni(dni, start, end))
      const rows = resp?.data || []

      // Agrupo rangos por fecha
      const porFecha = new Map()
      for (const r of rows) {
        const f = (typeof r.fecha === 'string') ? r.fecha.slice(0, 10) : new Date(r.fecha).toISOString().slice(0, 10)
        const desde = (r.hora_desde || r.desde || '').toString().slice(0, 5)
        const hasta = (r.hora_hasta || r.hasta || '').toString().slice(0, 5)
        if (!f || !desde || !hasta) continue
        if (!porFecha.has(f)) porFecha.set(f, [])
        porFecha.get(f).push(`${desde}-${hasta}`)
      }

      // Eventos de fondo (complemento; el overlay asegura el tooltip y hoy)
      const backEvents = []
      for (const [fecha, rangos] of porFecha) {
        const [y, m, d] = fecha.split('-').map(Number)
        const startCell = new Date(y, (m || 1) - 1, d || 1)
        backEvents.push({
          id: `bg-${fecha}`,
          start: startCell,
          end: addDays(startCell, 1),
          display: 'background',
          backgroundColor: BG_FILL,
          borderColor: 'transparent',
          extendedProps: { fecha, rangos }
        })
      }

      setEventos(backEvents)
      setResumenPorFecha(porFecha)
    } catch (e) {
      setMensaje(`Error al cargar mis guardias: ${e.message}`)
      setTimeout(() => setMensaje(''), 4000)
    }
  }

  // ---------- helpers de overlay/tooltip ----------
  const ensureTodayBadge = (ov, isToday) => {
    if (!ov) return
    const sel = '.hoy-guardia-badge'
    const existing = ov.querySelector(sel)
    if (isToday) {
      if (!existing) {
        const badge = document.createElement('div')
        badge.className = 'hoy-guardia-badge'
        badge.textContent = '¡Hoy Guardia!'
        ov.appendChild(badge)
      }
    } else {
      if (existing && existing.parentNode) existing.parentNode.removeChild(existing)
    }
  }

  const crearOverlay = (tdEl, fechaStr) => {
    if (!tdEl) return
    const existentes = tdEl.querySelectorAll('.fc-guard-overlay')
    let ov = existentes[0] || null
    if (existentes.length > 1) {
      for (let i = 1; i < existentes.length; i++) {
        existentes[i].parentNode?.removeChild(existentes[i])
      }
    }
    if (!ov) {
      tdEl.style.position = 'relative'
      ov = document.createElement('div')
      ov.className = 'fc-guard-overlay'
      tdEl.appendChild(ov)
    }
    overlaysRef.current.set(fechaStr, ov)
    ov.classList.toggle('is-today', fechaStr === hoyStr)
    ensureTodayBadge(ov, fechaStr === hoyStr)
  }

  const quitarOverlay = (fechaStr) => {
    const ov = overlaysRef.current.get(fechaStr)
    if (ov?.parentNode) ov.parentNode.removeChild(ov)
    overlaysRef.current.delete(fechaStr)
  }

  const crearTooltip = (fechaStr) => {
    if (tooltipsRef.current.has(fechaStr)) return tooltipsRef.current.get(fechaStr)
    const tip = document.createElement('div')
    tip.className = 'tooltip-dinamico'
    tip.style.position = 'absolute'
    tip.style.display = 'none'
    tip.style.pointerEvents = 'none'
    tip.style.whiteSpace = 'pre'
    tip.style.padding = '6px 8px'
    tip.style.background = '#222'
    tip.style.color = '#fff'
    tip.style.borderRadius = '6px'
    tip.style.fontSize = '12px'
    tip.style.boxShadow = '0 2px 8px rgba(0,0,0,.25)'
    document.body.appendChild(tip)
    tooltipsRef.current.set(fechaStr, tip)
    return tip
  }

  const quitarTooltip = (fechaStr) => {
    const tip = tooltipsRef.current.get(fechaStr)
    if (tip?.parentNode) tip.parentNode.removeChild(tip)
    tooltipsRef.current.delete(fechaStr)
  }

  // ---------- Hooks de celdas ----------
  const dayCellDidMount = info => {
    const fechaStr = info.date?.toISOString?.().slice(0, 10)
    if (!fechaStr) return

    const rangos = resumenPorFecha.get(fechaStr)
    if (rangos && rangos.length) {
      crearOverlay(info.el, fechaStr)
      const tip = crearTooltip(fechaStr)
      tip.textContent = formatearTooltip(rangos)

      if (!info.el.dataset.tipBound) {
        const onEnter = (e) => {
          const t = tooltipsRef.current.get(fechaStr)
          if (!t) return
          t.style.display = 'block'
          t.style.left = `${e.pageX + 10}px`
          t.style.top = `${e.pageY - 20}px`
        }
        const onMove = (e) => {
          const t = tooltipsRef.current.get(fechaStr)
          if (!t) return
          t.style.left = `${e.pageX + 10}px`
          t.style.top = `${e.pageY - 20}px`
        }
        const onLeave = () => {
          const t = tooltipsRef.current.get(fechaStr)
          if (t) t.style.display = 'none'
        }

        info.el.addEventListener('mouseenter', onEnter)
        info.el.addEventListener('mousemove', onMove)
        info.el.addEventListener('mouseleave', onLeave)
        info.el.dataset.tipBound = '1'
      }
    }
  }

  const dayCellWillUnmount = info => {
    const fechaStr = info.date?.toISOString?.().slice(0, 10)
    quitarOverlay(fechaStr)
    quitarTooltip(fechaStr)
    if (info.el?.dataset) delete info.el.dataset.tipBound
  }

  // 🔁 Cuando llega/actualiza el resumen del servidor, (re)aplico overlay + tooltip
  useEffect(() => {
    const cells = document.querySelectorAll('.cal-mini-card td.fc-daygrid-day')
    cells.forEach(td => {
      const fechaStr = td.getAttribute('data-date')
      if (!fechaStr) return
      const rangos = resumenPorFecha.get(fechaStr)

      if (rangos && rangos.length) {
        crearOverlay(td, fechaStr)
        const tip = crearTooltip(fechaStr)
        tip.textContent = formatearTooltip(rangos)

        if (!td.dataset.tipBound) {
          const onEnter = (e) => {
            const t = tooltipsRef.current.get(fechaStr)
            if (!t) return
            t.style.display = 'block'
            t.style.left = `${e.pageX + 10}px`
            t.style.top = `${e.pageY - 20}px`
          }
          const onMove = (e) => {
            const t = tooltipsRef.current.get(fechaStr)
            if (!t) return
            t.style.left = `${e.pageX + 10}px`
            t.style.top = `${e.pageY - 20}px`
          }
          const onLeave = () => {
            const t = tooltipsRef.current.get(fechaStr)
            if (t) t.style.display = 'none'
          }
          td.addEventListener('mouseenter', onEnter)
          td.addEventListener('mousemove', onMove)
          td.addEventListener('mouseleave', onLeave)
          td.dataset.tipBound = '1'
        }
      } else {
        quitarOverlay(fechaStr)
        quitarTooltip(fechaStr)
        if (td?.dataset) delete td.dataset.tipBound
      }
    })
  }, [resumenPorFecha, hoyStr])

  // ⚡ Carga inicial forzada
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
                const s = arg.start?.toISOString?.() || ''
                const e = arg.end?.toISOString?.() || ''
                if (ultimoRangoRef.current.start !== s || ultimoRangoRef.current.end !== e) {
                  ultimoRangoRef.current = { start: s, end: e }
                  cargarMesServidor(arg.start, arg.end)
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
