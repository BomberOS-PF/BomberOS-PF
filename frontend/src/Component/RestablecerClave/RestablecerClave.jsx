import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import '../Login/Login.css'
import '../DisenioFormulario/DisenioFormulario.css'
import { buildApiUrl } from '../../config/api'
import ParticlesBackground from '../ParticlesBackground/ParticlesBackground'

const RestablecerClave = ({ onVolver }) => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [nuevaContrasena, setNuevaContrasena] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [tokenValido, setTokenValido] = useState(false)

  const showLoading = (title = 'Procesando...') => {
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
      title: 'Ocurrió un problema',
      text: message || 'Intentalo nuevamente',
      confirmButtonText: 'Entendido'
    })
  }

  const showSuccess = async (title, text) => {
    await Swal.fire({
      icon: 'success',
      title: title || 'Listo',
      text: text || 'Operación realizada con éxito',
      confirmButtonText: 'Volver'
    })
  }

  useEffect(() => {
    const validarToken = async () => {
      if (!token) {
        showError('Token no proporcionado')
        return
      }
      try {
        showLoading('Validando enlace...')
        const res = await fetch(buildApiUrl(`/api/validar-token?token=${token}`))
        const data = await res.json()
        Swal.close()

        if (res.ok && data.success) {
          setTokenValido(true)
          Swal.fire({
            toast: true,
            icon: 'info',
            title: 'Enlace verificado',
            position: 'top-end',
            showConfirmButton: false,
            timer: 1400,
            timerProgressBar: true
          })
        } else {
          setTokenValido(false)
          showError('Token inválido o expirado')
        }
      } catch {
        Swal.close()
        setTokenValido(false)
        showError('Error al validar el token con el servidor')
      }
    }

    validarToken()
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!nuevaContrasena || !confirmacion) {
      showError('Completá ambos campos')
      return
    }
    if (nuevaContrasena !== confirmacion) {
      showError('Las contraseñas no coinciden')
      return
    }
    if (nuevaContrasena.length < 8) {
      showError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    try {
      showLoading('Actualizando contraseña...')
      const res = await fetch(buildApiUrl('/api/restablecer-clave'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, nuevaContrasena })
      })
      const data = await res.json()
      Swal.close()

      if (res.ok) {
        setNuevaContrasena('')
        setConfirmacion('')
        await showSuccess('Contraseña actualizada', 'Tu contraseña fue restablecida correctamente')
        onVolver && onVolver()
      } else {
        showError(data.error || 'No se pudo restablecer la contraseña')
      }
    } catch {
      Swal.close()
      showError('Error al conectar con el servidor')
    }
  }

  const volverConConfirmacion = async () => {
    if (!nuevaContrasena && !confirmacion) {
      onVolver && onVolver()
      return
    }
    const r = await Swal.fire({
      icon: 'question',
      title: '¿Volver sin guardar?',
      text: 'Perderás los cambios ingresados',
      showCancelButton: true,
      confirmButtonText: 'Sí, volver',
      cancelButtonText: 'Cancelar'
    })
    if (r.isConfirmed) onVolver && onVolver()
  }

  return (
    <div className='login-page d-flex justify-content-center align-items-center min-vh-100 position-relative'>
      <ParticlesBackground className='particles-fixed' variant='auth' />

      {/* capas decorativas (quedan ocultas por CSS en esta vista) */}
      <div className='login-bg-radial-1' />
      <div className='login-bg-radial-2' />
      <div className='login-bg-pattern' />

      <div>
        <div>
          <div className='login-card shadow-2xl'>
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

            {/* títulos */}
            <div className='text-center mb-4'>
              <h2 className='login-title'>Restablecer contraseña</h2>
              <p className='login-subtitle'>Ingresá tu nueva contraseña</p>
            </div>

            {!tokenValido ? (
              <div className='alert alert-danger mb-0' role='alert'>
                El enlace no es válido o expiró
              </div>
            ) : (
              <form onSubmit={handleSubmit} className='login-form' noValidate>
                <div className='mb-3 text-start'>
                  <label htmlFor='nuevaContrasena' className='form-label text-white-90'>Nueva contraseña</label>
                  <div className='input-icon-left'>
                    <input
                      type='password'
                      className='form-control login-input ps-5'
                      id='nuevaContrasena'
                      value={nuevaContrasena}
                      required
                      onChange={(e) => setNuevaContrasena(e.target.value)}
                      autoComplete='new-password'
                    />
                    <i className='bi bi-lock input-icon' aria-hidden='true' />
                  </div>
                  <small className='text-white' style={{ opacity: .6 }}>Mínimo 8 caracteres</small>
                </div>

                <div className='mb-3 text-start'>
                  <label htmlFor='confirmacion' className='form-label text-white-90'>Confirmar contraseña</label>
                  <div className='input-icon-left'>
                    <input
                      type='password'
                      className='form-control login-input ps-5'
                      id='confirmacion'
                      value={confirmacion}
                      required
                      onChange={(e) => setConfirmacion(e.target.value)}
                      autoComplete='new-password'
                    />
                    <i className='bi bi-shield-lock input-icon' aria-hidden='true' />
                  </div>
                </div>

                <button type='submit' className='btn login-btn w-100'>
                  Restablecer
                </button>

                <div className='mt-4 d-flex justify-content-end'>
                  <button
                    type='button'
                    className='btn btn-link recuperar-link p-0'
                    onClick={volverConConfirmacion}
                  >
                    Volver al inicio
                  </button>
                </div>
              </form>
            )}

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

export default RestablecerClave
