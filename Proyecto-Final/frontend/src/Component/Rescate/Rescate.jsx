import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Rescate.css'

const Rescate = () => {
  const navigate = useNavigate()
  const [mostrarOtroLugar, setMostrarOtroLugar] = useState(false)

  const handleLugarChange = (e) => {
    setMostrarOtroLugar(e.target.value === 'Otro')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Lógica para enviar los datos
  }

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="form-abm p-4 shadow rounded w-100" style={{ maxWidth: '800px' }}>
        <h2 className="text-white text-center mb-4">Rescate</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label text-white">Lugar</label>
            <select className="form-select" id="lugar" onChange={handleLugarChange}>
              <option selected disabled>Seleccione</option>
              <option>Arroyo</option>
              <option>Lago</option>
              <option>Bar</option>
              <option>Montaña</option>
              <option>Río</option>
              <option>Restaurant-Comedor</option>
              <option>Otro</option>
            </select>
          </div>

          {mostrarOtroLugar && (
            <div className="mb-3">
              <label className="form-label text-white">Describa el otro tipo de lugar</label>
              <input type="text" className="form-control" placeholder="Especifique" />
            </div>
          )}

          <div className="mb-3">
            <label className="form-label text-white">Detalle de lo sucedido</label>
            <textarea className="form-control" rows="3"></textarea>
          </div>

          <h5 className="text-white mt-4">Personas damnificadas</h5>
          <div className="row mb-3">
            <div className="col">
              <label className="form-label text-white">Nombre</label>
              <input type="text" className="form-control" />
            </div>
            <div className="col">
              <label className="form-label text-white">Apellido</label>
              <input type="text" className="form-control" />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label text-white">Domicilio</label>
            <input type="text" className="form-control" />
          </div>

          <div className="row mb-3">
            <div className="col">
              <label className="form-label text-white">Teléfono</label>
              <input type="tel" className="form-control" />
            </div>
            <div className="col">
              <label className="form-label text-white">DNI</label>
              <input type="text" className="form-control" />
            </div>
          </div>

          <div className="mb-3 form-check">
            <input type="checkbox" className="form-check-input" id="fallecio" />
            <label className="form-check-label text-white" htmlFor="fallecio">¿Falleció?</label>
          </div>

          <button type="submit" className="btn btn-danger w-100 mt-3">Finalizar carga</button>
          <button type="button" className="btn btn-secondary w-100 mt-2" onClick={() => navigate('/')}>Volver al menú</button>
        </form>
      </div>
    </div>
  )
}

export default Rescate
