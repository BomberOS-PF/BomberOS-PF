import { useEffect, useState } from 'react'
import { API_URLS, apiRequest } from '../../../config/api'
import '../../DisenioFormulario/DisenioFormulario.css'

const RegistrarUsuario = ({ onVolver, usuario, ocultarTitulo = false }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    idRol: ''
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [passwordStrength, setPasswordStrength] = useState(null)

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

  const validatePasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength(null)
      return
    }

    const result = {
      score: 0,
      errors: [],
      suggestions: [],
      isValid: false
    }

    // Longitud mínima
    if (password.length < 6) {
      result.errors.push('Debe tener al menos 6 caracteres')
    } else if (password.length >= 8) {
      result.score += 1
    }

    // Contiene números
    if (/\d/.test(password)) {
      result.score += 1
    } else {
      result.suggestions.push('Incluye al menos un número')
    }

    // Contiene letras minúsculas
    if (/[a-z]/.test(password)) {
      result.score += 1
    } else {
      result.suggestions.push('Incluye al menos una letra minúscula')
    }

    // Contiene letras mayúsculas
    if (/[A-Z]/.test(password)) {
      result.score += 1
    } else {
      result.suggestions.push('Incluye al menos una letra mayúscula')
    }

    // Contiene caracteres especiales
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      result.score += 1
    } else {
      result.suggestions.push('Incluye al menos un carácter especial')
    }

    // No contiene espacios
    if (/\s/.test(password)) {
      result.errors.push('No debe contener espacios')
    }

    result.isValid = result.errors.length === 0 && result.score >= 2
    setPasswordStrength(result)
  }

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))

    // Validar fortaleza de contraseña en tiempo real
    if (id === 'password') {
      validatePasswordStrength(value)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      console.log('📝 Enviando datos de usuario:', formData)

      if (usuario) {
        // Actualizar usuario existente
        const updateData = {
          email: formData.email,
          idRol: parseInt(formData.idRol),
          ...(formData.password && { password: formData.password })
        }

        console.log('🔄 Actualizando usuario:', { id: usuario.id, data: updateData })
        
        const response = await apiRequest(API_URLS.usuarios.update(usuario.id), {
          method: 'PUT',
          body: JSON.stringify(updateData)
        })

        if (response.success) {
          setMessage('✅ Usuario actualizado correctamente. Volviendo al listado...')
          setMessageType('success')
          
          setTimeout(() => {
            if (onVolver) onVolver()
          }, 1500)
        } else {
          throw new Error(response.message || 'Error al actualizar usuario')
        }
      } else {
        // Crear nuevo usuario
        const newUserData = {
          username: formData.username,
          password: formData.password,
          email: formData.email,
          idRol: parseInt(formData.rol, 10)
        }

        console.log('➕ Creando nuevo usuario:', newUserData)
        
        const response = await apiRequest(API_URLS.usuarios.create, {
          method: 'POST',
          body: JSON.stringify(newUserData)
        })

        if (response.success) {
          setMessage('✅ Usuario registrado correctamente!')
          setMessageType('success')
          
          // Limpiar formulario
          setFormData({
            username: '',
            password: '',
            email: '',
            rol: ''
          })

          setTimeout(() => {
            if (onVolver) onVolver()
          }, 1500)
        } else {
          throw new Error(response.message || 'Error al crear usuario')
        }
      }

    } catch (error) {
      console.error('❌ Error al procesar usuario:', error)
      setMessage(`Error: ${error.message}`)
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container d-flex justify-content-center align-items-center">
      <div className="formulario-consistente">
        {!ocultarTitulo && (
          <h2 className="text-black text-center mb-4">
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
              <label htmlFor="username" className="text-black form-label">Nombre de usuario</label>
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
              <label htmlFor="password" className="text-black form-label">Contraseña {usuario && '(nueva)'}</label>
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
                    <small className="text-black me-2">Fortaleza:</small>
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
              <label htmlFor="email" className="text-black form-label">Correo electrónico</label>
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
            <label htmlFor="rol" className="text-black form-label">Rol</label>
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
      </div>
    </div>
  )
}

export default RegistrarUsuario
