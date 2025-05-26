import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './CargarIncidente.css'

const CargarIncidente = () => {
  const [formData, setFormData] = useState({})
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log(formData)
  }

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="form-incidente p-4 shadow rounded w-100" style={{ maxWidth: '700px' }}>
        <h2 className="text-white text-center mb-4">Cargar Incidente</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="persona" className="form-label">Persona que carga</label>
            <select className="form-select" id="persona" required onChange={handleChange}>
              <option disabled selected>Seleccione persona</option>
              <option>Jefe</option>
              <option>Oficial</option>
              <option>Subteniente</option>
              <option>Sargento</option>
              <option>Cabo</option>
              <option>Bombero</option>
              <option>Aspirante</option>
            </select>
          </div>

          <div className="mb-3">
            <label htmlFor="tipoSiniestro" className="form-label">Tipo de Siniestro</label>
            <select className="form-select" id="tipoSiniestro" required onChange={handleChange}>
              <option disabled selected>Seleccione tipo</option>
              <option>Accidente</option>
              <option>Factores Climáticos</option>
              <option>Incendio Estructural</option>
              <option>Material Peligroso</option>
              <option>Rescate</option>
              <option>Servicios Especiales / Otros</option>
            </select>
          </div>

          <div className="mb-3">
            <label htmlFor="fechaHora" className="form-label">Fecha y Hora</label>
            <input type="datetime-local" className="form-control" id="fechaHora" required onChange={handleChange} />
          </div>

          <h5 className="text-white mb-3">Datos del denunciante</h5>
          <div className="row mb-3">
            <div className="col">
              <label htmlFor="nombreDenunciante" className="form-label">Nombre</label>
              <input type="text" className="form-control" id="nombreDenunciante" required onChange={handleChange} />
            </div>
            <div className="col">
              <label htmlFor="apellidoDenunciante" className="form-label">Apellido</label>
              <input type="text" className="form-control" id="apellidoDenunciante" required onChange={handleChange} />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col">
              <label htmlFor="telefonoDenunciante" className="form-label">Teléfono</label>
              <input type="tel" className="form-control" id="telefonoDenunciante" required onChange={handleChange} />
            </div>
            <div className="col">
              <label htmlFor="dniDenunciante" className="form-label">DNI</label>
              <input type="text" className="form-control" id="dniDenunciante" required onChange={handleChange} />
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="localizacion" className="form-label">Localización</label>
            <select className="form-select" id="localizacion" required onChange={handleChange}>
              <option disabled selected>Seleccione localización</option>
              <option>Despeñaderos</option>
              <option>Zona Rural</option>
              <option>Zona Urbana</option>
              <option>Zona Industrial</option>
              <option>Zona Costera</option>
              <option>Otros</option>
            </select>
          </div>

          <div className="mb-3">
            <label htmlFor="lugar" className="form-label">Calle y/o Kilometraje o Lugar</label>
            <input type="text" className="form-control" id="lugar" placeholder="Ej: Av. Siempre Viva 742, km 12" required onChange={handleChange} />
          </div>

          <button type="submit" className="btn btn-danger w-100">Cargar Incidente</button>
          <button type="button" className="btn btn-secondary w-100 mt-2" onClick={() => navigate('/')}>Volver</button>
        </form>
      </div>
    </div>
  )
}

export default CargarIncidente
