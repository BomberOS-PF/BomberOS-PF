import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import '../DisenioFormulario/DisenioFormulario.css'

const RestablecerClave = ({ onVolver }) => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [nuevaContrasena, setNuevaContrasena] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [tokenValido, setTokenValido] = useState(false)

  useEffect(() => {
    const validarToken = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/validar-token?token=${token}`)
        const data = await res.json()
        if (res.ok && data.success) {
          setTokenValido(true)
        } else {
          setError('❌ Token inválido o expirado')
        }
      } catch (err) {
        setError('❌ Error al validar token')
      }
    }

    if (token) validarToken()
    else setError('❌ Token no proporcionado')
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMensaje('')
    setError('')

    if (nuevaContrasena !== confirmacion) {
      return setError('❌ Las contraseñas no coinciden')
    }

    try {
      const res = await fetch('http://localhost:3000/api/restablecer-clave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, nuevaContrasena })
      })

      const data = await res.json()

      if (res.ok) {
        setMensaje('✅ Contraseña restablecida correctamente')
        setNuevaContrasena('')
        setConfirmacion('')
      } else {
        setError(`❌ ${data.error || 'No se pudo restablecer la contraseña'}`)
      }
    } catch (err) {
      setError('❌ Error al conectar con el servidor')
    }
  }

  return (
    <div className="container-fluid d-flex justify-content-center align-items-center min-vh-100 login-bg">
      <div className="formulario-consistente text-center">
        <img src="/img/logo-bomberos.png" alt="Logo BomberOS" className="logo-bomberos mb-3" />
        <h2 className="text-black mb-4">Restablecer Contraseña</h2>

        {!tokenValido ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-3 text-start">
              <label htmlFor="nuevaContrasena" className="form-label">Nueva contraseña</label>
              <input
                type="password"
                className="form-control"
                id="nuevaContrasena"
                value={nuevaContrasena}
                required
                onChange={(e) => setNuevaContrasena(e.target.value)}
              />
            </div>
            <div className="mb-3 text-start">
              <label htmlFor="confirmacion" className="form-label">Confirmar contraseña</label>
              <input
                type="password"
                className="form-control"
                id="confirmacion"
                value={confirmacion}
                required
                onChange={(e) => setConfirmacion(e.target.value)}
              />
            </div>
            {mensaje && <div className="alert alert-success">{mensaje}</div>}
            {error && <div className="alert alert-danger">{error}</div>}
            <button type="submit" className="btn btn-danger w-100 mt-2">Restablecer</button>
            <button type="button" className="btn btn-secondary w-100 mt-2" onClick={onVolver}>Volver</button>
          </form>
        )}
      </div>
    </div>
  )
}

export default RestablecerClave
