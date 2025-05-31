import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './RegistrarUsuario.css'

const RegistrarUsuario = () => {
  const [formData, setFormData] = useState({
    user: '',
    pass: ''
  })

  const navigate = useNavigate()

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const response = await fetch('http://localhost:3000/registrar-usuario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok && data.success) {
        alert('Usuario registrado con éxito')
        navigate('/') // o donde quieras redirigir
      } else {
        alert(data.error || 'Error al registrar usuario')
      }
    } catch (error) {
      console.error('Error al registrar usuario:', error)
      alert('Error del servidor. Intenta más tarde.')
    }
  }

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="form-usuario p-4 shadow rounded w-100" style={{ maxWidth: '500px' }}>
        <h2 className="text-white text-center mb-4">Registrar nuevo usuario</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="usuario" className="form-label">Nombre de usuario</label>
            <input
              type="text"
              className="form-control"
              id="user"
              required
              value={formData.usuario}
              onChange={handleChange}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="contrasena" className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-control"
              id="pass"
              required
              value={formData.contrasena}
              onChange={handleChange}
            />
          </div>
          <button type="submit" className="btn btn-danger w-100 mb-3">Registrar Usuario</button>
          <button type="button" className="btn btn-secondary w-100" onClick={() => navigate('/')}>Volver al menú</button>
        </form>
      </div>
    </div>
  )
}

export default RegistrarUsuario
