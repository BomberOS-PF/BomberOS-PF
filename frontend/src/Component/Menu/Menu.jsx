import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Menu.css'
import CargarIncidente from '../CargarIncidente/CargarIncidente'

const Menu = ({ user, setUser }) => {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [opcionSeleccionada, setOpcionSeleccionada] = useState(null)

  const handleLogOut = () => {
    setUser('')
    navigate('/login')
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  const items = [
    { path: '/cargar-incidente', label: 'Cargar Incidente' },
    { path: '/registrar-bombero', label: 'Registrar Bombero' },
    { path: '/registrar-usuario', label: 'Registrar Usuario' },
    { path: '/registrar-rol', label: 'Registrar Rol' },
    { path: '/accidente-transito', label: 'Accidente de Tránsito' },
    { path: '/factor-climatico', label: 'Factores Climáticos' },
    { path: '/incendio-estructural', label: 'Incendio Estructural' },
    { path: '/incendio-forestal', label: 'Incendio Forestal' },
    { path: '/material-peligroso', label: 'Material Peligroso' },
    { path: '/rescate', label: 'Rescate' },
    { path: '/vehiculo-involucrado', label: 'Vehículo Involucrado' },
    { path: '/participacion-incidente', label: 'Participación' }
  ]

  return (
    <div className="sidebar-container">
      {/* Botón hamburguesa */}
      <button className="hamburger-btn d-lg-none" onClick={toggleSidebar}>
        ☰
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header d-flex justify-content-between align-items-center">
          <span>Menú</span>
          <button className="close-btn d-lg-none" onClick={closeSidebar}>×</button>
        </div>

        {items.map(({ path, label }) => (
          <button
            key={path}
            className="sidebar-button"
            onClick={() => {
              closeSidebar()
              if (label === 'Cargar Incidente') {
                setOpcionSeleccionada('cargar-incidente')
              } else {
                navigate(path)
              }
            }}
          >
            {label}
          </button>
        ))}
        <button className="sidebar-button logout" onClick={handleLogOut}>
          Cerrar sesión
        </button>
      </aside>

      {/* Contenido */}
      <div className="menu-content-wrapper">
        {opcionSeleccionada === null ? (
          <div className="menu-container">
            <h1>Bienvenido</h1>
            <h2>{user.user}</h2>
            <p>Seleccioná una opción desde el menú lateral izquierdo.</p>
          </div>
        ) : (
          <div className="form-wrapper">
            {opcionSeleccionada === 'cargar-incidente' && (
              <CargarIncidente onVolver={() => setOpcionSeleccionada(null)} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Menu
