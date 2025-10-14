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

const formatoFechaLarga = s => {
  try {
    const d = parseYmd(s)
    return d.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  } catch { return s }
}

// ordenar por hora-desde (asc) y después por nombre
const timeToNum = t => {
  if (!t) return 999999
  const [hh, mm] = String(t).split(':').map(n => parseInt(n, 10) || 0)
  return hh * 60 + mm
}
const byDesdeLuegoNombre = (a, b) =>
  (timeToNum(a.desde) - timeToNum(b.desde)) ||
  (String(a.bombero || '').localeCompare(String(b.bombero || '')))

// ===== PALETA LIMITADA (más oscura): amarillo, naranja, rojo, gris, negro =====
const FAMILY = [
  { name: 'orange', h: 32,  s: 96, legL: 48, softL: 66, alpha: .48, borderL: 22, hueOffsets: [0, +8, -8, +14, -14] },
  { name: 'red',    h: 0,   s: 84, legL: 46, softL: 62, alpha: .48, borderL: 20, hueOffsets: [0, +8, -8, +14, -14] },
  { name: 'violet', h: 276, s: 72, legL: 52, softL: 64, alpha: .46, borderL: 24, hueOffsets: [0, +8, -8, +14, -14] },
  { name: 'blue',   h: 214, s: 88, legL: 50, softL: 64, alpha: .44, borderL: 22, hueOffsets: [0, +8, -8, +14, -14] },
  { name: 'black',  h: 0,   s: 0,  legL: 16, softL: 12, alpha: .32, borderL: 12, hueOffsets: [0, 0, 0, 0, 0] },
]


// hash simple por id
const hashId = id => {
  if (typeof id === 'number') return Math.abs(id|0)
  const s = String(id)
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

// colores leyenda y banda
const colorForGroup = id => {
  const h = hashId(id)
  const family = FAMILY[h % FAMILY.length]
  const shadeIdx = Math.floor(h / FAMILY.length) % family.hueOffsets.length
  const hue = (family.h + family.hueOffsets[shadeIdx] + 360) % 360

  const legendBg = (family.s === 0)
    ? `hsla(0, 0%, ${family.legL}%, .92)`
    : `hsla(${hue}, ${family.s}%, ${family.legL}%, .92)`

  const legendBorder = (family.s === 0)
    ? `hsla(0, 0%, ${family.borderL}%, 1)`
    : `hsla(${hue}, ${Math.min(100, family.s + 4)}%, ${family.borderL}%, 1)`

  const softBg = (family.s === 0)
    ? `hsla(0, 0%, ${family.softL}%, ${family.alpha})`
    : `hsla(${hue}, ${Math.min(100, family.s + 2)}%, ${family.softL}%, ${family.alpha})`

  return { legendBg, legendBorder, softBg }
}

const GuardiasGrupoCalendar = ({ titulo = 'Guardias por Grupo', headerRight = null, collapsed = false }) => {
  const [grupos, setGrupos] = useState([])
  const [cargandoGrupos, setCargandoGrupos] = useState(false)
  const [errorGrupos, setErrorGrupos] = useState('')

  const [cargandoGuardias, setCargandoGuardias] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // modal
  const [modalFecha, setModalFecha] = useState(null) // 'YYYY-MM-DD'

  const rootRef = useRef(null)
  const calendarRef = useRef()
  const tooltipsRef = useRef(new Map())

  const lastRangeRef = useRef({ start: null, end: null })
  // fecha -> Map(gid -> { nombre, rangos:Set, bomberos:Set, items:[{bombero,desde,hasta}] })
  const resumenRef = useRef(new Map())
  const visibleOrderRef = useRef([])
  const runsLayerRef = useRef(null)

  // ========= RESOLUCIÓN DE NOMBRES DE BOMBERO =========
  const nombreCompleto = u => [u?.nombre, u?.apellido].filter(Boolean).join(' ').trim()

  const rosterIdCacheRef = useRef(new Map())   // gid -> Map(id -> nombre)
  const rosterDniCacheRef = useRef(new Map())  // gid -> Map(dni -> nombre)

  const bomberosGlobalRef = useRef({ byId: null, byDni: null, loaded: false })

  const buildMapsFromRosterArray = (arr) => {
    const byId = new Map()
    const byDni = new Map()
    for (const r of arr) {
      const id = r.id ?? r.bomberoId ?? r.idBombero ?? r.usuarioId ?? r.idUsuario ?? r.bombero_id ?? r.id_bombero
      const dni = r.dni ?? r.documento ?? r.nroDocumento ?? r.numeroDocumento
      const nom = r.nombreCompleto ?? nombreCompleto(r) ?? r.nombre ?? r.apellido
      if (id != null && nom) byId.set(Number(id), String(nom))
      if (dni != null && nom) byDni.set(String(dni), String(nom))
    }
    return { byId, byDni }
  }

  const ensureGrupoRoster = async gid => {
    if (rosterIdCacheRef.current.has(gid)) return rosterIdCacheRef.current.get(gid)
    try {
      const resp = await apiRequest(API_URLS.grupos.obtenerBomberosDelGrupo(gid))
      const arr = Array.isArray(resp) ? resp : (resp?.data ?? resp?.results ?? resp?.rows ?? resp?.items ?? [])
      const { byId, byDni } = buildMapsFromRosterArray(arr)
      rosterIdCacheRef.current.set(gid, byId)
      rosterDniCacheRef.current.set(gid, byDni)
      return byId
    } catch {
      const empty = new Map()
      rosterIdCacheRef.current.set(gid, empty)
      rosterDniCacheRef.current.set(gid, new Map())
      return empty
    }
  }

  const ensureBomberosGlobal = async () => {
    if (bomberosGlobalRef.current.loaded) return bomberosGlobalRef.current
    try {
      const resp = await apiRequest(API_URLS.bomberos.getAll)
      const arr = Array.isArray(resp) ? resp : (resp?.data ?? resp?.results ?? resp?.rows ?? resp?.items ?? [])
      const { byId, byDni } = buildMapsFromRosterArray(arr)
      bomberosGlobalRef.current = { byId, byDni, loaded: true }
      return bomberosGlobalRef.current
    } catch {
      bomberosGlobalRef.current = { byId: new Map(), byDni: new Map(), loaded: true }
      return bomberosGlobalRef.current
    }
  }

  const resolveNombreBombero = async ({ r, rosterId, rosterDni }) => {
    // directo
    const bomObj = (r.bombero && typeof r.bombero === 'object') ? r.bombero : null
    let nom = r.bomberoNombre || r.nombreBombero || r.nombre_bombero || (bomObj ? nombreCompleto(bomObj) : null)
    if (nom) return String(nom)

    // por id
    const bomId = r.bomberoId ?? r.idBombero ?? r.bombero_id ?? r.id_bombero ?? r.usuarioId ?? r.idUsuario
    if (bomId != null) {
      const inRoster = rosterId?.get?.(Number(bomId))
      if (inRoster) return String(inRoster)
      const global = await ensureBomberosGlobal()
      const inGlobal = global.byId.get(Number(bomId))
      if (inGlobal) return String(inGlobal)
    }

    // por DNI/documento
    const dni = r.dni ?? r.documento ?? r.nroDocumento ?? r.numeroDocumento ?? r.bomberoDni ?? r.dniBombero
    if (dni != null) {
      const inRosterDni = rosterDni?.get?.(String(dni))
      if (inRosterDni) return String(inRosterDni)
      const global = await ensureBomberosGlobal()
      const inGlobalDni = global.byDni.get(String(dni))
      if (inGlobalDni) return String(inGlobalDni)
    }

    return null
  }
  // ========= FIN resolución de nombres =========

  const legendItems = useMemo(() => {
    return grupos.map(g => {
      const { legendBg, legendBorder } = colorForGroup(g.id)
      return { id: g.id, nombre: g.nombre, colors: { bg: legendBg, border: legendBorder } }
    })
  }, [grupos])

  const getVisibleDateCells = () =>
    Array.from(rootRef.current?.querySelectorAll('.fc-daygrid .fc-daygrid-day[data-date]') || [])

  const getCellByDate = fechaStr =>
    rootRef.current?.querySelector(`.fc-daygrid .fc-daygrid-day[data-date="${fechaStr}"]`) || null

  const getVisibleDatesSorted = () =>
    getVisibleDateCells().map(td => td.getAttribute('data-date')).filter(Boolean).sort()

  const ensureRunsLayer = () => {
    const wrapper = rootRef.current?.querySelector('.calendar-mini-wrapper')
    if (!wrapper) return null
    if (getComputedStyle(wrapper).position === 'static') wrapper.style.position = 'relative'
    let layer = runsLayerRef.current
    if (!layer) {
      layer = document.createElement('div')
      layer.className = 'fc-runs-layer'
      layer.style.position = 'absolute'
      layer.style.inset = '0'
      layer.style.pointerEvents = 'none'
      layer.style.zIndex = '0'
      wrapper.insertBefore(layer, wrapper.firstChild)
      runsLayerRef.current = layer
    }
    return layer
  }

  const clearRunsLayer = () => {
    const layer = ensureRunsLayer()
    if (layer) layer.innerHTML = ''
  }

  // ========= Carga de grupos =========
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

  useEffect(() => {
    const { start, end } = lastRangeRef.current || {}
    if (start && end && grupos.length) {
      cargarYpintarRango(start, end)
    }
  }, [grupos])

  // ===== Tooltips por día + cursor/click =====
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

  const removeNativeTitles = el => {
    el?.removeAttribute?.('title')
    el?.querySelectorAll?.('[title]')?.forEach(n => n.removeAttribute('title'))
  }

  const bindTooltipsForCells = () => {
    for (const td of getVisibleDateCells()) {
      const fechaStr = td.getAttribute('data-date')
      const gmap = resumenRef.current.get(fechaStr)
      removeNativeTitles(td)

      if (gmap && gmap.size) {
        td.style.cursor = 'pointer'
        if (!td.dataset.clickBound) {
          td.addEventListener('click', () => setModalFecha(fechaStr))
          td.dataset.clickBound = '1'
        }

        if (!td.dataset.tipBound) {
          const onEnter = e => { const t = ensureTooltip(fechaStr); t.textContent = formatearTooltip(gmap); t.style.display = 'block'; t.style.left = `${e.pageX + 10}px`; t.style.top = `${e.pageY - 20}px` }
          const onMove  = e => { const t = tooltipsRef.current.get(fechaStr); if (!t) return; t.style.left = `${e.pageX + 10}px`; t.style.top = `${e.pageY - 20}px` }
          const onLeave = () => { const t = tooltipsRef.current.get(fechaStr); if (t) t.style.display = 'none' }
          td.addEventListener('mouseenter', onEnter)
          td.addEventListener('mousemove', onMove)
          td.addEventListener('mouseleave', onLeave)
          td.dataset.tipBound = '1'
        }
      } else {
        td.style.cursor = ''
        quitarTooltip(fechaStr)
        if (td?.dataset) {
          delete td.dataset.tipBound
          delete td.dataset.clickBound
        }
      }
    }
  }

  // ===== Barridos (franjas multi-día) =====
  const buildRuns = () => {
    const order = visibleOrderRef.current
    const dates = getVisibleDatesSorted()
    const runs = []

    for (const gid of order) {
      let runStart = null
      let prev = null
      for (const f of dates) {
        const has = resumenRef.current.get(f)?.has(gid)
        if (has) {
          if (!runStart) { runStart = f; prev = f }
          else {
            const prevNext = yyyyMmDd(addDays(parseYmd(prev), 1))
            if (prevNext === f) prev = f
            else { runs.push({ gid, start: runStart, end: prev }); runStart = f; prev = f }
          }
        } else if (runStart) {
          runs.push({ gid, start: runStart, end: prev })
          runStart = null
          prev = null
        }
      }
      if (runStart) runs.push({ gid, start: runStart, end: prev })
    }
    return runs
  }

  const segmentRunByWeek = (run, wrapRect, rowIndex, rowH, reservedTop) => {
    const segments = []
    const days = []
    let d = parseYmd(run.start)
    const end = parseYmd(run.end)
    while (d.getTime() <= end.getTime()) { days.push(yyyyMmDd(d)); d = addDays(d, 1) }

    let segFirstCell = null
    let segLastCell = null
    let currTop = null

    const pushSeg = () => {
      if (!segFirstCell || !segLastCell) return
      const firstRect = segFirstCell.getBoundingClientRect()
      const lastRect  = segLastCell.getBoundingClientRect()
      const frameTopRect = (segFirstCell.querySelector('.fc-daygrid-day-frame') || segFirstCell).getBoundingClientRect()
      const left  = firstRect.left - wrapRect.left
      const right = lastRect.right - wrapRect.left
      const width = Math.max(0, right - left)
      const top   = (frameTopRect.top - wrapRect.top) + reservedTop + rowIndex * (rowH + 2)
      segments.push({ left, width, top })
    }

    for (const f of days) {
      const cell = getCellByDate(f)
      if (!cell) continue
      const frame = cell.querySelector('.fc-daygrid-day-frame') || cell
      const top = Math.round(frame.getBoundingClientRect().top)

      if (currTop == null) {
        currTop = top
        segFirstCell = cell
        segLastCell = cell
      } else if (top !== currTop) {
        pushSeg()
        currTop = top
        segFirstCell = cell
        segLastCell = cell
      } else {
        segLastCell = cell
      }
    }
    pushSeg()
    return segments
  }

  const findGroupMeta = gid => {
    const g = grupos.find(x => Number(x.id) === Number(gid))
    return g ? { nombre: g.nombre } : { nombre: `G${gid}` }
  }

  const renderRuns = () => {
    const layer = ensureRunsLayer()
    if (!layer) return
    layer.innerHTML = ''

    const wrapper = rootRef.current?.querySelector('.calendar-mini-wrapper')
    const grid = rootRef.current?.querySelector('.fc-daygrid-body')
    if (!wrapper || !grid) return

    const wrapRect = wrapper.getBoundingClientRect()
    const order = visibleOrderRef.current
    const K = Math.max(1, order.length || 1)

    const anyCell = getVisibleDateCells()[0]
    const frame = anyCell?.querySelector('.fc-daygrid-day-frame') || anyCell
    const frameRect = frame?.getBoundingClientRect?.()
    const frameH = frameRect ? frameRect.height : 90
    const reservedTop = 22
    const reservedBottom = 6
    const avail = Math.max(24, frameH - reservedTop - reservedBottom)
    const rowH = Math.max(10, Math.floor(avail / K) - 2)

    const runs = buildRuns()

    for (const run of runs) {
      const rowIndex = Math.max(0, visibleOrderRef.current.indexOf(run.gid))
      const { softBg } = colorForGroup(run.gid)
      const meta = findGroupMeta(run.gid)

      const segments = segmentRunByWeek(run, wrapRect, rowIndex, rowH, reservedTop)
      if (!segments.length) continue

      const labelSegIndex = Math.floor(segments.length / 2)

      segments.forEach((seg, i) => {
        const band = document.createElement('div')
        band.className = 'fc-run-band'
        band.style.position = 'absolute'
        band.style.left = `${seg.left}px`
        band.style.top = `${seg.top}px`
        band.style.width = `${seg.width}px`
        band.style.height = `${rowH}px`
        band.style.background = softBg
        band.style.borderRadius = '6px'
        band.style.pointerEvents = 'none'
        band.style.display = 'flex'
        band.style.alignItems = 'center'
        band.style.justifyContent = 'center'
        band.style.boxShadow = 'inset 0 0 0 1px rgba(255,255,255,.10)'

        if (i === labelSegIndex) {
          const label = document.createElement('span')
          label.textContent = (meta?.nombre || `G${run.gid}`).slice(0, 22)
          label.style.fontSize = '9px'
          label.style.fontWeight = '700'
          label.style.color = '#111'
          label.style.opacity = '.95'
          label.style.whiteSpace = 'nowrap'
          label.style.overflow = 'hidden'
          label.style.textOverflow = 'ellipsis'
          band.appendChild(label)
        }

        layer.appendChild(band)
      })
    }
  }

  // ===== Fetch visible (con resolución de nombre) =====
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
      const hasta = yyyyMmDd(new Date(y, m0 + 1, 1))

      const tasks = grupos.map(async g => {
        const rosterIdP = ensureGrupoRoster(g.id)
        const guardiasP = apiRequest(API_URLS.grupos.guardias.listar(g.id, desde, hasta))
          .then(resp => Array.isArray(resp) ? resp : (resp?.data ?? resp?.results ?? resp?.rows ?? resp?.items ?? []))
          .catch(() => [])
        const [rosterId, rows] = await Promise.all([rosterIdP, guardiasP])
        const rosterDni = rosterDniCacheRef.current.get(g.id) || new Map()
        return { g, rosterId, rosterDni, rows }
      })

      const results = await Promise.all(tasks)
      const porFecha = new Map()

      for (const { g, rosterId, rosterDni, rows } of results) {
        for (const r of rows) {
          const f = typeof r.fecha === 'string' ? r.fecha.slice(0, 10) : (r.fecha ? yyyyMmDd(new Date(r.fecha)) : null)
          if (!f) continue
          if (!porFecha.has(f)) porFecha.set(f, new Map())
          const gmap = porFecha.get(f)
          if (!gmap.has(g.id)) gmap.set(g.id, { nombre: g.nombre, rangos: new Set(), bomberos: new Set(), items: [] })
          const meta = gmap.get(g.id)

          const desdeH = (r.hora_desde || r.desde || r.horaDesde || r.hora_inicio || r.horaInicio || r.inicio || '').toString().slice(0, 5)
          const hastaH = (r.hora_hasta || r.hasta || r.horaHasta || r.hora_fin || r.horaFin || r.fin || '').toString().slice(0, 5)
          if (desdeH && hastaH) meta.rangos.add(`${desdeH}-${hastaH}`)

          const bomNom = await resolveNombreBombero({ r, rosterId, rosterDni })
          if (bomNom) meta.bomberos.add(String(bomNom))
          if (bomNom && desdeH && hastaH) meta.items.push({ bombero: String(bomNom), desde: desdeH, hasta: hastaH })

          const detalleArr = r.detalles ?? r.detalle ?? r.items ?? []
          if (Array.isArray(detalleArr)) {
            for (const d of detalleArr) {
              const dDesde = (d.hora_desde || d.desde || d.horaDesde || d.hora_inicio || d.inicio || '').toString().slice(0, 5)
              const dHasta = (d.hora_hasta || d.hasta || d.horaHasta || d.hora_fin || d.fin || '').toString().slice(0, 5)
              const dNom = await resolveNombreBombero({ r: d, rosterId, rosterDni })
              if (dNom) meta.bomberos.add(String(dNom))
              if (dNom && dDesde && dHasta) {
                meta.items.push({ bombero: String(dNom), desde: dDesde, hasta: dHasta })
                meta.rangos.add(`${dDesde}-${dHasta}`)
              }
            }
          }
        }
      }

      // dedupe + orden por “desde” y nombre
      for (const [, gmap] of porFecha) {
        for (const [gid, meta] of gmap) {
          const seen = new Set()
          meta.items = meta.items.filter(it => {
            const k = `${it.bombero}|${it.desde}-${it.hasta}`
            if (seen.has(k)) return false
            seen.add(k)
            return true
          }).sort(byDesdeLuegoNombre)
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
            tgt.set(gid, {
              nombre: agg.nombre,
              rangos: new Set(agg.rangos),
              bomberos: new Set(agg.bomberos),
              items: Array.isArray(agg.items) ? [...agg.items] : []
            })
          } else {
            const t = tgt.get(gid)
            t.nombre = t.nombre || agg.nombre
            for (const r of agg.rangos) t.rangos.add(r)
            for (const b of agg.bomberos) t.bomberos.add(b)
            if (Array.isArray(agg.items)) {
              t.items = (t.items || []).concat(agg.items)
            }
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

  // ===== ciclo principal por rango visible =====
  const waitDoubleRaf = () => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)))

  const cargarYpintarRango = async (startDate, endDate) => {
    lastRangeRef.current = { start: startDate, end: endDate }

    if (!grupos.length) {
      setCargandoGuardias(false)
      return
    }

    setErrorMsg('')
    setCargandoGuardias(true)

    try {
      await waitDoubleRaf() // asegurar grilla
      const resumen = await fetchBloqueVisible(startDate, endDate)
      resumenRef.current = resumen

      const orderSet = new Set()
      for (const [, gmap] of resumen) for (const gid of gmap.keys()) orderSet.add(gid)
      visibleOrderRef.current = Array.from(orderSet).sort((a, b) => Number(a) - Number(b))

      bindTooltipsForCells()
      renderRuns()
      await waitDoubleRaf() // aseguramos que todo quedó pintado antes de apagar el loader
    } catch (e) {
      setErrorMsg(`Error al cargar guardias por grupo: ${e.message}`)
    } finally {
      setCargandoGuardias(false)
    }
  }

  // re-render en resize / mutaciones
  useEffect(() => {
    const onResize = () => { renderRuns() }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const grid = rootRef.current?.querySelector('.fc-daygrid-body')
    if (!grid) return
    const obs = new MutationObserver(() => {
      requestAnimationFrame(() => renderRuns())
    })
    obs.observe(grid, { childList: true, subtree: true })
    return () => obs.disconnect()
  }, [])

  const closeModal = () => setModalFecha(null)

  // ===== Render =====
  return (
    <div className='container-fluid' ref={rootRef}>
      <div className={`card border-0 shadow-sm cal-mini-card cal-collapsible ${collapsed ? 'is-collapsed' : ''}`}>
        <div className='card-header bg-danger text-white d-flex align-items-center justify-content-between flex-wrap'>
          <div className='d-flex align-items-center gap-2'>
            <i className='bi bi-people-fill'></i>
            <strong>{titulo}</strong>
            {errorGrupos && <small className='ms-2 text-warning'>{errorGrupos}</small>}
          </div>
          {headerRight}
        </div>

        <div className='card-body cal-body'>
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
              contentHeight={true}

              dateClick={arg => {
                const f = arg.dateStr?.slice(0, 10)
                if (!f) return
                const gmap = resumenRef.current.get(f)
                if (gmap && gmap.size) setModalFecha(f)
              }}

              datesSet={arg => {
                clearRunsLayer()
                for (const td of getVisibleDateCells()) {
                  const fechaStr = td.getAttribute('data-date')
                  quitarTooltip(fechaStr)
                  if (td?.dataset) {
                    delete td.dataset.tipBound
                    delete td.dataset.clickBound
                  }
                  td.style.cursor = ''
                }
                cargarYpintarRango(arg.start, arg.end)
              }}

              dayCellDidMount={info => {
                info.el.removeAttribute?.('title')
              }}

              dayCellWillUnmount={info => {
                const fechaStr = yyyyMmDd(info.date)
                quitarTooltip(fechaStr)
                if (info.el?.dataset) {
                  delete info.el.dataset.tipBound
                  delete info.el.dataset.clickBound
                }
                info.el.style.cursor = ''
              }}
            />
          </div>

          {/* ===== Modal Guardias del Día ===== */}
          {modalFecha && (() => {
            const gmap = resumenRef.current.get(modalFecha) || new Map()
            const gruposLista = Array.from(gmap.entries()).sort((a, b) => Number(a[0]) - Number(b[0]))
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
                        {gruposLista.length === 0 && (
                          <div className='text-muted'>No hay guardias para esta fecha.</div>
                        )}
                        {gruposLista.map(([gid, meta]) => {
                          const { legendBg, legendBorder } = colorForGroup(gid)
                          const rangos = Array.from(meta.rangos || []).sort()
                          const bomberos = Array.from(meta.bomberos || []).sort()

                          // Detalle por bombero (dedupe + ORDEN por desde y nombre)
                          const seen = new Set()
                          const items = Array.isArray(meta.items) ? meta.items.filter(it => {
                            const k = `${it.bombero}|${it.desde}-${it.hasta}`
                            if (seen.has(k)) return false
                            seen.add(k)
                            return true
                          }).sort(byDesdeLuegoNombre) : []

                          return (
                            <div key={gid} className='mb-3 pb-3 border-bottom'>
                              <div className='d-flex align-items-center gap-2 mb-2'>
                                <span
                                  className='d-inline-block rounded'
                                  style={{ width: 18, height: 18, background: legendBg, border: `1px solid ${legendBorder}` }}
                                />
                                <strong className='me-2'>{meta?.nombre || `Grupo ${gid}`}</strong>
                              </div>

                              

                              {items.length > 0 ? (
                                <div className='mt-2'>
                                  <div className='text-muted small mb-1'>Detalle por bombero</div>
                                  <div className='table-responsive'>
                                    <table className='table table-sm align-middle mb-0'>
                                      <thead>
                                        <tr>
                                          <th style={{ width: '55%' }}>Bombero</th>
                                          <th style={{ width: '22%' }}>Desde</th>
                                          <th style={{ width: '23%' }}>Hasta</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {items.map((it, idx) => (
                                          <tr key={`${gid}-it-${idx}`}>
                                            <td>{it.bombero || <span className='text-muted'>—</span>}</td>
                                            <td>{it.desde || <span className='text-muted'>—</span>}</td>
                                            <td>{it.hasta || <span className='text-muted'>—</span>}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              ) : (
                                bomberos.length > 0 && (
                                  <div className='mt-2'>
                                    <div className='text-muted small mb-1'>Bomberos</div>
                                    <div className='d-flex flex-wrap gap-2'>
                                      {bomberos.map((b, i) => (
                                        <span key={`${gid}-b-${i}`} className='badge bg-light text-dark border'>{b}</span>
                                      ))}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          )
                        })}
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
