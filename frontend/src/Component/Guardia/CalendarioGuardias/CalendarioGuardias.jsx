// src/Component/Guardia/CalendarioGuardias/CalendarioGuardias.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react'
import './CalendarioGuardias.css' // ⬅️ estilos locales (NO los de FullCalendar)

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

/**
 * Calendario mensual que pinta los días con guardias del bombero logueado
 * Props:
 *  - dniUsuario?: number | string
 *  - titulo?: string
 */
const CalendarioGuardias = ({ dniUsuario, titulo = 'Mis Guardias' }) => {
  const [eventos, setEventos] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [resumenPorFecha, setResumenPorFecha] = useState(new Map())
  const calendarRef = useRef()
  const ultimoRangoRef = useRef({ start: '', end: '' })
  const tooltipsRef = useRef(new Map())

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

  // Limpieza de tooltips al desmontar
  useEffect(() => {
    return () => {
      for (const tip of tooltipsRef.current.values()) {
        if (tip && tip.parentNode) tip.parentNode.removeChild(tip)
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

      // Eventos de background (además pintamos la celda por clase)
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

  // Pintado + tooltips en el mount de cada celda
  const dayCellDidMount = info => {
    const dateStr = info.date?.toISOString?.().slice(0, 10)
    if (!dateStr) return
    const rangos = resumenPorFecha.get(dateStr)

    // PINTAR CELDA
    if (rangos && rangos.length) {
      info.el.classList.add('fc-dia-guardia')
      const frame = info.el.querySelector('.fc-daygrid-day-frame')
      if (frame) {
        frame.style.background = BG_FILL
        frame.style.boxShadow = `inset 0 0 0 1px ${BG_BORDER}`
      }
    }

    // Tooltip
    if (rangos && rangos.length) {
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
      tip.innerText = `Guardias:\n${rangos.join('\n')}`

      document.body.appendChild(tip)
      tooltipsRef.current.set(dateStr, tip)

      info.el.addEventListener('mouseenter', e => {
        tip.style.display = 'block'
        tip.style.left = `${e.pageX + 10}px`
        tip.style.top = `${e.pageY - 20}px`
      })
      info.el.addEventListener('mousemove', e => {
        tip.style.left = `${e.pageX + 10}px`
        tip.style.top = `${e.pageY - 20}px`
      })
      info.el.addEventListener('mouseleave', () => {
        tip.style.display = 'none'
      })
    }
  }

  const dayCellWillUnmount = info => {
    const dateStr = info.date?.toISOString?.().slice(0, 10)

    // Limpio estilos de pintado
    const frame = info.el.querySelector('.fc-daygrid-day-frame')
    if (frame) {
      frame.style.background = ''
      frame.style.boxShadow = ''
    }
    info.el.classList.remove('fc-dia-guardia')

    // Limpio tooltip
    const tip = tooltipsRef.current.get(dateStr)
    if (tip && tip.parentNode) tip.parentNode.removeChild(tip)
    tooltipsRef.current.delete(dateStr)
  }

  // 🔁 Re-pinta celdas si llega data después del mount (robusto)
  useEffect(() => {
    const cells = document.querySelectorAll('.cal-mini-card .fc-daygrid-day')
    cells.forEach(cell => {
      const dateStr = cell.getAttribute('data-date')
      const frame = cell.querySelector('.fc-daygrid-day-frame')
      if (!frame) return
      if (resumenPorFecha.has(dateStr)) {
        cell.classList.add('fc-dia-guardia')
        frame.style.background = BG_FILL
        frame.style.boxShadow = `inset 0 0 0 1px ${BG_BORDER}`
      } else {
        cell.classList.remove('fc-dia-guardia')
        frame.style.background = ''
        frame.style.boxShadow = ''
      }
    })
  }, [resumenPorFecha])

  if (!dni) {
    return (
      <div className='card border-0 shadow-sm'>
        <div className='card-header bg-danger text-white'><strong>{titulo}</strong></div>
        <div className='card-body'>
          <div className='alert alert-warning mb-0'>No se pudo determinar el usuario logueado</div>
        </div>
      </div>
    )
  }

  return (
    <div className='card border-0 shadow-sm cal-mini-card'>
      <div className='card-header bg-danger text-white d-flex align-items-center gap-2'>
        <i className='bi bi-calendar3'></i>
        <strong>{titulo}</strong>
        <span className='ms-auto badge bg-light text-danger'></span>
      </div>

      <div className='card-body'>
        {mensaje && <div className='alert alert-warning'>{mensaje}</div>}

        <div className="calendar-mini-wrapper">{/* ⬅️ fija el alto */}
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView='dayGridMonth'
            locale={esLocale}
            headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
            firstDay={1}
            fixedWeekCount={false}
            showNonCurrentDates={true}
            height='100%'                // llena el wrapper (que sí tiene height)
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
  )
}

export default CalendarioGuardias
