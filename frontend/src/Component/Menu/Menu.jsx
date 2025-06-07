import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Menu.css'
import CargarIncidente from '../CargarIncidente/CargarIncidente'
import RegistrarBombero from '../RegistrarBombero/RegistrarBombero'
import RegistrarUsuario from '../RegistrarUsuario/RegistrarUsuario'
import RegistrarRol from '../RegistrarRol/RegistrarRol'
import BurbujaFormulario from '../BurbujaFormulario/BurbujaFormulario'

const Menu = ({ user, setUser }) => {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [opcionSeleccionada, setOpcionSeleccionada] = useState(null)
  const [burbujas, setBurbujas] = useState([])

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

  const agregarBurbuja = (tipo, datosPrevios) => {
    const id = datosPrevios?.id || Date.now()
    const yaExiste = burbujas.find(b => b.id === id)
    if (!yaExiste) {
      const nueva = { id, tipo, datosPrevios, minimizada: false }
      setBurbujas(prev => [...prev, nueva])
    }
    setOpcionSeleccionada(null)
  }

  const cerrarBurbuja = (id) => {
    setBurbujas(prev => prev.filter(b => b.id !== id))
  }

  const toggleMinimizada = (id) => {
    setBurbujas(prev => prev.map(b =>
      b.id === id ? { ...b, minimizada: !b.minimizada } : b
    ))
  }

  const items = [
    { key: 'cargar-incidente', label: 'Cargar Incidente' },
    { key: 'registrar-bombero', label: 'Registrar Bombero' },
    { key: 'registrar-usuario', label: 'Registrar Usuario' },
    { key: 'registrar-rol', label: 'Registrar Rol' }
  ]

  return (
    <div className="sidebar-container">
      <button className="hamburger-btn d-lg-none" onClick={toggleSidebar}>☰</button>

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
          >{label}</button>
        ))}

        <button onClick={() => navigate('/accidente-transito')} className="sidebar-button">Accidente de Tránsito</button>
        <button onClick={() => navigate('/factor-climatico')} className="sidebar-button">Factores Climáticos</button>
        <button onClick={() => navigate('/incendio-estructural')} className="sidebar-button">Incendio Estructural</button>
        <button onClick={() => navigate('/incendio-forestal')} className="sidebar-button">Incendio Forestal</button>
        <button onClick={() => navigate('/material-peligroso')} className="sidebar-button">Material Peligroso</button>
        <button onClick={() => navigate('/rescate')} className="sidebar-button">Rescate</button>
        <button onClick={() => navigate('/vehiculo-involucrado')} className="sidebar-button">Vehículo Involucrado</button>
        <button onClick={() => navigate('/participacion-incidente')} className="sidebar-button">Participación</button>
        <button className="sidebar-button logout" onClick={handleLogOut}>Cerrar sesión</button>
      </aside>

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
              <CargarIncidente
                onVolver={() => setOpcionSeleccionada(null)}
                onNotificar={agregarBurbuja}
              />
            )}

            {opcionSeleccionada === 'registrar-bombero' && (
              <RegistrarBombero onVolver={() => setOpcionSeleccionada(null)} />
            )}

            {opcionSeleccionada === 'registrar-usuario' && (
              <RegistrarUsuario onVolver={() => setOpcionSeleccionada(null)} />
            )}

            {opcionSeleccionada === 'registrar-rol' && (
              <RegistrarRol onVolver={() => setOpcionSeleccionada(null)} />
            )}
          </div>
        )}
      </div>

      {burbujas.map((b, index) => (
        <div key={b.id} style={{ position: 'fixed', right: `${20 + index * 370}px`, bottom: '0', zIndex: 9999 }}>
          <BurbujaFormulario
            id={b.id}
            tipo={b.tipo}
            datosPrevios={b.datosPrevios}
            minimizada={b.minimizada}
            onCerrar={cerrarBurbuja}
            onToggleMinimizada={toggleMinimizada}
          />
        </div>
      ))}
    </div>
  )
}

export default Menu
