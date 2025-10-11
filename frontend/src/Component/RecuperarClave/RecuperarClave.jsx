import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import '../Login/Login.css'
import '../DisenioFormulario/DisenioFormulario.css'
import { API_URLS } from '../../config/api'
import ParticlesBackground from '../ParticlesBackground/ParticlesBackground'

const RecuperarClave = ({ onVolver }) => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const showLoading = (title = 'Enviando correo...') => {
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
      title: 'No pudimos enviar el correo',
      text: message || 'Intentalo nuevamente',
      confirmButtonText: 'Entendido'
    })
  }

  const showToast = (title, icon = 'success', ms = 1800) => {
    Swal.fire({
      toast: true,
      icon,
      title,
      position: 'top-end',
      showConfirmButton: false,
      timer: ms,
      timerProgressBar: true
    })
  }

  useEffect(() => {
    const handler = (e) => {
      if (!email.trim() || loading) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [email, loading])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const correo = email.trim().toLowerCase()
    if (!correo) {
      showError('Ingresá un correo')
      return
    }

    try {
      setLoading(true)
      showLoading()

      const resp = await fetch(API_URLS.recuperarClave, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email: correo, correo })
      })

      let data = null
      let rawText = ''
      if (resp.status !== 204) {
        rawText = await resp.text()
        if (rawText) {
          try { data = JSON.parse(rawText) } catch { }
        }
      }

      if (!resp.ok) {
        const msg = data?.message || data?.error || rawText || `Error ${resp.status}`
        throw new Error(msg)
      }

      const ok = data?.success !== false
      if (!ok) {
        const msg = data?.message || data?.error || 'No se pudo enviar el correo'
        throw new Error(msg)
      }

      Swal.close()
      showToast(data?.message || `Se envió un correo a: ${correo}`)
      setEmail('')
    } catch (error) {
      Swal.close()
      showError(error?.message || 'Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleVolver = async () => {
    if (!email.trim()) {
      onVolver?.()
      return
    }
    const r = await Swal.fire({
      icon: 'question',
      title: '¿Volver sin enviar?',
      text: 'Perderás el correo escrito',
      showCancelButton: true,
      confirmButtonText: 'Sí, volver',
      cancelButtonText: 'Cancelar'
    })
    if (r.isConfirmed) onVolver?.()
  }

  return (
    <div className='login-page d-flex justify-content-center align-items-center min-vh-100 position-relative'>
      <ParticlesBackground className='particles-fixed' variant='auth' />

      {/* capas (quedan ocultas por CSS en esta vista) */}
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
              <h2 className='login-title'>Recuperar contraseña</h2>
              <p className='login-subtitle'>Te enviaremos un enlace para restablecerla</p>
            </div>

            {/* formulario con input-icon-left e input estilizado */}
            <form onSubmit={handleSubmit} className='login-form' noValidate>
              <div className='mb-3 text-start'>
                <label htmlFor='email' className='form-label text-white-90'>Correo electrónico</label>
                <div className='input-icon-left'>
                  <input
                    type='email'
                    className='form-control login-input ps-5'
                    id='email'
                    placeholder='Ingrese su correo'
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    autoComplete='email'
                  />
                  <i className='bi bi-envelope input-icon' aria-hidden='true' />
                </div>
              </div>

              <button type='submit' className='btn login-btn w-100' disabled={loading || !email.trim()}>
                {loading ? (
                  <span className='d-inline-flex align-items-center gap-2'>
                    <span className='spinner-border spinner-border-sm' role='status' aria-hidden='true' />
                    Enviando...
                  </span>
                ) : (
                  'Enviar enlace'
                )}
              </button>
            </form>

            {/* acciones secundarias */}
            <div className='mt-4 d-flex justify-content-between align-items-center'>
              <span className='text-white-90 small'>¿Recordaste tu contraseña?</span>
              <button
                type='button'
                className='btn btn-link recuperar-link p-0'
                onClick={handleVolver}
                disabled={loading}
              >
                Volver al inicio
              </button>
            </div>

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

export default RecuperarClave
