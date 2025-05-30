import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import RecuperarClave from '../RecuperarClave/RecuperarClave'
import './Login.css'

const Login = ({ setUser, user }) => {
  const [usuario, setUsuario] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [mostrarRecuperar, setMostrarRecuperar] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/')
  }, [user])

  const resetForm = () => {
    setUsuario('')
    setContrasena('')
  }

const handleSubmit = async (e) => {
  e.preventDefault()
  
  //aca deberia ir la URL publica cuando lo deployemos
  try {
    const response = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, contrasena })
    })

    const data = await response.json()

    if (response.ok && data.success) {
      setUser(data.usuario)
      resetForm()
      navigate('/menu')
    } else {
      alert(data.error || 'Usuario o contraseña incorrectos')
      resetForm()
    }
  } catch (error) {
    console.error('Error al iniciar sesión:', error)
    alert('Error en el servidor. Intenta más tarde.')
  }
}


  if (mostrarRecuperar) {
    return (
      <RecuperarClave volver={() => {
        resetForm()
        setMostrarRecuperar(false)
      }} />
    )
  }

  return (
    <div className="container-fluid d-flex justify-content-center align-items-center min-vh-100 login-bg">
      <div className="form-login p-4 shadow rounded text-center w-100">
        <img
          src="/img/logo-bomberos.png"
          alt="Logo BomberOS"
          className="logo-bomberos mb-3"
        />
        <h2 className="text-black mb-4">Iniciar Sesión</h2>
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
            />
          </div>
          <div className="mb-3 text-start">
            <label htmlFor="contrasena" className="text-black form-label">Contraseña</label>
            <input
              type="password"
              className="form-control"
              id="contrasena"
              placeholder="Ingrese su contraseña"
              required
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
            />
          </div>
          <div className="mb-3 text-start">
            <button
              type="button"
              className="btn btn-link recuperar-link p-0"
              onClick={() => navigate('/recuperar-clave')}>
              Recuperar contraseña
            </button>
          </div>
          <button type="submit" className="btn btn-danger w-100">
            Ingresar
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
