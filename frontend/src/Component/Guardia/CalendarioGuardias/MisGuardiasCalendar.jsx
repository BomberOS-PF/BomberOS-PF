// MisGuardiasCalendar.jsx  // sin ;
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

const formatoFechaLarga = s => {
  try {
    const [y, m, d] = s.split('-').map(Number)
    const date = new Date(y, (m || 1) - 1, d || 1)
    return date.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  } catch { return s }
}

// MisGuardias: color único y borde (rellena el casillero completo)
const BG_FILL = 'rgba(240,128,128,0.35)'
const BG_BORDER = '#b30000'

const formatearTooltip = (rangos = []) =>
  ['Guardias:', ...rangos.map(r => {
    const [d, h] = String(r).split('-')
    return `Desde ${d} hasta ${h}`
  })].join('\n')

const MisGuardiasCalendar = ({ dniUsuario, titulo = 'Mis Guardias', headerRight = null }) => {
  // estado
  const [mensaje, setMensaje] = useState('')
  const [resumenPorFecha, setResumenPorFecha] = useState(new Map())
  const [cargandoGuardias, setCargandoGuardias] = useState(false)

  // NUEVO: modal
  const [modalFecha, setModalFecha] = useState(null)

  // refs
  const rootRef = useRef(null)
  const calendarRef = useRef()
  const tooltipsRef = useRef(new Map())
  const lastRangeRef = useRef({ start: null, end: null })

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
      // cleanup al desmontar
      for (const tip of tooltipsRef.current.values()) tip?.parentNode?.removeChild(tip)
      tooltipsRef.current.clear()
    }
  }, [])

  // ===== util DOM =====
  const getVisibleDateCells = () =>
    Array.from(rootRef.current?.querySelectorAll('.fc-daygrid .fc-daygrid-day[data-date]') || [])

  // ===== fetch =====
  const fetchMes = async (y, m0) => {
    const desde = yyyyMmDd(new Date(y, m0, 1))
    const hasta = yyyyMmDd(new Date(y, m0 + 1, 1)) // exclusivo
    const resp = await apiRequest(API_URLS.guardias.porDni(Number(dni), desde, hasta))
    const rows = resp?.data || []

    const map = new Map()
    for (const r of rows) {
      const f = (typeof r.fecha === 'string') ? r.fecha.slice(0, 10) : yyyyMmDd(new Date(r.fecha))
      const desdeH = (r.hora_desde || r.desde || r.horaDesde || r.hora_inicio || r.horaInicio || r.inicio || '').toString().slice(0, 5)
      const hastaH = (r.hora_hasta || r.hasta || r.horaHasta || r.hora_fin || r.horaFin || r.fin || '').toString().slice(0, 5)
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

  const fetchBloqueVisible = async (startDate, endDate) => {
    const endMinus1 = addDays(endDate, -1)
    const center = new Date((startDate.getTime() + endDate.getTime()) / 2)
    const meses = [
      { y: startDate.getFullYear(), m0: startDate.getMonth() },
      { y: center.getFullYear(),    m0: center.getMonth() },
      { y: endMinus1.getFullYear(), m0: endMinus1.getMonth() }
    ]

    let merged = new Map()
    const uniq = []
    for (const { y, m0 } of meses) {
      const key = `${y}-${m0}`
      if (!uniq.includes(key)) uniq.push(key)
    }
    for (const key of uniq) {
      const [yStr, m0Str] = key.split('-')
      const part = await fetchMes(Number(yStr), Number(m0Str))
      merged = mergeResumen(merged, part)
    }
    return merged
  }

  // ===== tooltips =====
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

  // ===== badge "¡Hoy Guardia!" — MISMO estilo (clase) =====
  const ensureTodayBadge = (overlayEl, show) => {
    if (!overlayEl) return
    const sel = '.hoy-guardia-badge'
    let existing = overlayEl.querySelector(sel)
    if (show) {
      if (!existing) {
        existing = document.createElement('div')
        existing.className = 'hoy-guardia-badge'
        existing.style.pointerEvents = 'none'
        existing.textContent = '¡Hoy Guardia!'
        overlayEl.appendChild(existing)
      }
    } else {
      if (existing?.parentNode) existing.parentNode.removeChild(existing)
    }
  }

  // ===== pintado: casillero completo, borde 1px =====
  const removeNativeTitles = el => {
    el?.removeAttribute?.('title')
    el?.querySelectorAll?.('[title]')?.forEach(n => n.removeAttribute('title'))
  }

  const crearOverlayFullCell = (cellEl, fechaStr, rangos) => {
    if (!cellEl) return
    const frame = cellEl.querySelector('.fc-daygrid-day-frame') || cellEl

    if (getComputedStyle(frame).position === 'static') frame.style.position = 'relative'

    let ov = frame.querySelector('.fc-guard-overlay')
    if (!ov) {
      ov = document.createElement('div')
      ov.className = 'fc-guard-overlay'
      ov.style.position = 'absolute'
      ov.style.inset = '0'
      ov.style.borderRadius = '8px'
      ov.style.pointerEvents = 'none'
      ov.style.background = BG_FILL
      ov.style.border = `1px solid ${BG_BORDER}`
      ov.style.boxShadow = 'inset 0 0 0 1px rgba(255,255,255,.15)'
      frame.insertBefore(ov, frame.firstChild)
    } else {
      ov.style.background = BG_FILL
      ov.style.border = `1px solid ${BG_BORDER}`
      ov.style.boxShadow = 'inset 0 0 0 1px rgba(255,255,255,.15)'
    }

    const newKey = String((rangos || []).join('|'))
    if (ov.getAttribute('data-key') !== newKey) ov.setAttribute('data-key', newKey)

    const showBadge = fechaStr === hoyStr && !cellEl.classList.contains('fc-day-other') && (rangos && rangos.length)
    ensureTodayBadge(ov, showBadge)

    removeNativeTitles(cellEl)
    const tip = ensureTooltip(fechaStr)
    tip.textContent = formatearTooltip(rangos || [])

    if (!cellEl.dataset.tipBound) {
      const onEnter = e => { const t = tooltipsRef.current.get(fechaStr); if (!t) return; t.style.display = 'block'; t.style.left = `${e.pageX + 10}px`; t.style.top = `${e.pageY - 20}px` }
      const onMove  = e => { const t = tooltipsRef.current.get(fechaStr); if (!t) return; t.style.left = `${e.pageX + 10}px`; t.style.top = `${e.pageY - 20}px` }
      const onLeave = () => { const t = tooltipsRef.current.get(fechaStr); if (t) t.style.display = 'none' }
      cellEl.addEventListener('mouseenter', onEnter)
      cellEl.addEventListener('mousemove', onMove)
      cellEl.addEventListener('mouseleave', onLeave)
      cellEl.dataset.tipBound = '1'
    }
  }

  const limpiarCelda = cellEl => {
    const frame = cellEl.querySelector('.fc-daygrid-day-frame') || cellEl
    const ov = frame.querySelector('.fc-guard-overlay')
    if (ov?.parentNode) ov.parentNode.removeChild(ov)
    const fechaStr = cellEl.getAttribute('data-date')
    quitarTooltip(fechaStr)
    if (cellEl?.dataset) delete cellEl.dataset.tipBound
    removeNativeTitles(cellEl)
  }

  const pintarVisibles = resumen => {
    const cells = getVisibleDateCells()
    for (const cell of cells) {
      const fechaStr = cell.getAttribute('data-date')
      if (!fechaStr) continue
      const rangos = resumen.get(fechaStr)
      if (rangos && rangos.length) crearOverlayFullCell(cell, fechaStr, rangos)
      else limpiarCelda(cell)
    }
  }

  // ===== pipeline estable por rango visible =====
  const cargarYpintarRango = async (startDate, endDate) => {
    lastRangeRef.current = { start: startDate, end: endDate }

    if (!dni) {
      setMensaje('No se encontró el DNI del usuario')
      return
    }

    setMensaje('')
    setCargandoGuardias(true)

    try {
      const resumen = await fetchBloqueVisible(startDate, endDate)
      setResumenPorFecha(resumen)

      await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)))

      pintarVisibles(resumen)
    } catch (e) {
      setMensaje(`Error al cargar mis guardias: ${e.message}`)
      setTimeout(() => setMensaje(''), 4000)
    } finally {
      setCargandoGuardias(false)
    }
  }

  const closeModal = () => setModalFecha(null)

  if (!dni) {
    return (
      <div className='container-fluid' ref={rootRef}>
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
    <div className='container-fluid' ref={rootRef}>
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

          <div className='calendar-mini-wrapper position-relative'>
            {cargandoGuardias && (
              <div
                className='position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center'
                style={{ background: 'rgba(0,0,0,0.05)', zIndex: 5 }}
              >
                <div className='text-center'>
                  <div className='spinner-border' role='status'>
                    <span className='visually-hidden'>Cargando…</span>
                  </div>
                  <div className='mt-2 small text-muted'>Cargando mis guardias…</div>
                </div>
              </div>
            )}

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
              expandRows={true}

              // Click para abrir el modal con horarios
              dateClick={arg => {
                const f = arg.dateStr?.slice(0, 10)
                if (!f) return
                const rangos = resumenPorFecha.get(f)
                if (rangos && rangos.length) setModalFecha(f)
              }}

              // SIN events: pintamos por DOM para evitar parpadeos
              datesSet={arg => {
                cargarYpintarRango(arg.start, arg.end)
              }}

              dayCellDidMount={info => {
                info.el.removeAttribute?.('title')
              }}

              dayCellWillUnmount={info => {
                const fechaStr = yyyyMmDd(info.date)
                quitarTooltip(fechaStr)
                if (info.el?.dataset) delete info.el.dataset.tipBound
              }}
            />

          </div>

          {/* Modal — igual estilo que Guardias por Grupo, pero sólo horarios */}
          {modalFecha && (() => {
            const rangos = resumenPorFecha.get(modalFecha) || []
            const items = rangos
              .map(r => {
                const [desde, hasta] = String(r).split('-')
                return { desde, hasta }
              })
              .filter(it => it.desde && it.hasta)
              .sort((a, b) => {
                const t = s => {
                  const [hh, mm] = String(s || '').split(':').map(n => parseInt(n, 10) || 0)
                  return hh * 60 + mm
                }
                return t(a.desde) - t(b.desde)
              })

            return (
              <>
                <div
                  className='modal-backdrop show'
                  style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1050 }}
                  onClick={closeModal}
                />
                <div className='modal d-block' tabIndex='-1' role='dialog' style={{ zIndex: 1055 }}>
                  <div className='modal-dialog modal-dialog-centered modal-lg' role='document'>
                    <div className='modal-content modal-content-white'>
                      <div className='bg-danger modal-header'>
                        <h5 className='modal-title text-white'>Guardias — {formatoFechaLarga(modalFecha)}</h5>
                        <button type='button' className='btn-close' aria-label='Cerrar' onClick={closeModal} />
                      </div>
                      <div className='modal-body'>
                        {items.length === 0 ? (
                          <div className='text-muted'>No tenés guardias para esta fecha.</div>
                        ) : (
                          
                          <div className='table-responsive'>
                            <strong className='me-2'>Tus guardias</strong>
                            <table className='table table-sm align-middle mb-0'>

                              <thead>
                                <tr>
                                  <th style={{ width: '50%' }}>Desde</th>
                                  <th style={{ width: '50%' }}>Hasta</th>
                                </tr>
                              </thead>
                              <tbody>
                                {items.map((it, idx) => (
                                  <tr key={`it-${idx}`}>
                                    <td>{it.desde}</td>
                                    <td>{it.hasta}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                      <div className='d-flex justify-content-start align-items-start gap-3 mb-3 px-3'>
                        <button type='button' className='btn btn-back btn-medium' onClick={closeModal}>Cerrar</button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )
          })()}

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
