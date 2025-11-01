// frontend/src/Component/Guardia/GestionarGuardias/GestionarGuardia.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react'

import { API_URLS, apiRequest } from '../../../config/api'
import { swalConfirm, swalError, swalToast } from '../../Common/swalBootstrap'

import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'
import Select from 'react-select'
import { BackToMenuButton } from '../../Common/Button.jsx'
import '../../Guardia/GestionarGuardias/GestionarGuardia.css'

const diasSemana = [
  { label: 'Lunes', value: 0 },
  { label: 'Martes', value: 1 },
  { label: 'Miércoles', value: 2 },
  { label: 'Jueves', value: 3 },
  { label: 'Viernes', value: 4 },
  { label: 'Sábado', value: 5 },
  { label: 'Domingo', value: 6 }
]

const horas = [...Array(24).keys()].map((h) => ({ label: String(h).padStart(2,'0'), value: String(h).padStart(2,'0') }))
const minutos = [...Array(60).keys()].map((m) => ({ label: String(m).padStart(2,'0'), value: String(m).padStart(2,'0') }))

// =====================
// Helpers
// =====================
const mergeByDni = (lista = []) => {
  const by = new Map()
  for (const b of lista) {
    const dni = Number(b.dni)
    const nombre = b.nombre || ''
    if (!by.has(dni)) by.set(dni, [])
    by.get(dni).push({ dni, nombre, desde: b.desde, hasta: b.hasta })
  }
  const out = []
  for (const [dni, arr] of by) {
    arr.sort((a, b) => a.desde.localeCompare(b.desde))
    let cur = { ...arr[0] }
    for (let i = 1; i < arr.length; i++) {
      const x = arr[i]
      if (x.desde <= cur.hasta) {
        if (x.hasta > cur.hasta) cur.hasta = x.hasta
      } else {
        out.push({ dni, nombre: cur.nombre, desde: cur.desde, hasta: cur.hasta })
        cur = { ...x }
      }
    }
    out.push({ dni, nombre: cur.nombre, desde: cur.desde, hasta: cur.hasta })
  }
  return out.sort((a, b) => a.desde.localeCompare(b.desde) || (a.dni - b.dni))
}

const mergeBomberosByIdentity = (arrA = [], arrB = []) => {
  const out = []
  const seen = new Set()
  for (const b of [...arrA, ...arrB]) {
    const key = `${Number(b.dni)}|${b.desde}|${b.hasta}`
    if (!seen.has(key)) {
      seen.add(key)
      out.push({ ...b, dni: b.dni != null ? Number(b.dni) : b.dni })
    }
  }
  return out
}

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

const overlaps = (startA, endA, startB, endB) => startA < endB && endA > startB

const normalizarBomberos = (lista) =>
  [...(lista || [])]
    .map(({ dni, nombre, desde, hasta }) => ({
      dni: (dni != null ? Number(dni) : null),
      nombre: nombre || '',
      desde,
      hasta
    }))
    .sort((a, b) =>
      (a.dni ?? 0) - (b.dni ?? 0) ||
      a.nombre.localeCompare(b.nombre) ||
      a.desde.localeCompare(b.desde) ||
      a.hasta.localeCompare(b.hasta)
    )

const igualesProfundo = (a, b) =>
  JSON.stringify(normalizarBomberos(a)) === JSON.stringify(normalizarBomberos(b))

const yyyyMmDd = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// HH:MM exacto
const validaHM = (s) => typeof s === 'string' && /^\d{2}:\d{2}$/.test(s)

// Recolecta TODAS las asignaciones de un día desde los eventos y consolida por DNI
const asignacionesDelDiaDesdeEventos = (eventos, fechaStr) => {
  const out = []
  for (const ev of eventos) {
    const f = new Date(ev.start)
    if (yyyyMmDd(f) !== fechaStr) continue
    for (const b of (ev.extendedProps?.bomberos || [])) {
      if (!b?.dni) continue
      out.push({ dni: Number(b.dni), desde: b.desde, hasta: b.hasta })
    }
  }
  const by = new Map()
  for (const a of out) {
    if (!by.has(a.dni)) by.set(a.dni, [])
    by.get(a.dni).push({ desde: a.desde, hasta: a.hasta })
  }
  const res = []
  for (const [dni, arr] of by) {
    arr.sort((x, y) => x.desde.localeCompare(y.desde))
    let cur = { ...arr[0] }
    for (let i = 1; i < arr.length; i++) {
      const x = arr[i]
      if (x.desde <= cur.hasta) {
        if (x.hasta > cur.hasta) cur.hasta = x.hasta
      } else {
        res.push({ dni, desde: cur.desde, hasta: cur.hasta })
        cur = { ...x }
      }
    }
    res.push({ dni, desde: cur.desde, hasta: cur.hasta })
  }
  return res
}

const eventosAAsignaciones = (listaEventos) => {
  const out = []
  for (const ev of listaEventos) {
    const fechaStr = yyyyMmDd(new Date(ev.start))
    for (const b of (ev.extendedProps?.bomberos || [])) {
      const dni = Number(b.dni ?? b.value)
      if (!dni) continue
      out.push({ fecha: fechaStr, dni, desde: b.desde, hasta: b.hasta })
    }
  }
  return out
}

const asignacionesAEventos = (rows, nombreByDni = new Map()) => {
  if (!Array.isArray(rows)) return []
  const norm = rows.map((a) => {
    let fechaStr
    if (a.fecha instanceof Date) fechaStr = a.fecha.toISOString().slice(0, 10)
    else if (typeof a.fecha === 'string') fechaStr = a.fecha.slice(0, 10)
    else {
      const d = new Date(a.fecha)
      fechaStr = isNaN(d) ? '' : d.toISOString().slice(0, 10)
    }
    const hDesde = (a.hora_desde || a.desde || '').toString().slice(0, 5)
    const hHasta = (a.hora_hasta || a.hasta || '').toString().slice(0, 5)

    return {
      idGrupo: Number(a.idGrupo ?? a.id_grupo ?? a.grupoId ?? a.grupo_id),
      fecha: fechaStr,
      dni: Number(a.dni),
      hora_desde: hDesde,
      hora_hasta: hHasta
    }
  }).filter(x =>
    x.idGrupo && x.fecha && x.hora_desde && x.hora_hasta && !Number.isNaN(x.dni)
  )

  const porDia = {}
  for (const a of norm) {
    const key = `${a.idGrupo}-${a.fecha}`
    if (!porDia[key]) porDia[key] = []
    porDia[key].push(a)
  }

  const eventos = []
  for (const key in porDia) {
    const arr = porDia[key].sort((x, y) => x.hora_desde.localeCompare(y.hora_desde))
    const [y, m, d] = arr[0].fecha.split('-').map(Number)

    let bloqueStart = arr[0].hora_desde
    let bloqueEnd = arr[0].hora_hasta
    let bloqueBom = [{
      nombre: nombreByDni.get(arr[0].dni) || '',
      dni: arr[0].dni,
      desde: arr[0].hora_desde,
      hasta: arr[0].hora_hasta
    }]

    for (let i = 1; i < arr.length; i++) {
      const a = arr[i]
      const overlapEstricto = a.hora_desde < bloqueEnd
      if (overlapEstricto) {
        if (a.hora_hasta > bloqueEnd) bloqueEnd = a.hora_hasta
        bloqueBom.push({
          nombre: nombreByDni.get(a.dni) || '',
          dni: a.dni,
          desde: a.hora_desde,
          hasta: a.hora_hasta
        })
      } else {
        const [hs, ms] = bloqueStart.split(':').map(Number)
        const [he, me] = bloqueEnd.split(':').map(Number)
        eventos.push({
          id: `srv-${key}-${eventos.length}`,
          title: '',
          start: new Date(y, (m || 1) - 1, d || 1, hs || 0, ms || 0),
          end: new Date(y, (m || 1) - 1, d || 1, he || 0, me || 0),
          allDay: false,
          extendedProps: { bomberos: mergeByDni(bloqueBom) }
        })
        bloqueStart = a.hora_desde
        bloqueEnd = a.hora_hasta
        bloqueBom = [{
          nombre: nombreByDni.get(a.dni) || '',
          dni: a.dni,
          desde: a.hora_desde,
          hasta: a.hora_hasta
        }]
      }
    }

    const [hs, ms] = bloqueStart.split(':').map(Number)
    const [he, me] = bloqueEnd.split(':').map(Number)
    eventos.push({
      id: `srv-${key}-${eventos.length}`,
      title: '',
      start: new Date(y, (m || 1) - 1, d || 1, hs || 0, ms || 0),
      end: new Date(y, (m || 1) - 1, d || 1, he || 0, me || 0),
      allDay: false,
      extendedProps: { bomberos: mergeByDni(bloqueBom) }
    })
  }

  return eventos
}

// =====================
// Componente
// =====================

const GestionarGuardias = ({ idGrupo, nombreGrupo, bomberos = [], onVolver, bomberoFijoDni }) => {
  const [eventos, setEventos] = useState([]) // "UNA SOLA FRANJA" por bloque
  const [bomberoSeleccionado, setBomberoSeleccionado] = useState(null)
  const [diaSeleccionado, setDiaSeleccionado] = useState(null)
  const [horaDesde, setHoraDesde] = useState('')
  const [horaHasta, setHoraHasta] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [mensajesModal, setMensajesModal] = useState([])

  const [cargandoSemana, setCargandoSemana] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const tooltipsRef = useRef({})
  const calendarRef = useRef()
  const ultimaConsultaRef = useRef('')
  const ultimoRangoRef = useRef({ start: null, end: null })

  const [modalEdicionAbierto, setModalEdicionAbierto] = useState(false)
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null)
  const [bomberosEditados, setBomberosEditados] = useState([])
  const [bomberosOriginales, setBomberosOriginales] = useState([])
  const [tieneCambios, setTieneCambios] = useState(false)

  // 👇👇👇 MOVER AQUÍ (antes de cualquier useEffect que los use)
  // Guarda el último evento a enfocar (id + datos de búsqueda)
  const [ultimoFoco, setUltimoFoco] = useState(null)
  // Mapa idEvento -> elemento DOM (para scroll y highlight)
  const eventElsRef = useRef({})

  // ¿Mismo día?
  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  // Busca el id del evento que contiene [horaStart, horaEnd] en ese día
  const findEventIdByRange = (listaEventos, fechaBase, horaStart, horaEnd) => {
    const startTime = new Date(
      fechaBase.getFullYear(), fechaBase.getMonth(), fechaBase.getDate(),
      Number(horaStart.split(':')[0] || 0), Number(horaStart.split(':')[1] || 0)
    )
    const endTime = new Date(
      fechaBase.getFullYear(), fechaBase.getMonth(), fechaBase.getDate(),
      Number(horaEnd.split(':')[0] || 0), Number(horaEnd.split(':')[1] || 0)
    )
    for (const ev of listaEventos) {
      const evS = new Date(ev.start)
      const evE = new Date(ev.end)
      if (!sameDay(evS, fechaBase)) continue
      if (evS <= startTime && evE >= endTime) return ev.id
    }
    return null
  }

  // Resalta y centra visualmente un evento por su id
  const focusEventById = (id) => {
    const el = eventElsRef.current[id]
    if (!el) return
    // centra en pantalla
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // highlight temporal
    const prevTransition = el.style.transition
    const prevBoxShadow = el.style.boxShadow
    el.style.transition = 'box-shadow 0.25s ease'
    el.style.boxShadow = '0 0 0 4px rgba(255,0,0,0.35)'
    setTimeout(() => {
      el.style.boxShadow = prevBoxShadow || ''
      el.style.transition = prevTransition || ''
    }, 2000)
  }
  // ☝️☝️☝️ FIN del bloque movido

  // Fondo que se bloquea (NO incluye modal)
  const backgroundRef = useRef(null)

  useEffect(() => {
    setTieneCambios(!igualesProfundo(bomberosEditados, bomberosOriginales))
  }, [bomberosEditados, bomberosOriginales])

  const nombrePorDni = useMemo(() => {
    const m = new Map()
    for (const b of bomberos) m.set(Number(b.dni), `${b.nombre} ${b.apellido}`)
    return m
  }, [bomberos])

  const opcionesBomberos = useMemo(() => {
    const opts = bomberos.map((b) => ({
      label: `${b.nombre} ${b.apellido}`,
      value: Number(b.dni),
      ...b
    }))
    if (bomberoFijoDni && !opts.some(o => Number(o.value) === Number(bomberoFijoDni))) {
      const nombre = nombrePorDni.get(Number(bomberoFijoDni)) || String(bomberoFijoDni)
      opts.push({ label: nombre, value: Number(bomberoFijoDni) })
    }
    return opts
  }, [bomberos, bomberoFijoDni, nombrePorDni])

  useEffect(() => {
    if (!bomberoFijoDni) return
    const fijo = opcionesBomberos.find(o => Number(o.value) === Number(bomberoFijoDni))
    if (fijo) setBomberoSeleccionado(fijo)
  }, [bomberoFijoDni, opcionesBomberos])

  // Bloqueo scroll del body mientras el modal esté abierto
  useEffect(() => {
    if (!modalEdicionAbierto) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [modalEdicionAbierto])

  // Fusionar bloques que se solapan
  const fusionarEventos = (listaEventos) => {
    const ordenados = [...listaEventos].sort((a, b) => new Date(a.start) - new Date(b.start))
    const fusionados = []

    for (const ev of ordenados) {
      if (fusionados.length === 0) {
        fusionados.push({ ...ev, extendedProps: { bomberos: mergeByDni(ev.extendedProps?.bomberos || []) } })
        continue
      }
      const ultimo = fusionados[fusionados.length - 1]
      const startEv = new Date(ev.start)
      const endEv = new Date(ev.end)
      const startUlt = new Date(ultimo.start)
      const endUlt = new Date(ultimo.end)

      const mismoDia = isSameDay(startEv, startUlt)
      const seSolapan = overlaps(startEv, endEv, startUlt, endUlt)

      if (mismoDia && seSolapan) {
        const nuevoStart = startEv < startUlt ? startEv : startUlt
        const nuevoEnd = endEv > endUlt ? endEv : endUlt
        const bomberosUnicos = mergeBomberosByIdentity(
          ultimo.extendedProps.bomberos,
          ev.extendedProps?.bomberos || []
        )
        ultimo.start = nuevoStart
        ultimo.end = nuevoEnd
        ultimo.extendedProps = { bomberos: mergeByDni(bomberosUnicos) }
      } else {
        fusionados.push({ ...ev, extendedProps: { bomberos: mergeByDni(ev.extendedProps?.bomberos || []) } })
      }
    }
    return fusionados
  }

  // flag hasFijo a nivel de evento
  const eventosRender = useMemo(() => {
    if (!bomberoFijoDni) return eventos
    return eventos.map(ev => {
      const lista = ev.extendedProps?.bomberos || []
      const hasFijo = lista.some(x => Number(x.dni) === Number(bomberoFijoDni))
      return { ...ev, extendedProps: { ...(ev.extendedProps || {}), hasFijo } }
    })
  }, [eventos, bomberoFijoDni])

  // Tooltips
  useEffect(() => {
    eventosRender.forEach((ev) => {
      const tooltip = tooltipsRef.current[ev.id]
      if (tooltip) {
        tooltip.innerText = (ev.extendedProps.bomberos || [])
          .slice()
          .sort((a, b) => a.desde.localeCompare(b.desde) || (Number(a.dni) - Number(b.dni)))
          .map((b) => `${b.nombre || nombrePorDni.get(Number(b.dni)) || b.dni} (${b.desde}-${b.hasta})`)
          .join('\n')
      }
    })
  }, [eventosRender, nombrePorDni])

  // 🔧 Efecto que usa ultimoFoco/findEventIdByRange/focusEventById (ya declarados arriba)
  useEffect(() => {
    if (!ultimoFoco) return
    const t = setTimeout(() => {
      if (ultimoFoco.id) {
        focusEventById(ultimoFoco.id)
      } else if (ultimoFoco.fallback) {
        const { fechaBase, horaStart, horaEnd } = ultimoFoco.fallback
        const id = findEventIdByRange(eventos, fechaBase, horaStart, horaEnd)
        if (id) focusEventById(id)
      }
    }, 50)
    return () => clearTimeout(t)
  }, [eventos, ultimoFoco])

  // Asignar nueva guardia
  const asignarGuardia = async () => {
    if (!bomberoSeleccionado || !horaDesde || !horaHasta || diaSeleccionado === null) {
      setMensaje('Debes completar todos los campos obligatorios para asignar una guardia.')
      setTimeout(() => setMensaje(''), 3000)
      return
    }
    if (horaHasta <= horaDesde) {
      setMensaje('La hora de fin debe ser posterior a la hora de inicio.')
      setTimeout(() => setMensaje(''), 3000)
      return
    }

    const calendarApi = calendarRef.current?.getApi()
    const lunesSemana = new Date(calendarApi.view.activeStart)
    const fechaObjetivo = new Date(lunesSemana)
    fechaObjetivo.setDate(lunesSemana.getDate() + diaSeleccionado.value)

    const [horaI, minI] = horaDesde.split(':').map(Number)
    const [horaF, minF] = horaHasta.split(':').map(Number)

    const nuevoInicioDate = new Date(fechaObjetivo.getFullYear(), fechaObjetivo.getMonth(), fechaObjetivo.getDate(), horaI, minI)
    const nuevoFinDate = new Date(fechaObjetivo.getFullYear(), fechaObjetivo.getMonth(), fechaObjetivo.getDate(), horaF, minF)

    const nextEventos = (() => {
      let eventosActualizados = eventos.map((ev) => {
        const inicioEv = new Date(ev.start)
        const finEv = new Date(ev.end)
        const mismoDia = isSameDay(nuevoInicioDate, inicioEv)
        const seSolapan = overlaps(nuevoInicioDate, nuevoFinDate, inicioEv, finEv)

        if (mismoDia && seSolapan) {
          const nuevoStart = nuevoInicioDate < inicioEv ? nuevoInicioDate : inicioEv
          const nuevoEnd = nuevoFinDate > finEv ? nuevoFinDate : finEv

          const bomberosActualizados = mergeByDni([
            ...(ev.extendedProps?.bomberos || []),
            { nombre: bomberoSeleccionado.label, dni: Number(bomberoSeleccionado.value), desde: horaDesde, hasta: horaHasta }
          ])

          return { ...ev, start: nuevoStart, end: nuevoEnd, extendedProps: { bomberos: bomberosActualizados } }
        }
        return { ...ev, extendedProps: { bomberos: mergeByDni(ev.extendedProps?.bomberos || []) } }
      })

      const touched = eventosActualizados.some(ev =>
        isSameDay(nuevoInicioDate, new Date(ev.start)) &&
        overlaps(nuevoInicioDate, nuevoFinDate, new Date(ev.start), new Date(ev.end))
      )
      if (!touched) {
        const id = `${fechaObjetivo.toISOString().slice(0, 10)}-${horaDesde}-${horaHasta}-${bomberoSeleccionado.value}-${Date.now()}`
        eventosActualizados.push({
          id,
          title: '',
          start: nuevoInicioDate,
          end: nuevoFinDate,
          allDay: false,
          extendedProps: {
            bomberos: mergeByDni([{ nombre: bomberoSeleccionado.label, dni: Number(bomberoSeleccionado.value), desde: horaDesde, hasta: horaHasta }])
          }
        })
      }

      return fusionarEventos(eventosActualizados)
    })()

    setEventos(nextEventos)

    // Guardamos qué evento enfocar: por ID si lo tenemos, o por rango de fallback
    const focoId = findEventIdByRange(
      nextEventos,
      new Date(nuevoInicioDate),
      horaDesde,
      horaHasta
    )
    setUltimoFoco(
      focoId
        ? { id: focoId }
        : { fallback: { fechaBase: new Date(nuevoInicioDate), horaStart: horaDesde, horaEnd: horaHasta } }
    )

    const fechaStr = yyyyMmDd(fechaObjetivo)
    const asignacionesDia = asignacionesDelDiaDesdeEventos(nextEventos, fechaStr)

    setGuardando(true)
    try {
      await apiRequest(API_URLS.grupos.guardias.reemplazarDia(idGrupo), {
        method: 'PUT',
        body: JSON.stringify({ fecha: fechaStr, asignaciones: asignacionesDia })
      })
      setMensaje('Guardia asignada. Día actualizado con exito.')
      const api = calendarRef.current?.getApi()
      if (api?.view) cargarSemanaServidor(api.view.activeStart, api.view.activeEnd)
      setTimeout(() => setMensaje(''), 3000)
    } catch (e) {
      setMensaje(`Error al guardar: ${e.message}`)
      setTimeout(() => setMensaje(''), 5000)
    } finally {
      setGuardando(false)
    }

    if (!bomberoFijoDni) setBomberoSeleccionado(null)
    setHoraDesde(''); setHoraHasta(''); setDiaSeleccionado(null)
  }

  const cargarSemanaServidor = async (startDate, endDate) => {
    if (!idGrupo) return
    try {
      setCargandoSemana(true)
      const start = yyyyMmDd(startDate)
      const end = yyyyMmDd(endDate)
      const clave = `${idGrupo}|${start}|${end}`
      ultimaConsultaRef.current = clave

      const resp = await apiRequest(API_URLS.grupos.guardias.listar(idGrupo, start, end))
      const rows = resp?.data || []
      const nuevos = asignacionesAEventos(rows, nombrePorDni)

      if (ultimaConsultaRef.current === clave) {
        setEventos(nuevos)
      }
    } catch (e) {
      setMensaje(`Error al cargar semana: ${e.message}`)
      setTimeout(() => setMensaje(''), 4000)
    } finally {
      setCargandoSemana(false)
    }
  }

  const guardarEnServidor = async () => {
    try {
      if (!idGrupo) return
      setGuardando(true)
      const asignaciones = eventosAAsignaciones(eventos)
      if (asignaciones.length === 0) {
        setMensaje('No hay asignaciones para guardar')
        setTimeout(() => setMensaje(''), 3000)
        return
      }

      const resp = await apiRequest(API_URLS.grupos.guardias.crear(idGrupo), {
        method: 'POST',
        body: JSON.stringify({ asignaciones })
      })

      if (!resp?.success) throw new Error(resp?.error || 'Error al guardar')
      setMensaje('Guardias guardadas con exito')
      setTimeout(() => setMensaje(''), 3000)
    } catch (e) {
      setMensaje(`Error al guardar: ${e.message}`)
      setTimeout(() => setMensaje(''), 4000)
    } finally {
      setGuardando(false)
    }
  }

  if (!idGrupo) {
    return <div className="alert alert-danger">No se encontró el grupo.</div>
  }

  const opcionesBomberosSelect = opcionesBomberos

  const mensajeClass = useMemo(() => {
    if (!mensaje) return 'alert-info'
    const m = mensaje.toLowerCase()
    if (/(falló|fallo|error|no se guard|no pudo|rechazad|inválid|invalido)/.test(m)) return 'alert-danger'
    if (/(éxito|exito|correctamente|guardad[oa]s? (en|con)|actualizad[oa] (en|con))/.test(m)) return 'alert-success'
    return 'alert-warning'
  }, [mensaje])

  // Props para bloquear completamente el fondo
  const fondoBloqueadoStyle = modalEdicionAbierto ? { pointerEvents: 'none' } : undefined
  const fondoA11yProps = modalEdicionAbierto ? { 'aria-hidden': true } : {}

  return (
    <div className="container-fluid py-5 px-0">
      <div className='text-center mb-4'>
        <div className='d-flex justify-content-center align-items-center gap-3 mb-3'>
          <h1 className="fw-bold text-white fs-3 mb-0">Gestionar Guardias</h1>
        </div>
        <span className="badge bg-danger-subtle text-danger">
          <i className="bi bi-fire me-2"></i> Sistema de Gestión de Personal - Cuartel de Bomberos
        </span>
      </div>

      {/* ===== FONDO (bloqueado con pointer-events cuando hay modal) ===== */}
      <div ref={backgroundRef} style={fondoBloqueadoStyle} {...fondoA11yProps}>
        <div className="card edge-to-edge shadow-sm border-0 bg-white bg-opacity-1 backdrop-blur-sm">
          <div className="card-header bg-danger text-white d-flex align-items-center gap-2 py-4">
            <strong>Gestión de guardias - {nombreGrupo}</strong>
          </div>
          <div className="card-body">
            {mensaje && <div className={`alert ${mensajeClass}`} role="alert">{mensaje}</div>}

            <div className="row">
              {/* Columna izquierda */}
              <div className="col-md-4 mb-3">
                <h4 className="text-black">Bomberos del grupo</h4>

                <Select
                  options={opcionesBomberosSelect}
                  value={bomberoSeleccionado}
                  onChange={setBomberoSeleccionado}
                  classNamePrefix="rs"
                  placeholder="Seleccionar bombero"
                  isClearable={!bomberoFijoDni}
                  isDisabled={!!bomberoFijoDni}
                />

                <div className="text-black mt-3">
                  <label>Día:</label>
                  <Select
                    options={diasSemana}
                    value={diaSeleccionado}
                    onChange={setDiaSeleccionado}
                    classNamePrefix="rs"
                    placeholder="Seleccionar día"
                    isClearable
                  />

                  <label className="mt-2">Desde:</label>
                  <div className="d-flex gap-3">
                    <div className="flex-grow-1 time-select">
                      <Select
                        options={horas}
                        value={horaDesde ? { label: horaDesde.split(':')[0], value: horaDesde.split(':')[0] } : null}
                        onChange={(selected) => {
                          const nuevo = selected?.value || ''
                          setHoraDesde(`${nuevo}:${horaDesde.split(':')[1] || '00'}`)
                        }}
                        classNamePrefix="rs"
                        placeholder="HH"
                        isClearable
                      />
                    </div>
                    <div className="flex-grow-1 time-select">
                      <Select
                        options={minutos}
                        value={horaDesde ? { label: horaDesde.split(':')[1], value: horaDesde.split(':')[1] } : null}
                        onChange={(selected) => {
                          const nuevosMin = selected?.value || ''
                          setHoraDesde(`${horaDesde.split(':')[0] || '00'}:${nuevosMin}`)
                        }}
                        classNamePrefix="rs"
                        placeholder="MM"
                        isClearable
                        isSearchable
                      />
                    </div>
                  </div>

                  <label className="mt-2">Hasta:</label>
                  <div className="d-flex gap-3">
                    <div className="flex-grow-1 time-select">
                      <Select
                        options={horas}
                        value={horaHasta ? { label: horaHasta.split(':')[0], value: horaHasta.split(':')[0] } : null}
                        onChange={(selected) => {
                          const nueva = selected?.value || ''
                          setHoraHasta(`${nueva}:${horaHasta.split(':')[1] || '00'}`)
                        }}
                        classNamePrefix="rs"
                        placeholder="HH"
                        isClearable
                      />
                    </div>
                    <div className="flex-grow-1 time-select">
                      <Select
                        options={minutos}
                        value={horaHasta ? { label: horaHasta.split(':')[1], value: horaHasta.split(':')[1] } : null}
                        onChange={(selected) => {
                          const nuevosMin = selected?.value || ''
                          setHoraHasta(`${horaHasta.split(':')[0] || '00'}:${nuevosMin}`)
                        }}
                        classNamePrefix="rs"
                        placeholder="MM"
                        isClearable
                        isSearchable
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna derecha: Calendario */}
              <div className="col-md-8">
                <FullCalendar
                  ref={calendarRef}
                  plugins={[timeGridPlugin, interactionPlugin]}
                  initialView="timeGridWeek"
                  events={eventosRender}
                  locale={esLocale}
                  scrollTime="00:00:00"
                  slotMinTime="00:00:00"
                  firstDay={1}
                  headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
                  allDaySlot={false}
                  slotDuration="00:30:00"
                  slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                  eventClassNames={(info) => {
                    const classes = ['fc-guardia']
                    if (bomberoFijoDni && info.event.extendedProps && info.event.extendedProps.hasFijo === false) {
                      classes.push('fc-guardia-ajena')
                    }
                    return classes
                  }}
                  eventContent={() => ({ domNodes: [] })}
                  eventDidMount={(info) => {
                    info.el.removeAttribute('title')
                    info.el.querySelectorAll('[title]').forEach(el => el.removeAttribute('title'))

                    const tooltip = document.createElement('div')
                    tooltip.className = 'tooltip-dinamico'
                    document.body.appendChild(tooltip)
                    tooltipsRef.current[info.event.id] = tooltip

                    const lista = info.event.extendedProps?.bomberos || []
                    tooltip.innerText = lista
                      .slice()
                      .sort((a, b) => a.desde.localeCompare(b.desde) || (Number(a.dni) - Number(b.dni)))
                      .map((b) => `${b.nombre || nombrePorDni.get(Number(b.dni)) || b.dni} (${b.desde}-${b.hasta})`)
                      .join('\n')

                    const place = (e) => {
                      const margin = 10
                      const x = Math.min(e.clientX + margin, window.innerWidth - tooltip.offsetWidth - margin)
                      const y = Math.min(e.clientY + margin, window.innerHeight - tooltip.offsetHeight - margin)
                      tooltip.style.left = `${x}px`
                      tooltip.style.top = `${y}px`
                    }

                    const onEnter = (e) => { tooltip.style.display = 'block'; place(e) }
                    const onMove = (e) => place(e)
                    const onLeave = () => { tooltip.style.display = 'none' }

                    info.el.addEventListener('mouseenter', onEnter)
                    info.el.addEventListener('mousemove', onMove)
                    info.el.addEventListener('mouseleave', onLeave)
                    info.el._ttHandlers = { onEnter, onMove, onLeave }
                    eventElsRef.current[info.event.id] = info.el

                  }}
                  eventWillUnmount={(info) => {
                    const h = info.el._ttHandlers
                    if (h) {
                      info.el.removeEventListener('mouseenter', h.onEnter)
                      info.el.removeEventListener('mousemove', h.onMove)
                      info.el.removeEventListener('mouseleave', h.onLeave)
                      delete info.el._ttHandlers
                    }
                    const tooltip = tooltipsRef.current[info.event.id]
                    if (tooltip && tooltip.parentNode) tooltip.parentNode.removeChild(tooltip)
                    delete tooltipsRef.current[info.event.id]
                    delete eventElsRef.current[info.event.id]
                  }}
                  eventClick={async (info) => {
                    // ⛔ Bloquear clicks en el calendario si el modal está abierto (doble seguro)
                    if (modalEdicionAbierto) {
                      info.jsEvent.preventDefault()
                      return
                    }

                    if (bomberoFijoDni && info?.event?.extendedProps?.hasFijo === false) {
                      info.jsEvent.preventDefault()
                      return
                    }

                    info.jsEvent.preventDefault()

                    const tooltip = tooltipsRef.current[info.event.id]
                    if (tooltip) tooltip.style.display = 'none'

                    const r = await swalConfirm({
                      title: 'Confirmar acción',
                      html: '¿Desea modificar la guardia seleccionada?',
                      confirmText: 'Modificar',
                      icon: 'question'
                    })
                    if (!r.isConfirmed) return

                    const ev = info.event
                    setEventoSeleccionado(ev)
                    setModalEdicionAbierto(true)
                    const base = (ev.extendedProps?.bomberos || []).map(b => ({
                      ...b,
                      nombre: b.nombre || nombrePorDni.get(Number(b.dni)) || String(b.dni)
                    }))
                    setBomberosEditados(base)
                    setBomberosOriginales(base)
                    setMensajesModal([])
                    setTieneCambios(false)
                  }}
                  datesSet={(arg) => {
                    const s = arg.start?.toISOString?.() || ''
                    const e = arg.end?.toISOString?.() || ''
                    if (ultimoRangoRef.current.start !== s || ultimoRangoRef.current.end !== e) {
                      ultimoRangoRef.current = { start: s, end: e }
                      cargarSemanaServidor(arg.start, arg.end)
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-center align-items-center gap-3 mb-3">
            <BackToMenuButton onClick={onVolver} />
            <button className="btn btn-accept btn-lg btn-medium" onClick={asignarGuardia} disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>

      {/* ===== MODAL (fuera del fondo bloqueado) ===== */}
      {modalEdicionAbierto && eventoSeleccionado && (
        <>
          <div
            className="modal-backdrop fade show"
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9998 }}
            onClick={(e) => { e.stopPropagation() }}
          />
          <div className="modal fade show d-block modal-backdrop-custom" tabIndex={-1} role="dialog" aria-modal="true" style={{ zIndex: 9999 }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content modal-content-white">
                <div className="bg-danger modal-header">
                  <h5 className="modal-title text-white">Modificar guardia</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => { setModalEdicionAbierto(false); setEventoSeleccionado(null) }}
                  />
                </div>

                <div className="modal-body">
                  {mensajesModal.length > 0 && (
                    <div>{mensajesModal.map((m, idx) => (<div key={idx} className="alert alert-warning">{m}</div>))}</div>
                  )}

                  <p className="mb-2"><strong>Fecha:</strong> {new Date(eventoSeleccionado.start).toLocaleDateString()}</p>

                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Bombero</th>
                        <th>Hora desde</th>
                        <th>Hora hasta</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bomberosEditados.map((b, idx) => {
                        const esEditable = !bomberoFijoDni || Number(b.dni) === Number(bomberoFijoDni)
                        const disabledProps = {
                          isDisabled: !esEditable,
                          styles: {
                            control: (base) => !esEditable ? ({ ...base, backgroundColor: '#f5f5f5' }) : base,
                            menuPortal: (base) => ({ ...base, zIndex: 99999 }),
                            menu: (base) => ({ ...base, zIndex: 99999 })
                          },
                          menuPortalTarget: typeof document !== 'undefined' ? document.body : null,
                          menuPosition: 'fixed',
                          menuShouldScrollIntoView: false
                        }
                        return (
                          <tr key={idx} className={!esEditable ? 'table-light' : ''}>
                            <td>
                              {b.nombre}
                              {!esEditable && <small className="text-muted d-block">No editable</small>}
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <Select
                                  options={horas}
                                  value={{ label: b.desde.split(':')[0], value: b.desde.split(':')[0] }}
                                  onChange={(selected) => {
                                    if (!esEditable) return
                                    const nuevo = bomberosEditados.map((item, i) =>
                                      i === idx ? { ...item, desde: `${selected.value}:${b.desde.split(':')[1]}` } : item
                                    )
                                    setBomberosEditados(nuevo)
                                  }}
                                  classNamePrefix="rs"
                                  placeholder="HH"
                                  {...disabledProps}
                                />
                                <Select
                                  options={minutos}
                                  value={{ label: b.desde.split(':')[1], value: b.desde.split(':')[1] }}
                                  onChange={(selected) => {
                                    if (!esEditable) return
                                    const nuevo = bomberosEditados.map((item, i) =>
                                      i === idx ? { ...item, desde: `${b.desde.split(':')[0]}:${selected.value}` } : item
                                    )
                                    setBomberosEditados(nuevo)
                                  }}
                                  classNamePrefix="rs"
                                  placeholder="MM"
                                  isSearchable
                                  {...disabledProps}
                                />
                              </div>
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <Select
                                  options={horas}
                                  value={{ label: b.hasta.split(':')[0], value: b.hasta.split(':')[0] }}
                                  onChange={(selected) => {
                                    if (!esEditable) return
                                    const nuevo = bomberosEditados.map((item, i) =>
                                      i === idx ? { ...item, hasta: `${selected.value}:${b.hasta.split(':')[1]}` } : item
                                    )
                                    setBomberosEditados(nuevo)
                                  }}
                                  classNamePrefix="rs"
                                  placeholder="HH"
                                  {...disabledProps}
                                />
                                <Select
                                  options={minutos}
                                  value={{ label: b.hasta.split(':')[1], value: b.hasta.split(':')[1] }}
                                  onChange={(selected) => {
                                    if (!esEditable) return
                                    const nuevo = bomberosEditados.map((item, i) =>
                                      i === idx ? { ...item, hasta: `${b.hasta.split(':')[0]}:${selected.value}` } : item
                                    )
                                    setBomberosEditados(nuevo)
                                  }}
                                  classNamePrefix="rs"
                                  placeholder="MM"
                                  isSearchable
                                  {...disabledProps}
                                />
                              </div>
                            </td>
                            <td className="text-center">
                              <button
                                className="btn btn-outline-danger btn-detail"
                                title={esEditable ? 'Eliminar asignación' : 'No permitido'}
                                disabled={!esEditable}
                                onClick={async () => {
                                  if (!esEditable) return
                                  const nombre = b?.nombre || nombrePorDni.get(Number(b?.dni)) || b?.dni
                                  const r = await swalConfirm({
                                    title: `¿Eliminar asignación de "${nombre}"?`,
                                    html: `Desde <b>${b?.desde}</b> hasta <b>${b?.hasta}</b>.`,
                                    confirmText: 'Eliminar',
                                    icon: 'warning'
                                  })
                                  if (!r.isConfirmed) return
                                  setBomberosEditados(prev => prev.filter((_, i) => i !== idx))
                                  setTieneCambios(true)
                                }}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="d-flex justify-content-center align-items-center gap-3 mb-3">
                  <button className="btn btn-back btn-medium" onClick={() => { setModalEdicionAbierto(false); setEventoSeleccionado(null) }}>
                    Volver
                  </button>

                  <button
                    className="btn btn-accept btn-lg btn-medium"
                    disabled={!tieneCambios}
                    onClick={async () => {
                      const confirmGeneral = await swalConfirm({
                        title: 'Confirmar acción',
                        html: '¿Desea guardar los cambios realizados en esta guardia?',
                        confirmText: 'Guardar',
                        icon: 'question'
                      })
                      if (!confirmGeneral.isConfirmed) return

                      const fechaBase = new Date(eventoSeleccionado.start)
                      const fechaStr = yyyyMmDd(fechaBase)

                      if (bomberosEditados.length === 0) {
                        const nextEventos = eventos.filter(ev => ev.id !== eventoSeleccionado.id)
                        setEventos(nextEventos)
                        setModalEdicionAbierto(false)
                        setEventoSeleccionado(null)
                        setGuardando(true)
                        try {
                          await apiRequest(API_URLS.grupos.guardias.reemplazarDia(idGrupo), {
                            method: 'PUT',
                            body: JSON.stringify({ fecha: fechaStr, asignaciones: asignacionesDelDiaDesdeEventos(nextEventos, fechaStr) })
                          })
                          setMensaje('Guardia eliminada y actualizada con éxito')
                          const api = calendarRef.current?.getApi()
                          if (api?.view) cargarSemanaServidor(api.view.activeStart, api.view.activeEnd)
                          swalToast({ title: 'Cambios guardados', icon: 'success' })
                        } catch (e) {
                          setMensaje(`Error al guardar: ${e.message}`)
                          await swalError('Error', e.message)
                        } finally {
                          setGuardando(false)
                        }
                        return
                      }

                      const errores = []
                      bomberosEditados.forEach((b) => {
                        const desdeOk = validaHM(b?.desde)
                        const hastaOk = validaHM(b?.hasta)
                        if (!desdeOk || !hastaOk) {
                          errores.push(`Debes completar correctamente ambos horarios (HH:MM) para ${b?.nombre || b?.dni}`)
                          return
                        }
                        if (b.hasta <= b.desde) {
                          errores.push(`La hora de fin debe ser posterior a la de inicio (${b?.nombre || b?.dni})`)
                        }
                      })
                      if (errores.length > 0) {
                        setMensajesModal(errores)
                        return
                      }
                      setMensajesModal([])

                      const bomberosNormalizados = mergeByDni(bomberosEditados)
                      const ordenados = [...bomberosNormalizados].sort((a, b) => a.desde.localeCompare(b.desde))

                      const nuevosBloques = []
                      let cur = { start: ordenados[0].desde, end: ordenados[0].hasta, bomberos: [ordenados[0]] }
                      for (let i = 1; i < ordenados.length; i++) {
                        const b = ordenados[i]
                        if (b.desde > cur.end) {
                          nuevosBloques.push({ ...cur, bomberos: mergeByDni(cur.bomberos) })
                          cur = { start: b.desde, end: b.hasta, bomberos: [b] }
                        } else {
                          if (b.hasta > cur.end) cur.end = b.hasta
                          cur.bomberos.push(b)
                        }
                      }
                      nuevosBloques.push({ ...cur, bomberos: mergeByDni(cur.bomberos) })

                      const sinEvento = eventos.filter(ev => ev.id !== eventoSeleccionado.id)
                      const nuevosEventos = nuevosBloques.map((bloque, idx) => {
                        const [hStart, mStart] = bloque.start.split(':').map(Number)
                        const [hEnd, mEnd] = bloque.end.split(':').map(Number)
                        return {
                          id: `${eventoSeleccionado.id}-split-${idx}-${Date.now()}`,
                          title: '',
                          start: new Date(fechaBase.getFullYear(), fechaBase.getMonth(), fechaBase.getDate(), hStart, mStart),
                          end: new Date(fechaBase.getFullYear(), fechaBase.getMonth(), fechaBase.getDate(), hEnd, mEnd),
                          allDay: false,
                          extendedProps: { bomberos: mergeByDni(bloque.bomberos) }
                        }
                      })

                      const merged = (() => {
                        const temp = fusionarEventos([...sinEvento, ...nuevosEventos])
                        return fusionarEventos(temp)
                      })()

                      setEventos(merged)

                      // Elegimos un bloque representativo (el primero nuevo) para enfocar
                      const bloqueRef = nuevosBloques[0]
                      if (bloqueRef) {
                        const focoId = findEventIdByRange(
                          merged,
                          new Date(fechaBase),
                          bloqueRef.start,
                          bloqueRef.end
                        )
                        setUltimoFoco(
                          focoId
                            ? { id: focoId }
                            : { fallback: { fechaBase: new Date(fechaBase), horaStart: bloqueRef.start, horaEnd: bloqueRef.end } }
                        )
                      }

                      try {
                        await apiRequest(API_URLS.grupos.guardias.reemplazarDia(idGrupo), {
                          method: 'PUT',
                          body: JSON.stringify({
                            fecha: fechaStr,
                            asignaciones: asignacionesDelDiaDesdeEventos(merged, fechaStr)
                          })
                        })
                        setMensaje('Cambios guardados para ese día con éxito')
                        const api = calendarRef.current?.getApi()
                        if (api?.view) cargarSemanaServidor(api.view.activeStart, api.view.activeEnd)
                        swalToast({ title: 'Cambios guardados', icon: 'success' })
                      } catch (e) {
                        setMensaje(`Error al guardar: ${e.message}`)
                        await swalError('Error', e.message)
                      }
                      setModalEdicionAbierto(false)
                      setEventoSeleccionado(null)
                    }}
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default GestionarGuardias
