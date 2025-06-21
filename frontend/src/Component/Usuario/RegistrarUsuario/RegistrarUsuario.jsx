import { useEffect, useState } from 'react'
import { API_URLS, apiRequest } from '../../../config/api'
import './RegistrarUsuario.css'
import '../../DisenioFormulario/DisenioFormulario.css'

const RegistrarUsuario = ({ onVolver, usuario, ocultarTitulo = false }) => {
  const [formData, setFormData] = useState({
    usuario: '',
    contrasena: '',
    email: '',
    idRol: '',
    dni: ''
  })

  useEffect(() => {
    const fetchBomberos = async () => {
      try {
        const res = await fetch(API_URLS.bomberos.getAll)
        const data = await res.json()
        setBomberos(data.data)
      } catch (error) {
        console.error('Error al obtener bomberos:', error)
      }
    }

    const fetchRoles = async () => {
      try {
        const res = await fetch(API_URLS.roles.getAll)
        const data = await res.json()
        setRoles(data.data)
      } catch (error) {
        console.error('Error al obtener roles:', error)
      }
    }

    fetchBomberos()
    fetchRoles()
  }, [])

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      await apiRequest(API_URLS.usuarios.create, {
        method: 'POST',
        body: JSON.stringify(formData)
      })
      alert('Usuario registrado correctamente')
      onVolver()
    } catch (error) {
      alert('Error al registrar usuario')
      console.error(error)
    }
  }

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="formulario-consistente">
        {!ocultarTitulo && (
          <h2 className="text-white text-center mb-4">
            {usuario ? 'Editar Usuario' : 'Registrar Usuario'}
          </h2>
        )}

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
                disabled={!!usuario || loading}
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
                disabled={loading}
                placeholder={usuario ? 'Dejar en blanco para no cambiar' : ''}
              />
              
              {/* Indicador de fortaleza de contraseña */}
              {passwordStrength && formData.password && (
                <div className="mt-2">
                  <div className="d-flex align-items-center mb-1">
                    <small className="text-white me-2">Fortaleza:</small>
                    <div className="progress flex-grow-1" style={{ height: '6px' }}>
                      <div 
                        className={`progress-bar ${
                          passwordStrength.score <= 1 ? 'bg-danger' :
                          passwordStrength.score <= 3 ? 'bg-warning' : 'bg-success'
                        }`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      ></div>
                    </div>
                    <small className={`ms-2 ${
                      passwordStrength.score <= 1 ? 'text-danger' :
                      passwordStrength.score <= 3 ? 'text-warning' : 'text-success'
                    }`}>
                      {passwordStrength.score <= 1 ? 'Débil' :
                       passwordStrength.score <= 3 ? 'Media' : 'Fuerte'}
                    </small>
                  </div>
                  
                  {passwordStrength.errors.length > 0 && (
                    <div className="text-danger">
                      <small>❌ {passwordStrength.errors.join(', ')}</small>
                    </div>
                  )}
                  
                  {passwordStrength.suggestions.length > 0 && passwordStrength.errors.length === 0 && (
                    <div className="text-warning">
                      <small>💡 {passwordStrength.suggestions.join(', ')}</small>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="col-md-4">
              <label htmlFor="email" className="form-label">Correo electrónico</label>
              <input
                type="email"
                className="form-control"
                id="email"
                value={formData.email}
                required
                disabled={loading}
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
              disabled={loading}
              onChange={handleChange}
            >
              <option value="">Seleccione un rol</option>
              <option value="1">Administrador</option>
              <option value="2">Bombero</option>
            </select>
          </div>

          <div className="botones-accion">
            <button type="submit" className="btn btn-danger" disabled={loading}>
              {loading
                ? usuario ? 'Actualizando...' : 'Registrando...'
                : usuario ? 'Actualizar Usuario' : 'Registrar Usuario'}
            </button>

            {onVolver && (
              <button type="button" className="btn btn-secondary" onClick={onVolver} disabled={loading}>
                Volver
              </button>
            )}
          </div>
        </form>

        <div className="mt-3 text-muted">
          <small>
            <strong>Nota:</strong> Los usuarios se guardan en la base de datos del servidor.
            Las contraseñas se almacenan de forma segura usando encriptación bcrypt.
          </small>
        </div>

        <div className="mb-3">
          <label className="form-label">Usuario:</label>
          <input
            type="text"
            className="form-control"
            name="usuario"
            value={formData.usuario}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Contraseña:</label>
          <input
            type="password"
            className="form-control"
            name="contrasena"
            value={formData.contrasena}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Email:</label>
          <input
            type="email"
            className="form-control"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-4">
          <label className="form-label">Rol:</label>
          <select
            className="form-select"
            name="idRol"
            value={formData.idRol}
            onChange={handleChange}
            required
          >
            <option value="">-- Selecciona un rol --</option>
            {roles.map(r => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="d-flex justify-content-between">
          <button type="submit" className="btn btn-danger">
            Registrar
          </button>
          <button type="button" className="btn btn-secondary" onClick={onVolver}>
            Volver
          </button>
        </div>
      </div>
    </div>
  )
}

export default RegistrarUsuario
