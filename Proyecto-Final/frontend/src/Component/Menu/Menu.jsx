import React, { useState } from 'react'
import './Menu.css'
import { useNavigate } from 'react-router-dom'

const Menu = ({ user, setUser }) => {
  const [seccion, setSeccion] = useState('inicio')
  const navigate = useNavigate()

  const handleLogOut = () => {
    setUser('')
    navigate('/login')
  }

  return (
    <div className="menu-container">
      <h1>Bienvenido</h1>
      <h2>{user.user}</h2>

      <div className="menu-buttons d-flex flex-wrap justify-content-center gap-3">
        {[
          { label: 'Registrar Bombero', path: '/registrar-bombero' },
          { label: 'Registrar Usuario', path: '/registrar-usuario' },
          { label: 'Cargar Incidente', path: '/cargar-incidente' },
          { label: 'Registrar Rol', path: '/registrar-rol' },
          { label: 'Accidente de Tránsito', path: '/accidente-transito' },
          { label: 'Factores Climáticos', path: '/factor-climatico' },
          { label: 'Incendio Estructural', path: '/incendio-estructural' },
          { label: 'Incendio Forestal', path: '/incendio-forestal' },
          { label: 'Material Peligroso', path: '/material-peligroso' },
          { label: 'Rescate', path: '/rescate' },
          { label: 'Participación en Incidente', path: '/participacion-incidente' },
          { label: 'Vehículo Involucrado', path: '/vehiculo-involucrado' }
          

        ].map(({ label, path }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="btn menu-btn">
            {label}
          </button>
        ))}
      </div>

      <div className="menu-content">
        {seccion === 'inicio' && <p>Selecciona una opción del menú para comenzar.</p>}
        {seccion === 'registrarIncidente' && <p>Formulario para registrar incidente (a implementar).</p>}
      </div>

      <button className="btn btn-danger mt-3" onClick={handleLogOut}>
        Cerrar sesión
      </button>
    </div>
  )
}

export default Menu
