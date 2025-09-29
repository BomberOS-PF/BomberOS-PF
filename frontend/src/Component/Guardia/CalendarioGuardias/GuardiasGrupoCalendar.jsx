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

const parseYmd = s => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

// Golden-angle hashing por grupo
const goldenHue = n => Math.floor(n * 137.508) % 360
const colorForGroup = id => {
  const n = typeof id === 'number' ? id : String(id).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const h = goldenHue(n)
  const bg = `hsla(${h}, 78%, 60%, .85)`
  const border = `hsla(${h}, 82%, 35%, 1)`
  return { bg, border }
}

const GuardiasGrupoCalendar = ({ titulo = 'Guardias por Grupo', headerRight = null }) => {
  // estado
  const [grupos, setGrupos] = useState([])
  const [cargandoGrupos, setCargandoGrupos] = useState(false)
  const [errorGrupos, setErrorGrupos] = useState('')

  const [cargandoGuardias, setCargandoGuardias] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // refs UI
  const rootRef = useRef(null)
  const calendarRef = useRef()
  const tooltipsRef = useRef(new Map())
  const hoyStr = useMemo(() => yyyyMmDd(new Date()), [])

  // última ventana visible (para repintar cuando lleguen grupos)
  const lastRangeRef = useRef({ start: null, end: null })

  // ===== Leyenda (footer) =====
  const legendItems = useMemo(() => {
    return grupos.map(g => {
      const { bg, border } = colorForGroup(g.id)
      return { id: g.id, nombre: g.nombre, colors: { bg, border } }
    })
  }, [grupos])

  // ====== util DOM ======
  const getVisibleDateCells = () =>
    Array.from(rootRef.current?.querySelectorAll('.fc-daygrid .fc-daygrid-day[data-date]') || [])

  const getVisibleDatesSet = () => {
    const s = new Set()
    for (const td of getVisibleDateCells()) {
      const f = td.getAttribute('data-date')
      if (f) s.add(f)
    }
    return s
  }

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
      } catch (e) {
        setErrorGrupos(`No se pudo cargar grupos: ${e.message}`)
      } finally {
        setCargandoGrupos(false)
      }
    }
    cargar()
  }, [])

  // Cuando cargan los grupos y ya teníamos rango, repinto
  useEffect(() => {
    const { start, end } = lastRangeRef.current || {}
    if (start && end && grupos.length) {
      cargarYpintarRango(start, end)
    }
  }, [grupos])

  // ===== Tooltips negros =====
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

  // ===== Pintado (sin events de FC) =====
  const removeNativeTitles = el => {
    el?.removeAttribute?.('title')
    el?.querySelectorAll?.('[title]')?.forEach(n => n.removeAttribute('title'))
  }

  const pintarCelda = (td, fechaStr, gmap) => {
    const frame = td.querySelector('.fc-daygrid-day-frame') || td
    let ov = frame.querySelector('.fc-guard-overlay')
    if (!ov) {
      frame.style.position = 'relative'
      ov = document.createElement('div')
      ov.className = 'fc-guard-overlay'
      ov.style.pointerEvents = 'none'
      ov.style.display = 'flex'
      ov.style.flexDirection = 'column'
      ov.style.gap = '4px'
      frame.appendChild(ov)
    }

    const esHoy = fechaStr === hoyStr
    ov.classList.toggle('is-today', esHoy && !td.classList.contains('fc-day-other'))

    // clave de contenido para evitar repintar igual → sin parpadeo
    const newKey = Array.from(gmap.keys()).sort((a, b) => Number(a) - Number(b)).join('|')
    if (ov.getAttribute('data-key') !== newKey) {
      ov.innerHTML = ''
      const entries = Array.from(gmap.entries()).sort((a, b) => Number(a[0]) - Number(b[0]))
      for (const [gid, meta] of entries) {
        const { bg, border } = colorForGroup(gid)
        const band = document.createElement('div')
        band.className = 'band-grupo'
        band.style.background = bg
        band.style.border = `1px solid ${border}`
        band.style.borderRadius = '6px'
        band.style.height = '12px'
        band.style.boxShadow = 'inset 0 0 0 1px rgba(255,255,255,.15)'
        band.style.display = 'flex'
        band.style.alignItems = 'center'

        const label = document.createElement('span')
        label.className = 'band-label'
        label.textContent = (meta?.nombre || `G${gid}`).slice(0, 18)
        label.style.fontSize = '9px'
        label.style.lineHeight = '12px'
        label.style.padding = '0 4px'
        label.style.color = '#111'
        label.style.fontWeight = '700'
        label.style.opacity = '.85'
        band.appendChild(label)

        ov.appendChild(band)
      }
      ov.setAttribute('data-key', newKey)
    }

    // tooltips
    removeNativeTitles(td)
    if (!td.dataset.tipBound) {
      const onEnter = e => { const t = ensureTooltip(fechaStr); t.textContent = formatearTooltip(gmap); t.style.display = 'block'; t.style.left = `${e.pageX + 10}px`; t.style.top = `${e.pageY - 20}px` }
      const onMove  = e => { const t = tooltipsRef.current.get(fechaStr); if (!t) return; t.style.left = `${e.pageX + 10}px`; t.style.top = `${e.pageY - 20}px` }
      const onLeave = () => { const t = tooltipsRef.current.get(fechaStr); if (t) t.style.display = 'none' }
      td.addEventListener('mouseenter', onEnter)
      td.addEventListener('mousemove', onMove)
      td.addEventListener('mouseleave', onLeave)
      td.dataset.tipBound = '1'
    }
  }

  const limpiarCelda = td => {
    const frame = td.querySelector('.fc-daygrid-day-frame') || td
    const ov = frame.querySelector('.fc-guard-overlay')
    if (ov?.parentNode) ov.parentNode.removeChild(ov)
    const fechaStr = td.getAttribute('data-date')
    quitarTooltip(fechaStr)
    if (td?.dataset) delete td.dataset.tipBound
  }

  // ===== Fetch en bloque que cubre la grilla visible =====
  const fetchBloqueVisible = async (startDate, endDate) => {
    const endMinus1 = addDays(endDate, -1)
    const center = new Date((startDate.getTime() + endDate.getTime()) / 2)
    const meses = [
      { y: startDate.getFullYear(), m0: startDate.getMonth() },
      { y: center.getFullYear(),    m0: center.getMonth() },
      { y: endMinus1.getFullYear(), m0: endMinus1.getMonth() }
    ]

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
          const f = typeof r.fecha === 'string' ? r.fecha.slice(0, 10) : (r.fecha ? yyyyMmDd(new Date(r.fecha)) : null)
          if (!f) continue
          if (!porFecha.has(f)) porFecha.set(f, new Map())
          const gmap = porFecha.get(f)
          if (!gmap.has(g.id)) gmap.set(g.id, { nombre: g.nombre, rangos: new Set(), bomberos: new Set() })
          const desdeH = (r.hora_desde || r.desde || '').toString().slice(0, 5)
          const hastaH = (r.hora_hasta || r.hasta || '').toString().slice(0, 5)
          if (desdeH && hastaH) gmap.get(g.id).rangos.add(`${desdeH}-${hastaH}`)
          const bombero = r.bomberoNombre || r.bombero || r.nombreBombero || r.nombre_bombero || null
          if (bombero) gmap.get(g.id).bomberos.add(bombero)
        }
      }
      return porFecha
    }

    const merge = (base, extra) => {
      const res = new Map(base)
      for (const [fecha, gmap] of extra) {
        if (!res.has(fecha)) res.set(fecha, new Map())
        const tgt = res.get(fecha)
        for (const [gid, agg] of gmap) {
          if (!tgt.has(gid)) {
            tgt.set(gid, { nombre: agg.nombre, rangos: new Set(agg.rangos), bomberos: new Set(agg.bomberos) })
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

    let merged = new Map()
    for (const { y, m0 } of meses) {
      const part = await fetchMes(y, m0)
      merged = merge(merged, part)
    }
    return merged
  }

  // ===== ciclo principal por rango visible (SIN events) =====
  const cargarYpintarRango = async (startDate, endDate) => {
    // guardo el rango por si todavía no hay grupos
    lastRangeRef.current = { start: startDate, end: endDate }

    // si no hay grupos, no podemos pedir guardias; apagamos y salimos
    if (!grupos.length) {
      setCargandoGuardias(false)
      return
    }

    setErrorMsg('')
    setCargandoGuardias(true)

    try {
      // asegurar que la grilla esté dibujada
      await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)))

      // 1) Fechas visibles reales
      const visibles = getVisibleDatesSet()

      // 2) Data para cubrir la vista
      const resumen = await fetchBloqueVisible(startDate, endDate)

      // 3) Pintar SOLO visibles
      const cells = getVisibleDateCells()
      for (const td of cells) {
        const f = td.getAttribute('data-date')
        const gmap = resumen.get(f)
        if (gmap && gmap.size) pintarCelda(td, f, gmap)
        else limpiarCelda(td)
      }
    } catch (e) {
      setErrorMsg(`Error al cargar guardias por grupo: ${e.message}`)
    } finally {
      setCargandoGuardias(false)
    }
  }

  return (
    <div className='container-fluid' ref={rootRef}>
      <div className='card border-0 shadow-sm cal-mini-card'>
        <div className='card-header bg-danger text-white d-flex align-items-center justify-content-between flex-wrap'>
          <div className='d-flex align-items-center gap-2'>
            <i className='bi bi-people-fill'></i>
            <strong>{titulo}</strong>
            {/* Mostrar texto de "Cargando grupos…" solo si NO está el overlay de guardias */}
            {cargandoGrupos && !cargandoGuardias && (
              <small className='ms-2 text-white-50'>Cargando grupos…</small>
            )}
            {errorGrupos && <small className='ms-2 text-warning'>{errorGrupos}</small>}
          </div>
          {headerRight}
        </div>

        <div className='card-body'>
          {errorMsg && <div className='alert alert-danger py-2'>{errorMsg}</div>}

          <div className='calendar-mini-wrapper position-relative' style={{ minHeight: 520 }}>
            {(cargandoGuardias || cargandoGrupos) && (
              <div
                className='position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center'
                style={{ background: 'rgba(0,0,0,0.05)', zIndex: 5 }}
              >
                <div className='text-center'>
                  <div className='spinner-border' role='status'>
                    <span className='visually-hidden'>Cargando…</span>
                  </div>
                  <div className='mt-2 small text-muted'>
                    {cargandoGrupos ? 'Cargando grupos…' : 'Cargando guardias…'}
                  </div>
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
              contentHeight={650}

              datesSet={arg => {
                // cada cambio de rango: pintar y recién ahí apagar
                cargarYpintarRango(arg.start, arg.end)
              }}

              dayCellDidMount={info => {
                // sacar title nativo
                info.el.removeAttribute?.('title')
              }}

              dayCellWillUnmount={info => {
                const fechaStr = yyyyMmDd(info.date)
                quitarTooltip(fechaStr)
                if (info.el?.dataset) delete info.el.dataset.tipBound
              }}
            />
          </div>

          {/* ===== Footer / Leyenda de colores por grupo ===== */}
          {legendItems.length > 0 && (
            <div className='mt-3 d-flex flex-wrap gap-3 align-items-center'>
              {legendItems.map(item => (
                <div key={item.id} className='d-flex align-items-center gap-2'>
                  <span
                    className='d-inline-block rounded'
                    style={{ width: 18, height: 18, background: item.colors.bg, border: `1px solid ${item.colors.border}` }}
                    aria-label={`Color del ${item.nombre}`}
                  />
                  <small className='text-muted'>{item.nombre}</small>
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
