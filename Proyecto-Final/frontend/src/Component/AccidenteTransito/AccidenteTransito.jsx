import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './AccidenteTransito.css'

const AccidenteTransito = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({})

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Datos enviados:', formData)
    // Aquí iría la lógica de envío al backend
  }

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="form-abm p-4 shadow rounded w-100" style={{ maxWidth: '700px' }}>
        <h2 className="text-white text-center mb-4">Accidente de Tránsito</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="causaAccidente" className="form-label">Causa del accidente</label>
            <select className="form-select" id="causaAccidente" onChange={handleChange}>
              <option disabled selected>Seleccione causa</option>
              <option>Desperfecto mecánico</option>
              <option>Imprudencia</option>
              <option>Clima</option>
              <option>Otro</option>
            </select>
          </div>

          <h5 className="text-white mt-4">Vehículos involucrados</h5>
          <div className="row mb-3">
            <div className="col-md-4">
              <label className="form-label">Tipo</label>
              <input type="text" className="form-control" id="tipoVehiculo" onChange={handleChange} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Dominio</label>
              <input type="text" className="form-control" id="dominio" onChange={handleChange} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Cantidad</label>
              <input type="number" className="form-control" id="cantidadVehiculos" onChange={handleChange} />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col">
              <label className="form-label">Modelo</label>
              <input type="text" className="form-control" id="modelo" onChange={handleChange} />
            </div>
            <div className="col">
              <label className="form-label">Año</label>
              <input type="number" className="form-control" id="anio" onChange={handleChange} />
            </div>
            <div className="col">
              <label className="form-label">Aseguradora</label>
              <input type="text" className="form-control" id="aseguradora" onChange={handleChange} />
            </div>
            <div className="col">
              <label className="form-label">Póliza</label>
              <input type="text" className="form-control" id="poliza" onChange={handleChange} />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Detalle de lo sucedido</label>
            <textarea className="form-control" rows="3" id="detalle" onChange={handleChange}></textarea>
          </div>

          <h5 className="text-white mt-4">Personas damnificadas</h5>
          <div className="row mb-3">
            <div className="col">
              <label className="form-label">Nombre</label>
              <input type="text" className="form-control" id="nombreDamnificado" onChange={handleChange} />
            </div>
            <div className="col">
              <label className="form-label">Apellido</label>
              <input type="text" className="form-control" id="apellidoDamnificado" onChange={handleChange} />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Domicilio</label>
            <input type="text" className="form-control" id="domicilioDamnificado" onChange={handleChange} />
          </div>

          <div className="row mb-3">
            <div className="col">
              <label className="form-label">Teléfono</label>
              <input type="tel" className="form-control" id="telefonoDamnificado" onChange={handleChange} />
            </div>
            <div className="col">
              <label className="form-label">DNI</label>
              <input type="text" className="form-control" id="dniDamnificado" onChange={handleChange} />
            </div>
          </div>

          <div className="mb-3 form-check">
            <input type="checkbox" className="form-check-input" id="fallecio" onChange={handleChange} />
            <label className="form-check-label" htmlFor="fallecio">¿Falleció?</label>
          </div>

          <button type="submit" className="btn btn-danger w-100 mt-3">Finalizar carga</button>
          <button type="button" className="btn btn-secondary w-100 mt-2" onClick={() => navigate('/')}>Volver</button>
        </form>
      </div>
    </div>
  )
}

export default AccidenteTransito
