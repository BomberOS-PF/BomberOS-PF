import { useState } from 'react'
import './RegistrarRol.css'
import '../DisenioFormulario/DisenioFormulario.css'

const RegistrarRol = ({ onVolver }) => {
  const [formData, setFormData] = useState({
    nombreRol: '',
    descripcionRol: ''
  })

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Rol enviado:', formData) // Preparado para backend
  }

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="formulario-consistente" style={{ maxWidth: '500px' }}>
        <h2 className="text-center mb-4">Registrar Nuevo Rol</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="nombreRol" className="form-label">Nombre del Rol</label>
            <input
              type="text"
              className="form-control"
              id="nombreRol"
              required
              value={formData.nombreRol}
              onChange={handleChange}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="descripcionRol" className="form-label">Descripción (opcional)</label>
            <textarea
              className="form-control"
              id="descripcionRol"
              rows="3"
              value={formData.descripcionRol}
              onChange={handleChange}
            />
          </div>
          <div className="botones-accion">
            <button type="submit" className="btn btn-danger">Registrar Rol</button>
            <button type="button" className="btn btn-secondary" onClick={onVolver}>Volver</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RegistrarRol
