import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import RecuperarClave from '../RecuperarClave/RecuperarClave'
import './Login.css'

const Login = ({ setUser, user }) => {
  const [usuario, setUsuario] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [mostrarRecuperar, setMostrarRecuperar] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/')
  }, [user])

  const resetForm = () => {
    setUsuario('')
    setContrasena('')
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    // Simulación de autenticación local (sin backend)
    // En un entorno real, esto se conectaría al backend de autenticación
    try {
      // Credenciales de prueba
      const credencialesValidas = [
        { usuario: 'admin', contrasena: 'admin123', rol: 'administrador' },
        { usuario: 'jefe', contrasena: 'jefe123', rol: 'jefe_cuartel' },
        { usuario: 'bombero', contrasena: 'bombero123', rol: 'bombero' }
      ]

      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 1000))

      const credencial = credencialesValidas.find(
        c => c.usuario === usuario && c.contrasena === contrasena
      )

      if (credencial) {
        setUser({
          user: credencial.usuario,
          rol: credencial.rol,
          timestamp: new Date().toISOString()
        })
        resetForm()
        navigate('/')
      } else {
        setError('Usuario o contraseña incorrectos')
        resetForm()
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error)
      setError('Error en el sistema. Intenta más tarde.')
      resetForm()
    } finally {
      setLoading(false)
    }
  }

  if (mostrarRecuperar) {
    return (
      <RecuperarClave volver={() => {
        resetForm()
        setMostrarRecuperar(false)
      }} />
    )
  }

  return (
    <div className="container-fluid d-flex justify-content-center align-items-center min-vh-100 login-bg">
      <div className="form-login p-4 shadow rounded text-center w-100">
        <img
          src="/img/logo-bomberos.png"
          alt="Logo BomberOS"
          className="logo-bomberos mb-3"
        />
        <h2 className="text-black mb-4">Iniciar Sesión</h2>
        
        {error && (
          <div className="alert alert-danger mb-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3 text-start">
            <label htmlFor="usuario" className="text-black form-label">Usuario</label>
            <input
              type="text"
              className="form-control"
              id="usuario"
              placeholder="Ingrese su usuario"
              required
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="mb-3 text-start">
            <label htmlFor="contrasena" className="text-black form-label">Contraseña</label>
            <input
              type="password"
              className="form-control"
              id="contrasena"
              placeholder="Ingrese su contraseña"
              required
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="mb-3 text-start">
            <button
              type="button"
              className="btn btn-link recuperar-link p-0"
              onClick={() => navigate('/recuperar-clave')}
              disabled={loading}>
              Recuperar contraseña
            </button>
          </div>
          <button type="submit" className="btn btn-danger w-100" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className="mt-4 text-muted">
          <small>
            <strong>Usuarios de prueba:</strong><br/>
            admin/admin123 | jefe/jefe123 | bombero/bombero123
          </small>
        </div>
      </div>
    </div>
  )
}

export default Login
