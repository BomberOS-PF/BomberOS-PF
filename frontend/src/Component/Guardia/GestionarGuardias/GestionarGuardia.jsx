import React, { useState, useEffect, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'
import Select from 'react-select'
import '../../DisenioFormulario/DisenioFormulario.css'

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

const customStyles = {
  control: (base, state) => ({
    ...base,
    backgroundColor: '#ffffff',
    borderColor: '#dc3545',
    boxShadow: state.isFocused ? '0 0 0 2px rgba(220, 53, 69, 0.3)' : 'none',
    '&:hover': {
      borderColor: '#dc3545'
    }
  }),
  singleValue: (base) => ({
    ...base,
    color: '#000000'
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: '#ffffff',
    zIndex: 9999
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? '#dc3545'
      : state.isFocused
      ? '#ff6b6b'
      : '#ffffff',
    color: '#000000',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: '#dc3545'
    }
  })
}

const GestionarGuardias = ({ idGrupo, nombreGrupo, bomberos = [], onVolver }) => {
  const [eventos, setEventos] = useState([])
  const [bomberoSeleccionado, setBomberoSeleccionado] = useState(null)
  const [diaSeleccionado, setDiaSeleccionado] = useState(null)
  const [horaDesde, setHoraDesde] = useState('')
  const [horaHasta, setHoraHasta] = useState('')
  const [mensaje, setMensaje] = useState('')

  const tooltipsRef = useRef({})
  const calendarRef = useRef()

  // Estados modal
  const [modalAbierto, setModalAbierto] = useState(false)
  const [modalConfirmar, setModalConfirmar] = useState(false)
  const [modalConfirmarGuardar, setModalConfirmarGuardar] = useState(false)
  const [eventoPendiente, setEventoPendiente] = useState(null)
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null)
  const [bomberosEditados, setBomberosEditados] = useState([])

  // 🔹 Fusionar bloques si se solapan o se tocan
  const fusionarEventos = (listaEventos) => {
    const ordenados = [...listaEventos].sort((a, b) => new Date(a.start) - new Date(b.start))
    const fusionados = []

    ordenados.forEach((ev) => {
      if (fusionados.length === 0) {
        fusionados.push(ev)
      } else {
        const ultimo = fusionados[fusionados.length - 1]
        // 🔹 Se solapan o se tocan justo en el límite
        if (new Date(ev.start) <= ultimo.end || new Date(ev.start).getTime() === ultimo.end.getTime()) {
          ultimo.end = new Date(Math.max(ultimo.end, new Date(ev.end)))

          // 🔹 Eliminar bomberos duplicados por nombre
          const bomberosUnicos = [
            ...ultimo.extendedProps.bomberos,
            ...ev.extendedProps.bomberos
          ].reduce((acc, b) => {
            if (!acc.find((x) => x.nombre === b.nombre)) acc.push(b)
            return acc
          }, [])

          ultimo.extendedProps.bomberos = bomberosUnicos
        } else {
          fusionados.push(ev)
        }
      }
    })

    return fusionados
  }

  // Actualiza tooltip
  useEffect(() => {
    eventos.forEach((ev) => {
      const tooltip = tooltipsRef.current[ev.id]
      if (tooltip) {
        tooltip.innerText = ev.extendedProps.bomberos
          .map((b) => `${b.nombre} (${b.desde}-${b.hasta})`)
          .join('\n')
      }
    })
  }, [eventos])

  const asignarGuardia = () => {
    if (!bomberoSeleccionado || !horaDesde || !horaHasta || diaSeleccionado === null) {
      setMensaje('Debes completar todos los campos obligatorios para asignar una guardia.')
      return
    }

    if (horaHasta <= horaDesde) {
      setMensaje('La hora de fin debe ser posterior a la hora de inicio.')
      return
    }

    const calendarApi = calendarRef.current?.getApi()
    const lunesSemana = new Date(calendarApi.view.activeStart)

    const fechaObjetivo = new Date(lunesSemana)
    fechaObjetivo.setDate(lunesSemana.getDate() + diaSeleccionado.value)

    const [horaI, minI] = horaDesde.split(':').map(Number)
    const [horaF, minF] = horaHasta.split(':').map(Number)

    const nuevoInicioDate = new Date(
      fechaObjetivo.getFullYear(),
      fechaObjetivo.getMonth(),
      fechaObjetivo.getDate(),
      horaI,
      minI
    )

    const nuevoFinDate = new Date(
      fechaObjetivo.getFullYear(),
      fechaObjetivo.getMonth(),
      fechaObjetivo.getDate(),
      horaF,
      minF
    )

    setEventos((prevEventos) => {
      let eventosActualizados = [...prevEventos]
      let fusionado = false

      eventosActualizados = eventosActualizados.map((ev) => {
        const inicioEv = new Date(ev.start)
        const finEv = new Date(ev.end)
        const seSolapanOTocan =
          nuevoInicioDate <= finEv || nuevoInicioDate.getTime() === finEv.getTime()

        if (seSolapanOTocan) {
          fusionado = true
          const nuevoStart = nuevoInicioDate < inicioEv ? nuevoInicioDate : inicioEv
          const nuevoEnd = nuevoFinDate > finEv ? nuevoFinDate : finEv

          const bomberosActualizados = [...ev.extendedProps.bomberos]
          const yaExiste = bomberosActualizados.some(
            (b) => b.nombre === bomberoSeleccionado.label
          )
          if (!yaExiste) {
            bomberosActualizados.push({
              nombre: bomberoSeleccionado.label,
              desde: horaDesde,
              hasta: horaHasta
            })
          }

          return {
            ...ev,
            start: nuevoStart,
            end: nuevoEnd,
            extendedProps: { bomberos: bomberosActualizados }
          }
        }

        return ev
      })

      if (!fusionado) {
        eventosActualizados.push({
          id: `${fechaObjetivo.toISOString()}-${horaDesde}`,
          title: '',
          start: nuevoInicioDate,
          end: nuevoFinDate,
          backgroundColor: '#f08080',
          borderColor: '#b30000',
          textColor: 'transparent',
          allDay: false,
          extendedProps: {
            bomberos: [
              {
                nombre: bomberoSeleccionado.label,
                desde: horaDesde,
                hasta: horaHasta
              }
            ]
          }
        })
      }

      return fusionarEventos(eventosActualizados)
    })

    setHoraDesde('')
    setHoraHasta('')
    setDiaSeleccionado(null)
    setBomberoSeleccionado(null)
    setMensaje('Guardia asignada correctamente')
  }

  if (!idGrupo) {
    return <div className="alert alert-danger">No se encontró el grupo.</div>
  }

  const opcionesBomberos = bomberos.map((b) => ({
    label: `${b.nombre} ${b.apellido}`,
    value: b.dni,
    ...b
  }))

  return (
    <div className="container formulario-consistente">
      <h2 className="text-black mb-4">Gestión de guardias - {nombreGrupo}</h2>

      {mensaje && (
        <div
          className={`alert ${
            mensaje.includes('correctamente') ? 'alert-success' : 'alert-warning'
          }`}
        >
          {mensaje}
        </div>
      )}

      <div className="row">
        {/* === Columna izquierda === */}
        <div className="col-md-4 mb-3">
          <h4 className="text-black">Bomberos del grupo</h4>

          <Select
            options={opcionesBomberos}
            value={bomberoSeleccionado}
            onChange={setBomberoSeleccionado}
            styles={customStyles}
            placeholder="Seleccionar bombero"
            isClearable
          />

          <div className="mt-3">
            <label>Día:</label>
            <Select
              options={diasSemana}
              value={diaSeleccionado}
              onChange={setDiaSeleccionado}
              styles={customStyles}
              placeholder="Seleccionar día"
              isClearable
            />

            <label className="mt-2">Desde:</label>
            <div className="d-flex gap-2">
              <Select
                options={horas}
                value={
                  horaDesde
                    ? {
                        label: horaDesde.split(':')[0],
                        value: horaDesde.split(':')[0]
                      }
                    : null
                }
                onChange={(selected) => {
                  const nuevaHora = selected?.value || ''
                  setHoraDesde(`${nuevaHora}:${horaDesde.split(':')[1] || '00'}`)
                }}
                styles={customStyles}
                placeholder="HH"
                isClearable
              />

              <Select
                options={minutos}
                value={
                  horaDesde
                    ? {
                        label: horaDesde.split(':')[1],
                        value: horaDesde.split(':')[1]
                      }
                    : null
                }
                onChange={(selected) => {
                  const nuevosMin = selected?.value || ''
                  setHoraDesde(`${horaDesde.split(':')[0] || '00'}:${nuevosMin}`)
                }}
                styles={customStyles}
                placeholder="MM"
                isClearable
                isSearchable
              />
            </div>

            <label className="mt-2">Hasta:</label>
            <div className="d-flex gap-2">
              <Select
                options={horas}
                value={
                  horaHasta
                    ? {
                        label: horaHasta.split(':')[0],
                        value: horaHasta.split(':')[0]
                      }
                    : null
                }
                onChange={(selected) => {
                  const nuevaHora = selected?.value || ''
                  setHoraHasta(`${nuevaHora}:${horaHasta.split(':')[1] || '00'}`)
                }}
                styles={customStyles}
                placeholder="HH"
                isClearable
              />

              <Select
                options={minutos}
                value={
                  horaHasta
                    ? {
                        label: horaHasta.split(':')[1],
                        value: horaHasta.split(':')[1]
                      }
                    : null
                }
                onChange={(selected) => {
                  const nuevosMin = selected?.value || ''
                  setHoraHasta(`${horaHasta.split(':')[0] || '00'}:${nuevosMin}`)
                }}
                styles={customStyles}
                placeholder="MM"
                isClearable
                isSearchable
              />
            </div>

            <button className="btn btn-danger me-3 w-100 mt-3" onClick={asignarGuardia}>
              Guardar
            </button>
            <button className="btn btn-secondary mt-2 w-100" onClick={onVolver}>
              Volver
            </button>
          </div>
        </div>

        {/* === Columna derecha Calendario + Modales === */}
        <div className="col-md-8">
          <FullCalendar
            ref={calendarRef}
            plugins={[timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            events={eventos}
            locale={esLocale}
            firstDay={1}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: ''
            }}
            allDaySlot={false}
            slotDuration="00:30:00"
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }}
            eventContent={() => ({ domNodes: [] })}
            eventDidMount={(info) => {
              info.el.style.backgroundColor = '#f08080'
              info.el.style.border = '1px solid #b30000'
              info.el.style.transition = 'background-color 0.2s ease'

              const tooltip = document.createElement('div')
              tooltip.className = 'tooltip-dinamico'
              tooltip.innerText = info.event.extendedProps.bomberos
                .map((b) => `${b.nombre} (${b.desde}-${b.hasta})`)
                .join('\n')
              document.body.appendChild(tooltip)
              tooltipsRef.current[info.event.id] = tooltip

              info.el.addEventListener('mouseenter', (e) => {
                info.el.style.backgroundColor = '#d52b1e'
                tooltip.style.display = 'block'
                tooltip.style.left = `${e.pageX + 10}px`
                tooltip.style.top = `${e.pageY - 20}px`
              })

              info.el.addEventListener('mousemove', (e) => {
                tooltip.style.left = `${e.pageX + 10}px`
                tooltip.style.top = `${e.pageY - 20}px`
              })

              info.el.addEventListener('mouseleave', () => {
                info.el.style.backgroundColor = '#f08080'
                tooltip.style.display = 'none'
              })
            }}
            eventClick={(info) => {
              info.jsEvent.preventDefault()
              const tooltip = tooltipsRef.current[info.event.id]
              if (tooltip) tooltip.style.display = 'none'
              setEventoPendiente(info.event)
              setModalConfirmar(true)
            }}
          />

          {/* === Modal Confirmar === */}
          {modalConfirmar && eventoPendiente && (
            <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title text-black">Confirmar acción</h5>
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
                        setBomberosEditados([...eventoPendiente.extendedProps.bomberos])
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

          {/* === Modal Edición === */}
          {modalAbierto && eventoSeleccionado && (
            <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog modal-lg">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title text-black">Modificar guardia</h5>
                    <button type="button" className="btn-close" onClick={() => setModalAbierto(false)}></button>
                  </div>
                  <div className="modal-body">
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
                                  value={{
                                    label: b.desde.split(':')[0],
                                    value: b.desde.split(':')[0]
                                  }}
                                  onChange={(selected) => {
                                    const nuevo = [...bomberosEditados]
                                    nuevo[idx].desde = `${selected.value}:${b.desde.split(':')[1]}`
                                    setBomberosEditados(nuevo)
                                  }}
                                  styles={customStyles}
                                  placeholder="HH"
                                />
                                <Select
                                  options={minutos}
                                  value={{
                                    label: b.desde.split(':')[1],
                                    value: b.desde.split(':')[1]
                                  }}
                                  onChange={(selected) => {
                                    const nuevo = [...bomberosEditados]
                                    nuevo[idx].desde = `${b.desde.split(':')[0]}:${selected.value}`
                                    setBomberosEditados(nuevo)
                                  }}
                                  styles={customStyles}
                                  placeholder="MM"
                                />
                              </div>
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <Select
                                  options={horas}
                                  value={{
                                    label: b.hasta.split(':')[0],
                                    value: b.hasta.split(':')[0]
                                  }}
                                  onChange={(selected) => {
                                    const nuevo = [...bomberosEditados]
                                    nuevo[idx].hasta = `${selected.value}:${b.hasta.split(':')[1]}`
                                    setBomberosEditados(nuevo)
                                  }}
                                  styles={customStyles}
                                  placeholder="HH"
                                />
                                <Select
                                  options={minutos}
                                  value={{
                                    label: b.hasta.split(':')[1],
                                    value: b.hasta.split(':')[1]
                                  }}
                                  onChange={(selected) => {
                                    const nuevo = [...bomberosEditados]
                                    nuevo[idx].hasta = `${b.hasta.split(':')[0]}:${selected.value}`
                                    setBomberosEditados(nuevo)
                                  }}
                                  styles={customStyles}
                                  placeholder="MM"
                                />
                              </div>
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => setBomberosEditados(prev => prev.filter((_, i) => i !== idx))}
                              >
                                ❌
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-danger" onClick={() => setModalConfirmarGuardar(true)}>Guardar cambios</button>
                    <button className="btn btn-secondary" onClick={() => setModalAbierto(false)}>Cerrar</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === Modal Confirmar Guardado === */}
          {modalConfirmarGuardar && eventoSeleccionado && (
            <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog">
                <div className="modal-content">
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
                      onClick={() => {
                        const nuevasHoras = bomberosEditados.map((b) => ({
                          inicio: b.desde,
                          fin: b.hasta
                        }))

                        const nuevoInicio = nuevasHoras.reduce(
                          (min, b) => (b.inicio < min ? b.inicio : min),
                          nuevasHoras[0].inicio
                        )
                        const nuevoFin = nuevasHoras.reduce(
                          (max, b) => (b.fin > max ? b.fin : max),
                          nuevasHoras[0].fin
                        )

                        setEventos((prev) => {
                          const actualizados = prev.map((ev) =>
                            ev.id === eventoSeleccionado.id
                              ? {
                                  ...ev,
                                  start: new Date(
                                    ev.start.getFullYear(),
                                    ev.start.getMonth(),
                                    ev.start.getDate(),
                                    parseInt(nuevoInicio.split(':')[0]),
                                    parseInt(nuevoInicio.split(':')[1])
                                  ),
                                  end: new Date(
                                    ev.start.getFullYear(),
                                    ev.start.getMonth(),
                                    ev.start.getDate(),
                                    parseInt(nuevoFin.split(':')[0]),
                                    parseInt(nuevoFin.split(':')[1])
                                  ),
                                  extendedProps: { bomberos: bomberosEditados }
                                }
                              : ev
                          )
                          return fusionarEventos(actualizados)
                        })

                        setModalConfirmarGuardar(false)
                        setModalAbierto(false)
                        alert('✅ Cambios guardados correctamente')
                      }}
                    >
                      Guardar
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
  )
}

export default GestionarGuardias
