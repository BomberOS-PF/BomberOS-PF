import { useState } from 'react'
import '../Login/Login.css'
import '../DisenioFormulario/DisenioFormulario.css'

const RecuperarClave = ({ onVolver }) => {
  const [email, setEmail] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const res = await fetch('http://localhost:3000/api/recuperar-clave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      const data = await res.json()

      if (res.ok) {
        alert(`Se envió un correo a: ${email}`)
        setEmail('')
      } else {
        alert(`❌ Error: ${data.error || 'No se pudo enviar el correo'}`)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('❌ Error al conectar con el servidor')
    }
  }

  const handleVolver = () => {
    setEmail('')
    onVolver()
  }

  return (
    <div className="container-fluid d-flex justify-content-center align-items-center min-vh-100 login-bg">
      <div className="formulario-consistente text-center">
        <img src="/img/logo-bomberos.png" alt="Logo BomberOS" className="logo-bomberos mb-3" />
        <h2 className="text-black mb-4">Recuperar Contraseña</h2>
        <form onSubmit={handleSubmit}>
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
            />
          </div>
          <button type="submit" className="btn btn-danger w-100">Enviar</button>
          <div className="mt-3 text-center">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleVolver}
            >
              Volver
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RecuperarClave
