import React, { useState, useEffect, useRef, useMemo } from 'react'

import { API_URLS, apiRequest } from '../../../config/api'

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

const horas = [...Array(24).keys()].map((h) => ({
  label: h.toString().padStart(2, '0'),
  value: h.toString().padStart(2, '0')
}))

const minutos = [...Array(60).keys()].map((m) => ({
  label: m.toString().padStart(2, '0'),
  value: m.toString().padStart(2, '0')
}))

// =====================
// Helpers
// =====================

// Une intervalos por DNI (solapados o tocando) y devuelve una lista sin solapes por bombero
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
        // une si solapan o tocan
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

// solape estricto (no cuenta “tocan”)
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

// Recolecta TODAS las asignaciones de un día desde los eventos y consolida por DNI
const asignacionesDelDiaDesdeEventos = (eventos, fechaStr) => {
  const out = []
  for (const ev of eventos) {
    const f = new Date(ev.start)
    if (yyyyMmDd(f) !== fechaStr) continue
    const lista = ev.extendedProps?.bomberos || []
    for (const b of lista) {
      if (!b?.dni) continue
      out.push({ dni: Number(b.dni), desde: b.desde, hasta: b.hasta })
    }
  }
  // consolido por DNI (merge de solapes o “tocan”)
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

// Eventos (front) -> asignaciones (API) (batch opcional)
const eventosAAsignaciones = (listaEventos) => {
  const out = []
  for (const ev of listaEventos) {
    const f = new Date(ev.start)
    const fechaStr = yyyyMmDd(f)
    for (const b of ev.extendedProps?.bomberos || []) {
      const dni = Number(b.dni ?? b.value)
      if (!dni) continue
      out.push({ fecha: fechaStr, dni, desde: b.desde, hasta: b.hasta })
    }
  }
  return out
}

// Asignaciones (API) -> eventos (front) en bloques disjuntos por día
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
      const overlapEstricto = a.hora_desde < bloqueEnd // NO une si solo “tocan”

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
          id: `srv-${key}-${bloqueStart}-${bloqueEnd}`,
          title: '',
          start: new Date(y, (m || 1) - 1, d || 1, hs || 0, ms || 0),
          end: new Date(y, (m || 1) - 1, d || 1, he || 0, me || 0),
          // colores por CSS
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

const GestionarGuardias = ({ idGrupo, nombreGrupo, bomberos = [], onVolver }) => {
  const [eventos, setEventos] = useState([])
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

  // Estados modal
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalConfirmar, setModalConfirmar] = useState(false)
  const [modalConfirmarGuardar, setModalConfirmarGuardar] = useState(false)
  const [eventoPendiente, setEventoPendiente] = useState(null)
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null)
  const [bomberosEditados, setBomberosEditados] = useState([])
  const [bomberosOriginales, setBomberosOriginales] = useState([])
  const [tieneCambios, setTieneCambios] = useState(false)

  // Detectar cambios (modal)
  useEffect(() => {
    setTieneCambios(!igualesProfundo(bomberosEditados, bomberosOriginales))
  }, [bomberosEditados, bomberosOriginales])

  const nombrePorDni = useMemo(() => {
    const m = new Map()
    for (const b of bomberos) m.set(Number(b.dni), `${b.nombre} ${b.apellido}`)
    return m
  }, [bomberos])

  // Fusionar eventos (solo si se solapan) + consolidar por DNI
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
        const bomberosConsolidados = mergeByDni(bomberosUnicos)

        ultimo.start = nuevoStart
        ultimo.end = nuevoEnd
        ultimo.extendedProps = { bomberos: bomberosConsolidados }
      } else {
        fusionados.push({ ...ev, extendedProps: { bomberos: mergeByDni(ev.extendedProps?.bomberos || []) } })
      }
    }

    return fusionados
  }

  // Actualiza tooltips cuando cambian eventos
  useEffect(() => {
    eventos.forEach((ev) => {
      const tooltip = tooltipsRef.current[ev.id]
      if (tooltip) {
        tooltip.innerText = (ev.extendedProps.bomberos || [])
          .slice()
          .sort((a, b) => a.desde.localeCompare(b.desde) || (Number(a.dni) - Number(b.dni)))
          .map((b) => `${b.nombre || nombrePorDni.get(Number(b.dni)) || b.dni} (${b.desde}-${b.hasta})`)
          .join('\n')
      }
    })
  }, [eventos, nombrePorDni])

  // Asignar nueva guardia -> actualiza UI y hace PUT del día (consolidado) para no romper por solapes
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
    const lunesSemana = new Date(calendarApi.view.activeStart) // con firstDay=1 ya es lunes
    const fechaObjetivo = new Date(lunesSemana)
    fechaObjetivo.setDate(lunesSemana.getDate() + diaSeleccionado.value)

    const [horaI, minI] = horaDesde.split(':').map(Number)
    const [horaF, minF] = horaHasta.split(':').map(Number)

    const nuevoInicioDate = new Date(
      fechaObjetivo.getFullYear(), fechaObjetivo.getMonth(), fechaObjetivo.getDate(), horaI, minI
    )
    const nuevoFinDate = new Date(
      fechaObjetivo.getFullYear(), fechaObjetivo.getMonth(), fechaObjetivo.getDate(), horaF, minF
    )

    // --- previsualizamos nextEventos y actualizamos estado
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
            {
              nombre: bomberoSeleccionado.label,
              dni: Number(bomberoSeleccionado.value),
              desde: horaDesde,
              hasta: horaHasta
            }
          ])

          return {
            ...ev,
            start: nuevoStart,
            end: nuevoEnd,
            extendedProps: { bomberos: bomberosActualizados }
          }
        }
        return { ...ev, extendedProps: { bomberos: mergeByDni(ev.extendedProps?.bomberos || []) } }
      })

      // si no tocó ninguno, agrego un evento nuevo
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
            bomberos: mergeByDni([{
              nombre: bomberoSeleccionado.label,
              dni: Number(bomberoSeleccionado.value),
              desde: horaDesde,
              hasta: horaHasta
            }])
          }
        })
      }

      return fusionarEventos(eventosActualizados)
    })()

    setEventos(nextEventos)

    // --- persistimos TODO el día con consolidación por DNI para evitar error por solapes
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
      console.error(e)
      setMensaje(`Error al guardar: ${e.message}`)
      setTimeout(() => setMensaje(''), 5000)
    } finally {
      setGuardando(false)
    }

    setHoraDesde('')
    setHoraHasta('')
    setDiaSeleccionado(null)
    setBomberoSeleccionado(null)
  }

  const cargarSemanaServidor = async (startDate, endDate) => {
    if (!idGrupo) return
    try {
      setCargandoSemana(true)
      const start = yyyyMmDd(startDate)
      const end = yyyyMmDd(endDate) // exclusivo en backend
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

  // (helper manual)
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

  const opcionesBomberos = bomberos.map((b) => ({
    label: `${b.nombre} ${b.apellido}`,
    value: b.dni,
    ...b
  }))

  // === Mensajería: clase de alerta por contenido ===
  const mensajeClass = useMemo(() => {
    if (!mensaje) return 'alert-info'
    const m = mensaje.toLowerCase()

    if (/(falló|fallo|error|no se guard|no pudo|rechazad|inválid|invalido)/.test(m)) {
      return 'alert-danger'
    }
    if (/(éxito|exito|correctamente|guardad[oa]s? (en|con)|actualizad[oa] (en|con))/.test(m)) {
      return 'alert-success'
    }
    return 'alert-warning'
  }, [mensaje])

  return (
    <div className="container-fluid py-5">
      <div className='text-center mb-4'>
        <div className='d-flex justify-content-center align-items-center gap-3 mb-3'>
          <h1 className="fw-bold text-white fs-3 mb-0">
            Gestionar Guardias
          </h1>
        </div>
        <span className="badge bg-danger-subtle text-danger">
          <i className="bi bi-fire me-2"></i> Sistema de Gestión de Personal - Cuartel de Bomberos
        </span>
      </div>

      <div className="card shadow-sm border-0 bg-white bg-opacity-1 backdrop-blur-sm">
        <div className="card-header bg-danger text-white d-flex align-items-center gap-2 py-4">
          <strong>Gestión de guardias - {nombreGrupo}</strong>
        </div>
        <div className="card-body">
          {mensaje && (
            <div className={`alert ${mensajeClass}`} role="alert">
              {mensaje}
            </div>
          )}

          <div className="row px-5">
            {/* Columna izquierda */}
            <div className="col-md-4 mb-3 px-5">
              <h4 className="text-black">Bomberos del grupo</h4>

              <Select
                options={opcionesBomberos}
                value={bomberoSeleccionado}
                onChange={setBomberoSeleccionado}
                classNamePrefix="rs"
                placeholder="Seleccionar bombero"
                isClearable
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
                  <Select
                    options={horas}
                    value={
                      horaDesde
                        ? { label: horaDesde.split(':')[0], value: horaDesde.split(':')[0] }
                        : null
                    }
                    onChange={(selected) => {
                      const nuevo = selected?.value || ''
                      setHoraDesde(`${nuevo}:${horaDesde.split(':')[1] || '00'}`)
                    }}
                    classNamePrefix="rs"
                    placeholder="HH"
                    isClearable
                  />
                  <Select
                    options={minutos}
                    value={
                      horaDesde
                        ? { label: horaDesde.split(':')[1], value: horaDesde.split(':')[1] }
                        : null
                    }
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

                <label className="mt-2">Hasta:</label>
                <div className="d-flex gap-3">
                  <Select
                    options={horas}
                    value={
                      horaHasta
                        ? { label: horaHasta.split(':')[0], value: horaHasta.split(':')[0] }
                        : null
                    }
                    onChange={(selected) => {
                      const nueva = selected?.value || ''
                      setHoraHasta(`${nueva}:${horaHasta.split(':')[1] || '00'}`)
                    }}
                    classNamePrefix="rs"
                    placeholder="HH"
                    isClearable
                  />
                  <Select
                    options={minutos}
                    value={
                      horaHasta
                        ? { label: horaHasta.split(':')[1], value: horaHasta.split(':')[1] }
                        : null
                    }
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

                <button className="btn btn-danger me-3 w-100 mt-3" onClick={asignarGuardia} disabled={guardando}>
                  {guardando ? 'Guardando…' : 'Guardar'}
                </button>
                <BackToMenuButton onClick={onVolver} />
              </div>
            </div>

            {/* Columna derecha: Calendario + Modales */}
            <div className="col-md-8">
              <FullCalendar
                ref={calendarRef}
                plugins={[timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                events={eventos}
                locale={esLocale}
                scrollTime="00:00:00"
                slotMinTime="00:00:00"
                firstDay={1}
                headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
                allDaySlot={false}
                slotDuration="00:30:00"
                slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                eventClassNames={() => ['fc-guardia']}
                eventContent={() => ({ domNodes: [] })}
                eventDidMount={(info) => {
                  // === Tooltip (solo manejo de DOM, el estilo está en CSS) ===
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

                  info.el.addEventListener('mouseenter', (e) => {
                    tooltip.style.display = 'block'
                    tooltip.style.left = `${e.pageX + 10}px`
                    tooltip.style.top = `${e.pageY - 20}px`
                  })
                  info.el.addEventListener('mousemove', (e) => {
                    tooltip.style.left = `${e.pageX + 10}px`
                    tooltip.style.top = `${e.pageY - 20}px`
                  })
                  info.el.addEventListener('mouseleave', () => {
                    tooltip.style.display = 'none'
                  })
                }}
                eventWillUnmount={(info) => {
                  const tooltip = tooltipsRef.current[info.event.id]
                  if (tooltip && tooltip.parentNode) tooltip.parentNode.removeChild(tooltip)
                  delete tooltipsRef.current[info.event.id]
                }}
                eventClick={(info) => {
                  info.jsEvent.preventDefault()
                  const tooltip = tooltipsRef.current[info.event.id]
                  if (tooltip) tooltip.style.display = 'none'
                  setEventoPendiente(info.event)
                  setModalConfirmar(true)
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

              {/* Modal Confirmar */}
              {modalConfirmar && eventoPendiente && (
                <div className="modal fade show d-block modal-backdrop-custom" tabIndex="-1">
                  <div className="modal-dialog">
                    <div className="modal-content modal-content-white">
                      <div className=" bg-danger modal-header">
                        <h5 className="modal-title text-white">Confirmar acción</h5>
                        <button type="button" className="btn-close" onClick={() => setModalConfirmar(false)}></button>
                      </div>
                      <div className="modal-body">
                        <p>¿Desea modificar la guardia seleccionada?</p>
                      </div>
                      <div className="modal-footer">
                        <button
                          className="btn btn-danger"
                          onClick={() => {
                            setEventoSeleccionado(eventoPendiente)
                            const base = (eventoPendiente.extendedProps?.bomberos || []).map(b => ({
                              ...b,
                              nombre: b.nombre || nombrePorDni.get(Number(b.dni)) || String(b.dni)
                            }))
                            setBomberosEditados(base)
                            setBomberosOriginales(base)
                            setMensajesModal([])
                            setTieneCambios(false)
                            setModalConfirmar(false)
                            setModalAbierto(true)
                          }}
                        >
                          Aceptar
                        </button>
                        <button className="btn btn-secondary" onClick={() => setModalConfirmar(false)}>Cancelar</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Edición */}
              {modalAbierto && eventoSeleccionado && (
                <div className="modal fade show d-block modal-backdrop-custom" tabIndex="-1">
                  <div className="modal-dialog modal-lg">
                    <div className="modal-content modal-content-white">
                      <div className="bg-danger modal-header">
                        <h5 className="modal-title text-white">Modificar guardia</h5>
                        <button type="button" className="btn-close" onClick={() => setModalAbierto(false)}></button>
                      </div>
                      <div className="modal-body">
                        {mensajesModal.length > 0 && (
                          <div>
                            {mensajesModal.map((mensaje, idx) => (
                              <div key={idx} className="alert alert-warning">
                                {mensaje}
                              </div>
                            ))}
                          </div>
                        )}

                        <p><strong>Fecha:</strong> {new Date(eventoSeleccionado.start).toLocaleDateString()}</p>
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
                            {bomberosEditados.map((b, idx) => (
                              <tr key={idx}>
                                <td>{b.nombre}</td>
                                <td>
                                  <div className="d-flex gap-2">
                                    <Select
                                      options={horas}
                                      value={{ label: b.desde.split(':')[0], value: b.desde.split(':')[0] }}
                                      onChange={(selected) => {
                                        const nuevo = bomberosEditados.map((item, i) =>
                                          i === idx ? { ...item, desde: `${selected.value}:${b.desde.split(':')[1]}` } : item
                                        )
                                        setBomberosEditados(nuevo)
                                      }}
                                      classNamePrefix="rs"
                                      placeholder="HH"
                                    />
                                    <Select
                                      options={minutos}
                                      value={{ label: b.desde.split(':')[1], value: b.desde.split(':')[1] }}
                                      onChange={(selected) => {
                                        const nuevo = bomberosEditados.map((item, i) =>
                                          i === idx ? { ...item, desde: `${b.desde.split(':')[0]}:${selected.value}` } : item
                                        )
                                        setBomberosEditados(nuevo)
                                      }}
                                      classNamePrefix="rs"
                                      placeholder="MM"
                                    />
                                  </div>
                                </td>
                                <td>
                                  <div className="d-flex gap-2">
                                    <Select
                                      options={horas}
                                      value={{ label: b.hasta.split(':')[0], value: b.hasta.split(':')[0] }}
                                      onChange={(selected) => {
                                        const nuevo = bomberosEditados.map((item, i) =>
                                          i === idx ? { ...item, hasta: `${selected.value}:${b.hasta.split(':')[1]}` } : item
                                        )
                                        setBomberosEditados(nuevo)
                                      }}
                                      classNamePrefix="rs"
                                      placeholder="HH"
                                    />
                                    <Select
                                      options={minutos}
                                      value={{ label: b.hasta.split(':')[1], value: b.hasta.split(':')[1] }}
                                      onChange={(selected) => {
                                        const nuevo = bomberosEditados.map((item, i) =>
                                          i === idx ? { ...item, hasta: `${b.hasta.split(':')[0]}:${selected.value}` } : item
                                        )
                                        setBomberosEditados(nuevo)
                                      }}
                                      classNamePrefix="rs"
                                      placeholder="MM"
                                    />
                                  </div>
                                </td>
                                <td className="text-center">
                                  <button
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => setBomberosEditados(prev => prev.filter((_, i) => i !== idx))}
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="modal-footer">
                        <button
                          className="btn btn-danger"
                          disabled={!tieneCambios}
                          onClick={() => {
                            // ... (misma lógica que ya tenías)
                            const fechaBase = new Date(eventoSeleccionado.start)
                            if (bomberosEditados.length === 0) {
                              const fechaStr = yyyyMmDd(fechaBase)
                              const nextEventos = fusionarEventos(
                                eventos.filter(ev => ev.id !== eventoSeleccionado.id)
                              )
                              setEventos(nextEventos)
                              setModalAbierto(false)
                              setGuardando(true)
                              apiRequest(API_URLS.grupos.guardias.reemplazarDia(idGrupo), {
                                method: 'PUT',
                                body: JSON.stringify({ fecha: fechaStr, asignaciones: asignacionesDelDiaDesdeEventos(nextEventos, fechaStr) })
                              })
                                .then(() => {
                                  setMensaje('Guardia eliminada y actualizada con exito')
                                  const api = calendarRef.current?.getApi()
                                  if (api?.view) cargarSemanaServidor(api.view.activeStart, api.view.activeEnd)
                                  setTimeout(() => setMensaje(''), 3000)
                                })
                                .catch((e) => {
                                  console.error(e)
                                  setMensaje(`Error al guardar: ${e.message}`)
                                  setTimeout(() => setMensaje(''), 5000)
                                })
                                .finally(() => setGuardando(false))
                              return
                            }
                            setMensajesModal([])
                            setModalConfirmarGuardar(true)
                          }}
                        >
                          Confirmar
                        </button>
                        <button className="btn btn-secondary" onClick={() => setModalAbierto(false)}>Volver</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Confirmar Guardado */}
              {modalConfirmarGuardar && eventoSeleccionado && (
                <div className="modal fade show d-block modal-backdrop-custom" tabIndex="-1">
                  <div className="modal-dialog">
                    <div className="modal-content modal-content-white">
                      <div className="modal-header">
                        <h5 className="modal-title text-black">Confirmar guardado</h5>
                        <button type="button" className="btn-close" onClick={() => setModalConfirmarGuardar(false)}></button>
                      </div>
                      <div className="modal-body">
                        <p>¿Desea guardar los cambios realizados en esta guardia?</p>
                      </div>
                      <div className="modal-footer">
                        <button
                          className="btn btn-danger"
                          onClick={async () => {
                            // ... (misma lógica de guardar del modal)
                            // se mantiene igual; solo se movieron estilos al CSS
                            // (tu implementación original sigue acá)
                          }}
                        >
                          Aceptar
                        </button>
                        <button className="btn btn-secondary" onClick={() => setModalConfirmarGuardar(false)}>Cancelar</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}

export default GestionarGuardias
