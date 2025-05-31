import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ParticipacionIncidente.css'

const ParticipacionIncidente = () => {
  const [sirena, setSirena] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    // Aquí se podrá implementar lógica de backend
  }

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="form-abm p-4 shadow rounded w-100" style={{ maxWidth: '700px' }}>
        <h2 className="text-white text-center mb-4">Formulario de Participación</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="fechaLlamado" className="form-label">Fecha y hora que se recibió el llamado de emergencia</label>
            <input type="datetime-local" id="fechaLlamado" className="form-control" required />
          </div>

          <div className="mb-3 form-check">
            <input type="checkbox" className="form-check-input" id="sirenaTocada" checked={sirena} onChange={() => setSirena(!sirena)} />
            <label className="form-check-label" htmlFor="sirenaTocada">Se tocó la sirena</label>
          </div>

          <div className="mb-3">
            <label htmlFor="horaSirena" className="form-label">Hora del toque de sirena</label>
            <input type="time" id="horaSirena" className="form-control" disabled={!sirena} />
          </div>

          <div className="mb-3">
            <label htmlFor="horaArribo" className="form-label">Hora de arribo al siniestro</label>
            <input type="time" id="horaArribo" className="form-control" required />
          </div>

          <div className="mb-3">
            <label htmlFor="horaRetorno" className="form-label">Hora de retorno del siniestro</label>
            <input type="time" id="horaRetorno" className="form-control" required />
          </div>

          <div className="mb-3">
            <label htmlFor="personaAlerta" className="form-label">Persona que emitió la alerta</label>
            <select id="personaAlerta" className="form-select" required>
              <option selected disabled>Seleccione persona</option>
              <option>Juan Pérez</option>
              <option>María Gómez</option>
              <option>Carlos López</option>
              <option>Ana Martínez</option>
            </select>
          </div>

          <div className="mb-3">
            <label htmlFor="personaCargo" className="form-label">Persona a cargo del siniestro</label>
            <select id="personaCargo" className="form-select" required>
              <option selected disabled>Seleccione persona</option>
              <option>Juan Pérez</option>
              <option>María Gómez</option>
              <option>Carlos López</option>
              <option>Ana Martínez</option>
            </select>
          </div>

          <button type="submit" className="btn btn-danger w-100 mt-3">Finalizar carga</button>
          <button type="button" className="btn btn-secondary w-100 mt-2" onClick={() => navigate('/')}>Volver al menú</button>
        </form>
      </div>
    </div>
  )
}

export default ParticipacionIncidente