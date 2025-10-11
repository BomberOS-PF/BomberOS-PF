import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
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
    } catch { }
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
  }

  const showLoading = (title = 'Ingresando...') => {
    Swal.fire({
      title,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading()
    })
  }

  const showError = (message) => {
    Swal.fire({
      icon: 'error',
      title: 'No pudimos iniciar sesión',
      text: message || 'Usuario o contraseña incorrectos',
      confirmButtonText: 'Entendido'
    })
  }

  const showWelcome = (nombre, apellido) => {
    const texto = nombre || apellido ? `Bienvenido ${nombre ?? ''} ${apellido ?? ''}`.trim() : 'Bienvenido'
    Swal.fire({
      toast: true,
      icon: 'success',
      title: texto,
      position: 'top-end',
      showConfirmButton: false,
      timer: 1800,
      timerProgressBar: true
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const u = usuario.trim()
    if (!u || !password) {
      showError('Completá usuario y contraseña')
      return
    }

    setLoading(true)
    showLoading()

    try {
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

      Swal.close()
      showWelcome(sesion.nombre, sesion.apellido)
      navigate('/')
    } catch (err) {
      Swal.close()
      showError(err?.message)
      resetForm()
    } finally {
      setLoading(false)
    }
  }

  const irARecuperar = async () => {
    const res = await Swal.fire({
      icon: 'question',
      title: '¿Recuperar contraseña?',
      text: 'Te vamos a llevar a la pantalla de recuperación',
      showCancelButton: true,
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar'
    })
    if (res.isConfirmed) navigate('/recuperar-clave')
  }

  return (
    <div className="container-fluid d-flex justify-content-center align-items-center min-vh-100 login-bg">
      <div className="form-login p-4 shadow rounded text-center w-100">
        <img src="/img/logo-bomberos.png" alt="Logo BomberOS" className="logo-bomberos mb-3" />
        <h2 className="text-black mb-4">Iniciar Sesión</h2>

        <form onSubmit={handleSubmit} className='at-form'>
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
              autoComplete='username'
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
              autoComplete='current-password'
            />
          </div>

          <div className="mb-3 text-start">
            <button
              type="button"
              className="btn btn-link recuperar-link p-0"
              onClick={irARecuperar}
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
