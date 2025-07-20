import React, { useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import esLocale from '@fullcalendar/core/locales/es'
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

const GestionarGuardias = ({ idGrupo, nombreGrupo, bomberos = [], onVolver }) => {
  const [eventos, setEventos] = useState([])
  const [bomberoSeleccionado, setBomberoSeleccionado] = useState(null)
  const [diaSeleccionado, setDiaSeleccionado] = useState('')
  const [horaDesde, setHoraDesde] = useState('')
  const [horaHasta, setHoraHasta] = useState('')
  const [mensaje, setMensaje] = useState('')

  const asignarGuardia = () => {
  if (!bomberoSeleccionado || !horaDesde || !horaHasta || diaSeleccionado === '') {
    setMensaje('Debes completar todos los campos obligatorios para asignar una guardia.')
    return
  }

  if (horaHasta <= horaDesde) {
    setMensaje('La hora de fin debe ser posterior a la hora de inicio.')
    return
  }

  const ahora = new Date()
  const primerDiaSemana = new Date(ahora.setDate(ahora.getDate() - ahora.getDay() + Number(diaSeleccionado)))
  const fechaBase = primerDiaSemana.toISOString().split('T')[0]

  const nuevoEvento = {
    title: `${bomberoSeleccionado.nombre} ${bomberoSeleccionado.apellido}`,
    start: `${fechaBase}T${horaDesde}`,
    end: `${fechaBase}T${horaHasta}`,
    allDay: false
  }

  setEventos(prev => [...prev, nuevoEvento])
  setHoraDesde('')
  setHoraHasta('')
  setDiaSeleccionado('')
  setBomberoSeleccionado(null)
  setMensaje('Guardia asignada correctamente')
}


  if (!idGrupo) {
    return <div className="alert alert-danger">No se encontró el grupo.</div>
  }

  return (
    <div className="container formulario-consistente">
      <h2 className="text-black mb-4">Gestión de guardias - {nombreGrupo}</h2>
      {mensaje && (
  <div className={`alert ${mensaje.includes('') ? 'alert-warning' : 'alert-success'}`}>
    {mensaje}
  </div>
)}

      <div className="row">
        <div className="col-md-4 mb-3">
          <h4 className="text-black">Bomberos del grupo</h4>
          <select
  className="form-select mb-3"
  value={bomberoSeleccionado?.dni || ''}
  onChange={e => {
    const seleccionado = bomberos.find(b => b.dni === parseInt(e.target.value))
    setBomberoSeleccionado(seleccionado || null)
  }}
>
  <option value="">Seleccionar bombero</option>
  {bomberos.map((b) => (
    <option key={b.dni} value={b.dni}>
      {b.nombre} {b.apellido}
    </option>
  ))}
</select>

          <div className="mt-3">
            <label>Día:</label>
            <select
              value={diaSeleccionado}
              onChange={e => setDiaSeleccionado(e.target.value)}
              className="form-control"
            >
              <option value="">Seleccionar día</option>
              {diasSemana.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>

            <label className="mt-2">Desde:</label>
            <input
              type="time"
              value={horaDesde}
              onChange={e => setHoraDesde(e.target.value)}
              className="form-control"
            />

            <label className="mt-2">Hasta:</label>
            <input
              type="time"
              value={horaHasta}
              onChange={e => setHoraHasta(e.target.value)}
              className="form-control"
            />

            <button className="btn btn-danger me-3 w-100" onClick={asignarGuardia}>
              Asignar guardia
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
            eventContent={(arg) => {
              const customStyle = `
                background-color: #ffecb3;
                color: black;
                font-weight: bold;
                border: 1px solid black;
                padding: 2px;
                font-size: 0.85rem;
              `
              return {
                html: `<div style="${customStyle}">${arg.event.title}</div>`
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default GestionarGuardias
