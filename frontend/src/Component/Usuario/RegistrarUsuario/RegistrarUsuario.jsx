import { useEffect, useState } from 'react'
import './RegistrarUsuario.css'

const RegistrarUsuario = ({ onVolver, usuario }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    rol: ''
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  useEffect(() => {
    if (usuario) {
      setFormData({
        username: usuario.username || '',
        password: '',
        email: usuario.email || '',
        rol: usuario.rol || ''
      })
    }
  }, [usuario])

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    setTimeout(() => {
      setMessage(usuario ? '¡Usuario actualizado!' : '¡Usuario registrado!')
      setMessageType('success')
      setLoading(false)

      if (!usuario) {
        setFormData({
          username: '',
          password: '',
          email: '',
          rol: ''
        })
      }
    }, 1500)
  }

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="form-incidente p-4 shadow rounded">
        <h2 className="text-white text-center mb-4">
          {usuario ? 'Editar Usuario' : 'Registrar Usuario'}
        </h2>

        {message && (
          <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-danger'} mt-3`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Usuario - Contraseña - Email */}
          <div className="row mb-3">
            <div className="col-md-4">
              <label htmlFor="username" className="form-label">Nombre de usuario</label>
              <input
                type="text"
                className="form-control"
                id="username"
                value={formData.username}
                required
                onChange={handleChange}
                disabled={!!usuario}
              />
            </div>
            <div className="col-md-4">
              <label htmlFor="password" className="form-label">Contraseña {usuario && '(nueva)'}</label>
              <input
                type="password"
                className="form-control"
                id="password"
                value={formData.password}
                onChange={handleChange}
                required={!usuario}
                placeholder={usuario ? 'Dejar en blanco para no cambiar' : ''}
              />
            </div>
            <div className="col-md-4">
              <label htmlFor="email" className="form-label">Correo electrónico</label>
              <input
                type="email"
                className="form-control"
                id="email"
                value={formData.email}
                required
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Rol */}
          <div className="mb-4">
            <label htmlFor="rol" className="form-label">Rol</label>
            <select
              className="form-select"
              id="rol"
              value={formData.rol}
              required
              onChange={handleChange}
            >
              <option value="">Seleccione un rol</option>
              <option value="administrador">Administrador</option>
              <option value="jefe_cuartel">Jefe de cuartel</option>
              <option value="bombero">Bombero</option>
            </select>
          </div>

          <button type="submit" className="btn btn-danger w-100" disabled={loading}>
            {loading
              ? usuario ? 'Actualizando...' : 'Registrando...'
              : usuario ? 'Actualizar Usuario' : 'Registrar Usuario'}
          </button>

          {onVolver && (
            <button type="button" className="btn btn-secondary w-100 mt-2" onClick={onVolver} disabled={loading}>
              Volver
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

export default RegistrarUsuario
