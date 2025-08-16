import { useState } from 'react'
import '../Login/Login.css'
import '../DisenioFormulario/DisenioFormulario.css'
import { API_URLS } from '../../config/api'

const RecuperarClave = ({ onVolver }) => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const correo = email.trim().toLowerCase()
    if (!correo) return

    try {
      setLoading(true)

      const resp = await fetch(API_URLS.recuperarClave, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        // Enviamos ambos campos para cubrir cualquier contrato del backend
        body: JSON.stringify({ email: correo, correo })
      })

      // Intentar parsear respuesta de forma segura (JSON, texto o 204)
      let data = null
      let rawText = ''
      if (resp.status !== 204) {
        rawText = await resp.text()
        if (rawText) {
          try {
            data = JSON.parse(rawText)
          } catch {
            data = null
          }
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

      const msgExito = data?.message || `Se envió un correo a: ${correo}`
      alert(msgExito)
      setEmail('')
    } catch (error) {
      console.error('RecuperarClave error:', error)
      alert(`❌ ${error?.message || 'Error al conectar con el servidor'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleVolver = () => {
    setEmail('')
    onVolver?.()
  }

  return (
    <div className="container-fluid d-flex justify-content-center align-items-center min-vh-100 login-bg">
      <div className="formulario-consistente text-center">
        <img src="/img/logo-bomberos.png" alt="Logo BomberOS" className="logo-bomberos mb-3" />
        <h2 className="text-black mb-4">Recuperar Contraseña</h2>

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3 text-start">
            <label htmlFor="email" className="form-label">Correo electrónico</label>
            <input
              type="email"
              className="form-control"
              id="email"
              placeholder="Ingrese su correo"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
            <div className="form-text">Te enviaremos un enlace para restablecer tu contraseña</div>
          </div>

          <button type="submit" className="btn btn-danger w-100" disabled={loading || !email.trim()}>
            {loading ? 'Enviando...' : 'Enviar'}
          </button>

          <div className="mt-3 text-center">
            <button type="button" className="btn btn-secondary" onClick={handleVolver} disabled={loading}>
              Volver
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RecuperarClave
