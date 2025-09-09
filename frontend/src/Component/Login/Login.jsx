import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'
import { API_URLS, apiRequest } from '../../config/api'

const Login = ({ setUser, user }) => {
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('usuario')
      if (savedUser) {
        setUser(JSON.parse(savedUser))
        navigate('/')
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 2000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const resetForm = () => {
    setUsuario('')
    setPassword('')
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Enviamos ambas convenciones por si el backend espera distinto
      const resp = await apiRequest(API_URLS.usuarios.authenticate, {
        method: 'POST',
        body: JSON.stringify({
          username: usuario.trim(),
          password,
          usuario: usuario.trim(),
          contrasena: password
        })
      })

      const ok = resp?.success ?? true
      const userPayload = resp?.data?.user || resp?.user || resp?.data || null

      if (!ok || !userPayload) {
        throw new Error(resp?.message || resp?.error || 'Usuario o contraseña incorrectos')
      }

      const sesion = {
        id: userPayload.id,
        usuario: userPayload.usuario ?? userPayload.username ?? usuario.trim(),
        rol: userPayload.rol,
        nombre: userPayload.nombre,
        apellido: userPayload.apellido,
        dni: userPayload.dni,
        email: userPayload.email,
        timestamp: new Date().toISOString()
      }

      setUser(sesion)
      localStorage.setItem('usuario', JSON.stringify(sesion))
      resetForm()
      navigate('/')
    } catch (err) {
      setError(err.message || 'Error en el sistema. Intenta más tarde.')
      resetForm()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container-fluid d-flex justify-content-center align-items-center min-vh-100 login-bg">
      <div className="form-login p-4 shadow rounded text-center w-100">
        <img src="/img/logo-bomberos.png" alt="Logo BomberOS" className="logo-bomberos mb-3" />
        <h2 className="text-black mb-4">Iniciar Sesión</h2>

        {error && <div className="alert alert-danger mb-3">{error}</div>}

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
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="mb-3 text-start">
            <button
              type="button"
              className="btn btn-link recuperar-link p-0"
              onClick={() => navigate('/recuperar-clave')}
              disabled={loading}
            >
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
