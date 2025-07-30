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

  // tooltips y calendario
  const tooltipsRef = useRef({})
  const calendarRef = useRef()

  // Estados del modal deben ir acá
  const [modalAbierto, setModalAbierto] = useState(false)
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null)

  const [modalConfirmar, setModalConfirmar] = useState(false)
  const [eventoPendiente, setEventoPendiente] = useState(null)

  const [modalConfirmarGuardar, setModalConfirmarGuardar] = useState(false)


  // Actualiza tooltips cuando cambian eventos
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

    // Semana visible en el calendario
    const calendarApi = calendarRef.current?.getApi()
    const lunesSemana = new Date(calendarApi.view.activeStart)

    // Día seleccionado en base a la vista activa
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
        const solapan = nuevoInicioDate <= finEv && nuevoFinDate >= inicioEv

        if (solapan) {
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
          backgroundColor: '#f08080', // 🔹 Rojo claro por defecto
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

      return [...eventosActualizados]
    })

    setHoraDesde('')
    setHoraHasta('')
    setDiaSeleccionado(null)
    setBomberoSeleccionado(null)
    setMensaje('Guardia asignada correctamente')
  }

  const eliminarBombero = (idEvento, nombreBombero) => {
  setEventos((prev) => {
    return prev
      .map((ev) => {
        if (ev.id === idEvento) {
          const bomberosActualizados = ev.extendedProps.bomberos.filter(b => b.nombre !== nombreBombero)
          
          // Si ya no quedan bomberos, se elimina el evento
          if (bomberosActualizados.length === 0) return null

          return {
            ...ev,
            extendedProps: { bomberos: bomberosActualizados }
          }
        }
        return ev
      })
      .filter(Boolean)
  })

  // Si ya no quedan bomberos, cerrar modal
  const evento = eventos.find(ev => ev.id === idEvento)
  if (evento && evento.extendedProps.bomberos.length <= 1) {
    setModalAbierto(false)
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
                options={[...Array(24).keys()].map((h) => ({
                  label: h.toString().padStart(2, '0'),
                  value: h.toString().padStart(2, '0')
                }))}
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
                options={[...Array(60).keys()].map((m) => ({
                  label: m.toString().padStart(2, '0'),
                  value: m.toString().padStart(2, '0')
                }))}
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
                options={[...Array(24).keys()].map((h) => ({
                  label: h.toString().padStart(2, '0'),
                  value: h.toString().padStart(2, '0')
                }))}
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
                options={[...Array(60).keys()].map((m) => ({
                  label: m.toString().padStart(2, '0'),
                  value: m.toString().padStart(2, '0')
                }))}
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
              // Estilos dinámicos del bloque (eventos)
              info.el.style.backgroundColor = '#f08080' // Rojo claro
              info.el.style.border = '1px solid #b30000'
              info.el.style.transition = 'background-color 0.2s ease'

              // Tooltip flotante
              const tooltip = document.createElement('div')
              tooltip.className = 'tooltip-dinamico'
              tooltip.innerText = info.event.extendedProps.bomberos
                .map((b) => `${b.nombre} (${b.desde}-${b.hasta})`)
                .join('\n')
              document.body.appendChild(tooltip)
              tooltipsRef.current[info.event.id] = tooltip

              // Eventos de hover: color + tooltip
              info.el.addEventListener('mouseenter', (e) => {
                info.el.style.backgroundColor = '#d52b1e' // Rojo oscuro al hover
                tooltip.style.display = 'block'
                tooltip.style.left = `${e.pageX + 10}px`
                tooltip.style.top = `${e.pageY - 20}px`
              })

              info.el.addEventListener('mousemove', (e) => {
                tooltip.style.left = `${e.pageX + 10}px`
                tooltip.style.top = `${e.pageY - 20}px`
              })

              info.el.addEventListener('mouseleave', () => {
                info.el.style.backgroundColor = '#f08080' // Vuelve a claro
                tooltip.style.display = 'none'
              })


            }}

            eventClick={(info) => {
  info.jsEvent.preventDefault()

  // Ocultar tooltip si estaba abierto
  const tooltip = tooltipsRef.current[info.event.id]
  if (tooltip) tooltip.style.display = 'none'

  // Guardamos el evento y abrimos el modal de confirmación
  setEventoPendiente(info.event)
  setModalConfirmar(true)
}}


          />

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
              setModalConfirmar(false)
              setModalAbierto(true)
            }}
          >
            Aceptar
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setModalConfirmar(false)}
          >
            Cancelar
          </button>
          
        </div>
      </div>
    </div>
  </div>
)}

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
                <th>Horario</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {eventoSeleccionado.extendedProps.bomberos.map((b, idx) => (
                <tr key={idx}>
                  <td>{b.nombre}</td>
                  <td>{b.desde} - {b.hasta}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => eliminarBombero(eventoSeleccionado.id, b.nombre)}
                    >
                      ❌
                    </button>
                    {/* Aquí podemos luego agregar botón editar */}
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
              // 🔹 Aquí se confirman los cambios
              setModalConfirmarGuardar(false)
              setModalAbierto(false)

              // Ejemplo de lógica si tuviéramos cambios temporales:
              // setEventos((prev) => prev.map((ev) => ev.id === eventoSeleccionado.id ? eventoSeleccionado : ev))

              alert('✅ Cambios guardados correctamente')
            }}
          >
            Guardar
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => setModalConfirmarGuardar(false)}
          >
            Cancelar
          </button>
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
