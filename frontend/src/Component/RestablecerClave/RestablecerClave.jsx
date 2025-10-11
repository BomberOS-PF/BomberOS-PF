import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
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
    <div>
      <ParticlesBackground className='particles-fixed' variant='auth' />

      <div className='container-fluid d-flex justify-content-center align-items-center min-vh-100 login-bg'>
        <div className='formulario-consistente text-center'>
          <img src='/img/logo-bomberos.png' alt='Logo BomberOS' className='logo-bomberos mb-3' />
          <h2 className='text-black mb-4'>Restablecer Contraseña</h2>

          {!tokenValido ? (
            <div className='alert alert-danger' role='alert'>
              El enlace no es válido o expiró
            </div>
          ) : (
            <form onSubmit={handleSubmit} className='at-form'>
              <div className='mb-3 text-start'>
                <label htmlFor='nuevaContrasena' className='form-label text-black'>Nueva contraseña</label>
                <input
                  type='password'
                  className='form-control'
                  id='nuevaContrasena'
                  value={nuevaContrasena}
                  required
                  onChange={(e) => setNuevaContrasena(e.target.value)}
                  autoComplete='new-password'
                />
                <small className='form-text text-muted'>
                  Mínimo 8 caracteres
                </small>
              </div>

              <div className='mb-3 text-start'>
                <label htmlFor='confirmacion' className='form-label text-black'>Confirmar contraseña</label>
                <input
                  type='password'
                  className='form-control'
                  id='confirmacion'
                  value={confirmacion}
                  required
                  onChange={(e) => setConfirmacion(e.target.value)}
                  autoComplete='new-password'
                />
              </div>

              <button type='submit' className='btn btn-danger w-100 mt-2'>Restablecer</button>
              <button type='button' className='btn btn-secondary w-100 mt-2' onClick={volverConConfirmacion}>
                Volver
              </button>
            </form>
          )}
        </div>
      </div>
    </div>

  )
}

export default RestablecerClave
