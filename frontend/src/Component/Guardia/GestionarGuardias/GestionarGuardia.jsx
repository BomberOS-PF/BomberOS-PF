import React, { useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'
import Select from 'react-select'
import '../../DisenioFormulario/DisenioFormulario.css'

const diasSemana = [
  { label: 'Lunes', value: 1 },
  { label: 'Martes', value: 2 },
  { label: 'Miércoles', value: 3 },
  { label: 'Jueves', value: 4 },
  { label: 'Viernes', value: 5 },
  { label: 'Sábado', value: 6 },
  { label: 'Domingo', value: 0 }
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

// Paleta rojo-negro por bombero
const coloresBomberos = [
  '#d52b1e', '#a8231a', '#e67360', '#ff8c8c',
  '#330000', '#660000', '#990000', '#cc0000'
]

// Asignar color único por DNI
const obtenerColorPorDNI = (dni) => {
  const hash = [...dni.toString()].reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return coloresBomberos[hash % coloresBomberos.length]
}

const GestionarGuardias = ({ idGrupo, nombreGrupo, bomberos = [], onVolver }) => {
  const [eventos, setEventos] = useState([])
  const [bomberoSeleccionado, setBomberoSeleccionado] = useState(null)
  const [diaSeleccionado, setDiaSeleccionado] = useState(null)
  const [horaDesde, setHoraDesde] = useState('')
  const [horaHasta, setHoraHasta] = useState('')
  const [mensaje, setMensaje] = useState('')

  const asignarGuardia = () => {
    if (!bomberoSeleccionado || !horaDesde || !horaHasta || !diaSeleccionado) {
      setMensaje('Debes completar todos los campos obligatorios para asignar una guardia.')
      return
    }

    if (horaHasta <= horaDesde) {
      setMensaje('La hora de fin debe ser posterior a la hora de inicio.')
      return
    }

    const ahora = new Date()
    const primerDiaSemana = new Date(
      ahora.setDate(ahora.getDate() - ahora.getDay() + Number(diaSeleccionado.value))
    )
    const fechaBase = primerDiaSemana.toISOString().split('T')[0]

    const nuevoInicio = `${fechaBase}T${horaDesde}`
    const nuevoFin = `${fechaBase}T${horaHasta}`

    const solapa = eventos.some(ev => {
      const existenteInicio = new Date(ev.start)
      const existenteFin = new Date(ev.end)
      const nuevoInicioDate = new Date(nuevoInicio)
      const nuevoFinDate = new Date(nuevoFin)

      return (
        ev.title === bomberoSeleccionado.label &&
        nuevoInicioDate < existenteFin &&
        nuevoFinDate > existenteInicio
      )
    })

    if (solapa) {
      setMensaje('El bombero ya tiene una guardia asignada en ese horario.')
      return
    }

    const color = obtenerColorPorDNI(bomberoSeleccionado.value)

    const nuevoEvento = {
      title: `${bomberoSeleccionado.label}`,
      start: nuevoInicio,
      end: nuevoFin,
      backgroundColor: color,
      borderColor: 'black',
      textColor: '#fff',
      allDay: false,
      extendedProps: {
      color
      }
    }

    setEventos(prev => [...prev, nuevoEvento])
    setHoraDesde('')
    setHoraHasta('')
    setDiaSeleccionado(null)
    setBomberoSeleccionado(null)
    setMensaje('Guardia asignada correctamente')
  }

  if (!idGrupo) {
    return <div className="alert alert-danger">No se encontró el grupo.</div>
  }

  const opcionesBomberos = bomberos.map(b => ({
    label: `${b.nombre} ${b.apellido}`,
    value: b.dni,
    ...b
  }))

  return (
    <div className="container formulario-consistente">
      <h2 className="text-black mb-4">Gestión de guardias - {nombreGrupo}</h2>

      {mensaje && (
        <div className={`alert ${mensaje.includes('correctamente') ? 'alert-success' : 'alert-warning'}`}>
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
                options={[...Array(24).keys()].map(h => ({
                  label: h.toString().padStart(2, '0'),
                  value: h.toString().padStart(2, '0')
                }))}
                value={horaDesde ? { label: horaDesde.split(':')[0], value: horaDesde.split(':')[0] } : null}
                onChange={(selected) => {
                  const nuevaHora = selected?.value || ''
                  setHoraDesde(`${nuevaHora}:${horaDesde.split(':')[1] || '00'}`)
                }}
                styles={customStyles}
                placeholder="HH"
                isClearable
              />

              <Select
                options={[...Array(60).keys()].map(m => ({
                  label: m.toString().padStart(2, '0'),
                  value: m.toString().padStart(2, '0')
                }))}
                value={horaDesde ? { label: horaDesde.split(':')[1], value: horaDesde.split(':')[1] } : null}
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
                options={[...Array(24).keys()].map(h => ({
                  label: h.toString().padStart(2, '0'),
                  value: h.toString().padStart(2, '0')
                }))}
                value={horaHasta ? { label: horaHasta.split(':')[0], value: horaHasta.split(':')[0] } : null}
                onChange={(selected) => {
                  const nuevaHora = selected?.value || ''
                  setHoraHasta(`${nuevaHora}:${horaHasta.split(':')[1] || '00'}`)
                }}
                styles={customStyles}
                placeholder="HH"
                isClearable
              />

              <Select
                options={[...Array(60).keys()].map(m => ({
                  label: m.toString().padStart(2, '0'),
                  value: m.toString().padStart(2, '0')
                }))}
                value={horaHasta ? { label: horaHasta.split(':')[1], value: horaHasta.split(':')[1] } : null}
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
  plugins={[timeGridPlugin, interactionPlugin]}
  initialView="timeGridWeek"
  events={eventos}
  locale={esLocale}
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
  eventDidMount={(info) => {
    const color = info.event.extendedProps.color || '#d52b1e'
    const el = info.el

    el.style.setProperty('background-color', color, 'important')
    el.style.setProperty('border', '1px solid black', 'important')
    el.style.setProperty('color', '#fff', 'important')
    el.style.setProperty('font-weight', 'bold', 'important')
    el.style.setProperty('font-size', '0.85rem', 'important')
    el.style.setProperty('padding', '2px', 'important')
  }}
/>



        </div>
      </div>
    </div>
  )
}

export default GestionarGuardias
