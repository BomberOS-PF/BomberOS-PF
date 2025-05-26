import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './FactorClimatico.css'

const FactorClimatico = () => {
  const [formData, setFormData] = useState({})
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Datos del formulario:', formData) // Preparado para backend
  }

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="form-abm p-4 shadow rounded w-100" style={{ maxWidth: '700px' }}>
        <h2 className="text-white text-center mb-4">Factores Climáticos</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="superficie" className="form-label">Superficie evacuada</label>
            <select className="form-select" id="superficie" onChange={handleChange} required>
              <option disabled selected>Seleccione una opción</option>
              <option>Menos de 100 m²</option>
              <option>100 - 500 m²</option>
              <option>500 - 1000 m²</option>
              <option>Más de 1000 m²</option>
            </select>
          </div>

          <div className="mb-3">
            <label htmlFor="personasEvacuadas" className="form-label">Cantidad de personas evacuadas</label>
            <input type="number" className="form-control" id="personasEvacuadas" onChange={handleChange} />
          </div>

          <h5 className="text-white mt-4">Personas damnificadas</h5>
          <div className="row mb-3">
            <div className="col">
              <label htmlFor="nombre" className="form-label">Nombre</label>
              <input type="text" className="form-control" id="nombre" onChange={handleChange} />
            </div>
            <div className="col">
              <label htmlFor="apellido" className="form-label">Apellido</label>
              <input type="text" className="form-control" id="apellido" onChange={handleChange} />
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="domicilio" className="form-label">Domicilio</label>
            <input type="text" className="form-control" id="domicilio" onChange={handleChange} />
          </div>

          <div className="row mb-3">
            <div className="col">
              <label htmlFor="telefono" className="form-label">Teléfono</label>
              <input type="tel" className="form-control" id="telefono" onChange={handleChange} />
            </div>
            <div className="col">
              <label htmlFor="dni" className="form-label">DNI</label>
              <input type="text" className="form-control" id="dni" onChange={handleChange} />
            </div>
          </div>

          <div className="mb-3 form-check">
            <input type="checkbox" className="form-check-input" id="fallecio" onChange={handleChange} />
            <label className="form-check-label" htmlFor="fallecio">¿Falleció?</label>
          </div>

          <div className="mb-3">
            <label htmlFor="detalle" className="form-label">Detalle de lo sucedido</label>
            <textarea className="form-control" id="detalle" rows="3" onChange={handleChange}></textarea>
          </div>

          <button type="submit" className="btn btn-danger w-100 mt-3">Finalizar carga</button>
          <button type="button" className="btn btn-secondary w-100 mt-2" onClick={() => navigate('/')}>Volver</button>
        </form>
      </div>
    </div>
  )
}

export default FactorClimatico
