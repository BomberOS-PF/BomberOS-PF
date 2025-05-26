import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './VehiculoInvolucrado.css'

const VehiculoInvolucrado = () => {
  const navigate = useNavigate()
  const [participa, setParticipa] = useState(false)

  const handleCheckboxChange = () => setParticipa(!participa)

  const handleSubmit = (e) => {
    e.preventDefault()
    // Backend: enviar datos
    alert('Formulario enviado correctamente.')
  }

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="form-abm p-4 shadow rounded w-100" style={{ maxWidth: '700px' }}>
        <h2 className="text-black text-center mb-4">Vehículo Involucrado - Móvil 1</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3 form-check">
            <input type="checkbox" className="form-check-input" id="movilParticipa" checked={participa} onChange={handleCheckboxChange} />
            <label className="form-check-label text-white" htmlFor="movilParticipa">¿Participó este móvil?</label>
          </div>

          <fieldset disabled={!participa}>
            <div className="mb-3">
              <label htmlFor="choferMovil" className="form-label text-white">Chofer del móvil</label>
              <select id="choferMovil" className="form-select" required>
                <option disabled selected>Seleccione chofer</option>
                <option>Juan Pérez</option>
                <option>María Gómez</option>
                <option>Carlos López</option>
                <option>Ana Martínez</option>
              </select>
            </div>

            <div className="mb-3">
              <label htmlFor="aCargoMovil" className="form-label text-white">Persona a cargo del móvil</label>
              <select id="aCargoMovil" className="form-select" required>
                <option disabled selected>Seleccione responsable</option>
                <option>Juan Pérez</option>
                <option>María Gómez</option>
                <option>Carlos López</option>
                <option>Ana Martínez</option>
              </select>
            </div>

            <div className="mb-3">
              <label htmlFor="retornoMovil" className="form-label text-white">Fecha y hora de retorno del móvil</label>
              <input type="datetime-local" id="retornoMovil" className="form-control" required />
            </div>

            <div className="mb-3">
              <label className="form-label text-white">Dotación de bomberos</label>
              {['Juan Pérez', 'María Gómez', 'Carlos López', 'Ana Martínez'].map((nombre, idx) => (
                <div className="form-check text-white ms-2" key={idx}>
                  <input className="form-check-input" type="checkbox" id={`bombero${idx}`} />
                  <label className="form-check-label" htmlFor={`bombero${idx}`}>{nombre}</label>
                </div>
              ))}
            </div>
          </fieldset>

          <button type="submit" className="btn btn-danger w-100 mt-3">Finalizar carga</button>
          <button type="button" className="btn btn-secondary w-100 mt-2" onClick={() => navigate('/')}>Volver al menú</button>
        </form>
      </div>
    </div>
  )
}

export default VehiculoInvolucrado
