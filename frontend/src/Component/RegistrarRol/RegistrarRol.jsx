import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './RegistrarRol.css'

const RegistrarRol = () => {
  const [formData, setFormData] = useState({
    nombreRol: '',
    descripcionRol: ''
  })

  const navigate = useNavigate()

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
      <div className="form-rol p-4 shadow rounded w-100" style={{ maxWidth: '500px' }}>
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
          <button type="submit" className="btn btn-danger w-100 mb-3">Registrar Rol</button>
          <button type="button" className="btn btn-secondary w-100" onClick={() => navigate('/')}>Volver al menú</button>
        </form>
      </div>
    </div>
  )
}

export default RegistrarRol
