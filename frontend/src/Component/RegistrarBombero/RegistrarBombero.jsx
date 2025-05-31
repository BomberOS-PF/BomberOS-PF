import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../DisenioFormulario/DisenioFormulario.css'
import './RegistrarBombero.css'

const RegistrarBombero = () => {
  const [formData, setFormData] = useState({})
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { id, value, type, checked, files } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log(formData)
  }

  return (
    <div className="registrar-bombero-wrapper d-flex justify-content-center align-items-start min-vh-100 py-5">
      <div className="form-abm w-100 shadow rounded p-4">
        <div className="form-header">
          <img src="/img/logo-formularios.png" alt="Logo" />
          <h2>Alta de Bombero</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="row mb-3">
            <div className="col">
              <label htmlFor="nombre" className="form-label text-black">Nombre</label>
              <input type="text" className="form-control" id="nombre" required onChange={handleChange} />
            </div>
            <div className="col">
              <label htmlFor="apellido" className="form-label text-black">Apellido</label>
              <input type="text" className="form-control" id="apellido" required onChange={handleChange} />
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="domicilio" className="form-label text-black">Domicilio</label>
            <input type="text" className="form-control" id="domicilio" required onChange={handleChange} />
          </div>

          <div className="mb-3">
            <label htmlFor="email" className="form-label text-black">Correo electrónico</label>
            <input type="email" className="form-control" id="email" required onChange={handleChange} />
          </div>

          <div className="mb-3">
            <label htmlFor="telefono" className="form-label text-black">Número de teléfono</label>
            <input type="tel" className="form-control" id="telefono" required onChange={handleChange} />
          </div>

          <div className="mb-3">
            <label htmlFor="legajo" className="form-label text-black">Legajo (opcional)</label>
            <input type="text" className="form-control" id="legajo" onChange={handleChange} />
          </div>

          <div className="mb-3">
            <label htmlFor="antiguedad" className="form-label text-black">Antigüedad (años)</label>
            <input type="number" className="form-control" id="antiguedad" min="0" onChange={handleChange} />
          </div>

          <div className="mb-3">
            <label htmlFor="rango" className="form-label text-black">Rango</label>
            <select className="form-select" id="rango" required onChange={handleChange}>
              <option disabled selected>Seleccione un rango</option>
              <option>Bombero</option>
              <option>Cabo</option>
              <option>Sargento</option>
              <option>Subteniente</option>
              <option>Teniente</option>
              <option>Oficial</option>
            </select>
          </div>

          <div className="form-check form-switch mb-3">
            <input className="form-check-input" type="checkbox" id="esPlan" onChange={handleChange} />
            <label className="form-check-label" htmlFor="esPlan">Es del plan (guardias pagas)</label>
          </div>

          <div className="mb-3">
            <label htmlFor="fichaMedica" className="form-label text-black">Ficha médica (PDF)</label>
            <input className="form-control" type="file" id="fichaMedica" accept="application/pdf" onChange={handleChange} />
          </div>

          <div className="mb-3">
            <label htmlFor="fechaFicha" className="form-label text-black">Fecha de carga de ficha médica</label>
            <input className="form-control" type="date" id="fechaFicha" onChange={handleChange} />
          </div>

          <div className="form-check form-switch mb-3">
            <input className="form-check-input" type="checkbox" id="aptoPsico" onChange={handleChange} />
            <label className="form-check-label" htmlFor="aptoPsico">Apto psicológico</label>
          </div>

          <div className="mb-4">
            <label htmlFor="grupoSanguineo" className="form-label text-black">Grupo sanguíneo</label>
            <select className="form-select" id="grupoSanguineo" required onChange={handleChange}>
              <option disabled selected>Seleccione</option>
              <option>A+</option>
              <option>A-</option>
              <option>B+</option>
              <option>B-</option>
              <option>AB+</option>
              <option>AB-</option>
              <option>O+</option>
              <option>O-</option>
            </select>
          </div>

          <button type="submit" className="btn btn-danger w-100">Registrar bombero</button>
          <button type="button" className="btn btn-secondary w-100 mt-2" onClick={() => navigate('/')}>Volver</button>
        </form>
      </div>
    </div>
  )
}

export default RegistrarBombero
