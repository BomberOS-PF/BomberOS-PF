import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import RecuperarClave from '../RecuperarClave/RecuperarClave'
import './Login.css'
// import '../DisenioFormulario/DisenioFormulario.css'

const Login = ({ setUser, user }) => {
  const [usuario, setUsuario] = useState('')
  const [password, setpassword] = useState('')
  const [mostrarRecuperar, setMostrarRecuperar] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const savedUser = localStorage.getItem('usuario')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
      navigate('/')
    }
  }, [])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('')
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [error])

  const resetForm = () => {
    setUsuario('')
    setpassword('')
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('http://localhost:3000/api/usuarios/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password })
      })

      const data = await res.json()
      
      if (res.ok && data.success) {
        const sesion = {
          id: data.user.id,
          usuario: data.user.usuario,
          rol: data.user.rol,
          nombre: data.user.nombre,
          apellido: data.user.apellido,
          dni: data.user.dni,
          email: data.user.email,
          timestamp: new Date().toISOString()
        }

        setUser(sesion)
        localStorage.setItem('usuario', JSON.stringify(sesion))

        const stored = JSON.parse(localStorage.getItem('usuario'))

        resetForm()
        navigate('/')
      } else {
        setError(data.message || 'Usuario o contraseña incorrectos')
        setUsuario('')
        setpassword('')
      }
    } catch (error) {
      setError('Error en el sistema. Intenta más tarde.')
      resetForm()
    } finally {
      setLoading(false)
    }
  }

  if (mostrarRecuperar) {
    return (
      <RecuperarClave
        onVolver={() => {
          resetForm()
          setMostrarRecuperar(false)
        }}
      />
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
            <label htmlFor="password" className="text-black form-label">Contraseña</label>
            <input
              type="password"
              className="form-control"
              id="password"
              placeholder="Ingrese su contraseña"
              required
              value={password}
              onChange={(e) => setpassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="mb-3 text-start">
            <button
              type="button"
              className="btn btn-link recuperar-link p-0"
              onClick={() => setMostrarRecuperar(true)}
              disabled={loading}>
              Recuperar contraseña
            </button>
          </div>
          <button type="submit" className="btn btn-danger w-100" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
