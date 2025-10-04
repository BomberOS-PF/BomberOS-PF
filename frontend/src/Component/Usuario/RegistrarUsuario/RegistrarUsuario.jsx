import { useEffect, useState } from 'react'
import { API_URLS, apiRequest } from '../../../config/api'
import { Flame, AlertTriangle, FileText, User, Mail, Shield } from 'lucide-react'
import Select from 'react-select'
import { BackToMenuButton } from '../../Common/Button'

const RegistrarUsuario = ({ onVolver, usuario, ocultarTitulo = false, listaUsuarios = [] }) => {
  const [formData, setFormData] = useState({ username: '', password: '', email: '', idRol: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [passwordStrength, setPasswordStrength] = useState(null)

  const [roles, setRoles] = useState([])

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await apiRequest(API_URLS.roles.getAll)
        if (response.success) {
          setRoles(response.data)
        } else {
          console.error('Error al cargar roles:', response.message)
        }
      } catch (error) {
        console.error('Error al obtener roles:', error)
      }
    }

    fetchRoles()
  }, [])

  useEffect(() => {
    if (usuario) {
      setFormData({ username: usuario.username || '', password: '', email: usuario.email || '', rol: usuario.rol || '' })
    }
  }, [usuario])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

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
    setFormData(prev => ({ ...prev, [id]: value }))
    if (id === 'username' && messageType === 'error') setMessage('')
    if (id === 'password') validatePasswordStrength(value)

    // Validar fortaleza de contraseña en tiempo real
    if (id === 'password') {
      validatePasswordStrength(value)
    }
  }

  const handleEmailBlur = () => {
    if (!formData.email) return

    // Solo validar si se está editando un usuario
    if (usuario) {
      const emailRepetido = listaUsuarios.find(u =>
        u.email === formData.email && u.id !== usuario.id
      )

      if (emailRepetido) {
        setMessage('❌ Correo electrónico ya registrado')
        setMessageType('error')
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (usuario) {
        const emailRepetido = listaUsuarios.find(u =>
          u.email === formData.email && u.id !== usuario.id
        )

        if (emailRepetido) {
          setMessage('❌ Correo electrónico ya registrado')
          setMessageType('error')
          setLoading(false)
          return
        }
        // Actualizar usuario existente
        const updateData = {
          email: formData.email,
          idRol: parseInt(formData.idRol),
          ...(formData.password && { password: formData.password })
        }

        const response = await apiRequest(API_URLS.usuarios.update(usuario.id), {
          method: 'PUT',
          body: JSON.stringify(updateData)
        })

        if (response.success) {
          setMessage('✅ Usuario actualizado correctamente')
          setMessageType('success')
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
        } else {
          throw new Error(response.message || 'Error al crear usuario')
        }
      }

    } catch (error) {
      setMessage(`Error: ${error.message}`)
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='container-fluid py-5'>
      <div className='text-center mb-4'>
        <div className='d-flex justify-content-center align-items-center gap-3 mb-3'>
          <div className='bg-danger p-3 rounded-circle'>
            <Flame size={32} color="white" />
          </div>
          <h1 className="fw-bold text-white fs-3 mb-0">Alta de Usuario</h1>
        </div>
        <span className="badge bg-danger-subtle text-danger">
          <AlertTriangle className="me-2" /> Sistema de Gestión de Usuarios - Cuartel de Bomberos
        </span>
      </div>

      <div className="card edge-to-edge shadow-sm border-0 bg-white bg-opacity-1 backdrop-blur-sm">
        <div className="card-header bg-danger text-white d-flex align-items-center gap-2 py-4">
          <FileText />
          <strong>Registrar Usuario</strong>
        </div>

        <div className="card-body">
          {message && (
            <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-danger'} mb-3`}>
              {message}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="row mb-3">
              <div className="col-md-6 py-4">
                <label htmlFor="username" label className="form-label text-dark d-flex align-items-center gap-2">
                  <User className="text-danger" />
                  Nombre de Usuario
                </label>
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

              <div className="col-md-6 py-4">
                <label htmlFor="password" className="text-dark form-label d-flex align-items-center gap-2">
                  <Shield className="text-warning" />Contraseña {usuario && '(nueva)'}</label>
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
                          className={`progress-bar ${passwordStrength.score <= 1 ? 'bg-danger' :
                            passwordStrength.score <= 3 ? 'bg-warning' : 'bg-success'
                            }`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        ></div>
                      </div>
                      <small className={`ms-2 ${passwordStrength.score <= 1 ? 'text-danger' :
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

              <div className="col-md-6 py-4">
                <label htmlFor="email" className="text-dark form-label d-flex align-items-center gap-2">
                  <Mail className="text-primary" />Correo electrónico</label>
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

              <div className="col-md-6 py-4">
                <label htmlFor="rol" className="text-dark form-label d-flex align-items-center gap-2">
                  <Shield className="text-primary"
                  />Rol
                </label>
                {/* Campo oculto para validación HTML5 */}
                <input
                  type="text"
                  value={formData.rol || ''}
                  required
                  style={{ position: 'absolute', opacity: 0, height: 0, pointerEvents: 'none' }}
                  tabIndex={-1}
                  onChange={() => {}}
                />
                <Select
                  classNamePrefix="rs"
                  inputId="rol"
                  placeholder="Seleccione un rol"
                  isClearable
                  isDisabled={loading || roles.length === 0}
                  options={roles.map((rol) => ({
                    value: String(rol.idRol),
                    label: rol.nombreRol
                  }))}
                  value={
                    formData.rol
                      ? {
                        value: String(formData.rol),
                        label: roles.find(r => String(r.idRol) === String(formData.rol))?.nombreRol || ''
                      }
                      : null
                  }
                  onChange={(opt) =>
                    setFormData(prev => ({ ...prev, rol: opt ? opt.value : '' }))
                  }
                />
              </div>
              
              <div className="d-flex justify-content-center align-items-center gap-3">
                {onVolver && (
                  <BackToMenuButton onClick={onVolver} />
                )}
                <button type="submit" className="btn btn-accept btn-lg btn-medium" disabled={loading}>
                  {loading
                    ? usuario ? 'Actualizando...' : 'Registrando...'
                    : usuario ? 'Actualizar Usuario' : 'Registrar Usuario'}
                </button>
              </div>
            </div>
          </form>
        </div>

      </div>

    </div>
  )
}

export default RegistrarUsuario
