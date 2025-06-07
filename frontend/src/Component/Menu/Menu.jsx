import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Menu.css'
import CargarIncidente from '../CargarIncidente/CargarIncidente'
import RegistrarBombero from '../RegistrarBombero/RegistrarBombero'

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
    { key: 'cargar-incidente', label: 'Cargar Incidente' },
    { key: 'registrar-bombero', label: 'Registrar Bombero' },
    // Agregá más formularios internos si querés que se comporten igual
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

        {items.map(({ key, label }) => (
          <button
            key={key}
            className="sidebar-button"
            onClick={() => {
              closeSidebar()
              setOpcionSeleccionada(key)
            }}
          >
            {label}
          </button>
        ))}

        {/* Otros ítems que navegan */}
        <button
          className="sidebar-button"
          onClick={() => {
            closeSidebar()
            navigate('/registrar-usuario')
          }}
        >
          Registrar Usuario
        </button>

        <button
          className="sidebar-button"
          onClick={() => {
            closeSidebar()
            navigate('/registrar-rol')
          }}
        >
          Registrar Rol
        </button>

        {/* Otros componentes que se abren por ruta */}
        <button onClick={() => navigate('/accidente-transito')} className="sidebar-button">Accidente de Tránsito</button>
        <button onClick={() => navigate('/factor-climatico')} className="sidebar-button">Factores Climáticos</button>
        <button onClick={() => navigate('/incendio-estructural')} className="sidebar-button">Incendio Estructural</button>
        <button onClick={() => navigate('/incendio-forestal')} className="sidebar-button">Incendio Forestal</button>
        <button onClick={() => navigate('/material-peligroso')} className="sidebar-button">Material Peligroso</button>
        <button onClick={() => navigate('/rescate')} className="sidebar-button">Rescate</button>
        <button onClick={() => navigate('/vehiculo-involucrado')} className="sidebar-button">Vehículo Involucrado</button>
        <button onClick={() => navigate('/participacion-incidente')} className="sidebar-button">Participación</button>

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

            {opcionSeleccionada === 'registrar-bombero' && (
              <RegistrarBombero onVolver={() => setOpcionSeleccionada(null)} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Menu
