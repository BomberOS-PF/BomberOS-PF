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

  // advertir si cierran con datos sin enviar
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
        // Enviamos ambos campos para cubrir cualquier contrato del backend
        body: JSON.stringify({ email: correo, correo })
      })

      // Intentar parsear respuesta (JSON, texto o 204)
      let data = null
      let rawText = ''
      if (resp.status !== 204) {
        rawText = await resp.text()
        if (rawText) {
          try {
            data = JSON.parse(rawText)
          } catch { }
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
    <div>
      <ParticlesBackground className='particles-fixed' variant='auth' />

      <div className='container-fluid d-flex justify-content-center align-items-center min-vh-100 login-bg'>
        <div className='formulario-consistente text-center'>
          <img src='/img/logo-bomberos.png' alt='Logo BomberOS' className='logo-bomberos mb-3' />
          <h2 className='text-black mb-4'>Recuperar Contraseña</h2>

          <form onSubmit={handleSubmit} noValidate className='at-form'>
            <div className='mb-3 text-start'>
              <label htmlFor='email' className='form-label'>Correo electrónico</label>
              <input
                type='email'
                className='form-control'
                id='email'
                placeholder='Ingrese su correo'
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete='email'
              />
              <div className='form-text'>Te enviaremos un enlace para restablecer tu contraseña</div>
            </div>

            <button type='submit' className='btn btn-danger w-100' disabled={loading || !email.trim()}>
              {loading ? 'Enviando...' : 'Enviar'}
            </button>

            <div className='mt-3 text-center'>
              <button type='button' className='btn btn-secondary' onClick={handleVolver} disabled={loading}>
                Volver
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

  )
}

export default RecuperarClave
