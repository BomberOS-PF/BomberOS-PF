// src/Component/Guardia/CalendarioGuardias/GuardiasGrupoCalendar.jsx
// sin ;
import React, { useEffect, useMemo, useRef, useState } from 'react'
import './CalendarioGuardias.css'

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'
import { API_URLS, apiRequest } from '../../../config/api'

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

const hash = s => {
  let h = 0
  for (let i = 0; i < String(s).length; i++) {
    h = ((h << 5) - h) + String(s).charCodeAt(i) | 0
  }
  return Math.abs(h)
}

const colorForGroup = id => {
  // paleta consistente por id
  const h = hash(id) % 360
  const bg = `hsla(${h}, 70%, 75%, .55)`
  const border = `hsla(${h}, 70%, 35%, 1)`
  return { bg, border }
}

const formatearTooltipGrupos = gmap => {
  const lines = ['Guardias por grupo:']
  for (const [gid, data] of gmap.entries()) {
    const nombre = data?.nombre ?? `Grupo ${gid}`
    const bomberos = Array.from(data?.bomberos ?? [])
    const rangos = Array.from(data?.rangos ?? [])
    lines.push(`• ${nombre}`)
    if (bomberos.length) lines.push(`   Bomberos: ${bomberos.join(', ')}`)
    if (rangos.length)   lines.push(`   Rangos: ${rangos.join(' | ')}`)
  }
  return lines.join('\n')
}

const GuardiasGrupoCalendar = ({ titulo = 'Guardias por Grupo', headerRight = null }) => {
  const [eventos, setEventos] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [resumenGrupos, setResumenGrupos] = useState(new Map())
  const [legendGrupos, setLegendGrupos] = useState(new Map())

  const calendarRef = useRef()
  const ultimoRangoRef = useRef({ start: '', end: '' })
  const overlaysRef = useRef(new Map())
  const tooltipsRef = useRef(new Map())
  const hoyStr = useMemo(() => yyyyMmDd(new Date()), [])

  useEffect(() => () => {
    for (const el of overlaysRef.current.values()) el?.parentNode?.removeChild(el)
    overlaysRef.current.clear()
    for (const tip of tooltipsRef.current.values()) tip?.parentNode?.removeChild(tip)
    tooltipsRef.current.clear()
  }, [])

  const cargarMesServidor = async (startDate, endDate) => {
    try {
      setMensaje('')
      const start = yyyyMmDd(startDate)
      const end = yyyyMmDd(endDate)
      ultimoRangoRef.current = { start, end }

      if (!API_URLS?.guardias?.todos) {
        setMensaje('Falta API_URLS.guardias.todos(start, end)')
        setEventos([])
        setResumenGrupos(new Map())
        setLegendGrupos(new Map())
        return
      }

      const resp = await apiRequest(API_URLS.guardias.todos(start, end))
      const rows = resp?.data || []

      const porFecha = new Map()
      const legend = new Map()

      for (const r of rows) {
        const f = typeof r.fecha === 'string' ? r.fecha.slice(0, 10) : yyyyMmDd(new Date(r.fecha))
        const desde = (r.hora_desde || r.desde || '').toString().slice(0, 5)
        const hasta = (r.hora_hasta || r.hasta || '').toString().slice(0, 5)
        const gid = r.grupoId ?? r.idGrupo ?? r.grupo_id
        const gname = r.grupoNombre ?? r.nombreGrupo ?? r.grupo
        if (!f || !desde || !hasta || gid == null) continue

        if (!porFecha.has(f)) porFecha.set(f, new Map())
        const gmap = porFecha.get(f)
        if (!gmap.has(gid)) {
          gmap.set(gid, { nombre: gname || `Grupo ${gid}`, bomberos: new Set(), rangos: new Set() })
          const colors = colorForGroup(gid)
          legend.set(gid, { nombre: gname || `Grupo ${gid}`, colors })
        }
        const g = gmap.get(gid)
        if (r.bomberoNombre || r.bombero || r.nombreBombero)
          g.bomberos.add(r.bomberoNombre || r.bombero || r.nombreBombero)
        g.rangos.add(`${desde}-${hasta}`)
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

      setEventos(backEvents)
      setResumenGrupos(porFecha)
      setLegendGrupos(legend)
    } catch (e) {
      setMensaje(`Error al cargar guardias: ${e.message}`)
      setTimeout(() => setMensaje(''), 4000)
    }
  }

  const crearOverlay = (tdEl, fechaStr, isOther = false) => {
    if (!tdEl) return
    const existentes = tdEl.querySelectorAll('.fc-guard-overlay')
    let ov = existentes[0] || null
    if (!ov) {
      tdEl.style.position = 'relative'
      ov = document.createElement('div')
      ov.className = 'fc-guard-overlay'
      tdEl.appendChild(ov)
    }
    overlaysRef.current.set(fechaStr, ov)

    const esHoy = (fechaStr === hoyStr)
    ov.classList.toggle('is-today', esHoy && !isOther)

    ov.style.background = 'transparent'
    ov.innerHTML = ''
    const gmap = resumenGrupos.get(fechaStr)
    if (gmap && gmap.size) {
      ov.style.display = 'flex'
      ov.style.flexDirection = 'column'
      ov.style.gap = '2px'
      for (const [gid] of gmap) {
        const { bg, border } = colorForGroup(gid)
        const band = document.createElement('div')
        band.className = 'band-grupo'
        band.style.height = '6px'
        band.style.background = bg
        band.style.border = `1px solid ${border}`
        band.style.borderRadius = '4px'
        ov.appendChild(band)
      }
    }
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

  const quitarOverlay = (fechaStr) => { const ov = overlaysRef.current.get(fechaStr); ov?.parentNode?.removeChild(ov); overlaysRef.current.delete(fechaStr) }
  const quitarTooltip = (fechaStr) => { const tip = tooltipsRef.current.get(fechaStr); tip?.parentNode?.removeChild(tip); tooltipsRef.current.delete(fechaStr) }

  const dayCellDidMount = info => {
    const fechaStr = yyyyMmDd(info.date)
    if (!fechaStr) return
    const gmap = resumenGrupos.get(fechaStr)
    if (gmap && gmap.size) {
      crearOverlay(info.el, fechaStr, info.isOther)
      const tip = crearTooltip(fechaStr)
      tip.textContent = formatearTooltipGrupos(gmap)

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
    quitarOverlay(fechaStr)
    quitarTooltip(fechaStr)
    if (info.el?.dataset) delete info.el.dataset.tipBound
  }

  useEffect(() => {
    const api = calendarRef.current?.getApi?.()
    if (api) cargarMesServidor(api.view.currentStart, api.view.currentEnd)
  }, [])

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
                }
              }}
              dayCellDidMount={dayCellDidMount}
              dayCellWillUnmount={dayCellWillUnmount}
            />
          </div>

          {legendGrupos.size > 0 && (
            <div className='mt-3 d-flex flex-wrap gap-3'>
              {Array.from(legendGrupos.entries()).map(([gid, { nombre, colors }]) => (
                <div key={gid} className='d-flex align-items-center gap-2'>
                  <span className='d-inline-block rounded' style={{ width: 16, height: 16, background: colors.bg, border: `1px solid ${colors.border}` }} />
                  <small className='text-muted'>{nombre}</small>
                </div>
              ))}
            </div>
          )}
          {mensaje && <div className='mt-2 alert alert-warning'>{mensaje}</div>}
        </div>
      </div>
    </div>
  )
}

export default GuardiasGrupoCalendar
