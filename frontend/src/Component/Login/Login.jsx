import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import './Login.css'
import { API_URLS, apiRequest } from '../../config/api'
import ParticlesBackground from '../ParticlesBackground/ParticlesBackground'

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
      if (!ok || !userPayload) throw new Error(resp?.message || resp?.error || 'Usuario o contraseña incorrectos')

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
    <div className='login-page d-flex justify-content-center align-items-center min-vh-100 position-relative'>
      <ParticlesBackground className='particles-fixed' variant='login' />

      {/* halos radiales decorativos */}
      <div className='login-bg-radial-1' />
      <div className='login-bg-radial-2' />
      <div className='login-bg-pattern' />

      <div>
        <div>
          <div className='login-card shadow-2xl'>
            {/* brillo superior fino */}
            <div className='login-card-topglow' />

            {/* logo con glow */}
            <div className='text-center mb-4'>
              <div className='logo-wrap'>
                <div className='logo-glow' />
                <img
                  src='/img/logo-bomberos.png'
                  alt='Logo BomberOS'
                  className='logo-bomberos animate-float'
                  loading='eager'
                />
              </div>
            </div>

            <div className='text-center mb-4'>
              <h2 className='login-title'>Iniciar Sesión</h2>
              <p className='login-subtitle'>Accede a tu cuenta</p>
            </div>

            <form onSubmit={handleSubmit} className='login-form'>
              <div className='mb-3 text-start'>
                <label htmlFor='usuario' className='form-label text-white-90'>Usuario</label>
                <div className='input-icon-left'>
                  <input
                    type='text'
                    className='form-control login-input ps-5'
                    id='usuario'
                    placeholder='Ingrese su usuario'
                    required
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    disabled={loading}
                    autoComplete='username'
                  />
                  <i className='bi bi-person input-icon' aria-hidden='true' />
                </div>
              </div>

              <div className='mb-2 text-start'>
                <label htmlFor='password' className='form-label text-white-90'>Contraseña</label>
                <div className='input-icon-left'>
                  <input
                    type='password'
                    className='form-control login-input ps-5'
                    id='password'
                    placeholder='Ingrese su contraseña'
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    autoComplete='current-password'
                  />
                  <i className='bi bi-lock input-icon' aria-hidden='true' />
                </div>
              </div>

              <div className='mb-4 text-end'>
                <button
                  type='button'
                  className='btn btn-link recuperar-link p-0'
                  onClick={irARecuperar}
                  disabled={loading}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button type='submit' className='btn login-btn w-100' disabled={loading}>
                {loading ? (
                  <span className='d-inline-flex align-items-center gap-2'>
                    <span className='spinner-border spinner-border-sm' role='status' aria-hidden='true' />
                    Ingresando...
                  </span>
                ) : (
                  'Ingresar'
                )}
              </button>
            </form>

            <div className='login-divider mt-4'>
              <span>BomberOS</span>
            </div>
          </div>
          
          {/* resplandor inferior */}
          <div className='login-bottom-glow' />
        </div>
      </div>
    </div>
  )
}

export default Login
