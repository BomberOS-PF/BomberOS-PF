import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Menu.css'
import CargarIncidente from '../CargarIncidente/CargarIncidente'
import RegistrarBombero from '../RegistrarBombero/RegistrarBombero'
import RegistrarUsuario from '../RegistrarUsuario/RegistrarUsuario'
import RegistrarRol from '../RegistrarRol/RegistrarRol'
import BurbujaFormulario from '../BurbujaFormulario/BurbujaFormulario'
import AccidenteTransito from '../AccidenteTransito/AccidenteTransito'
import FactorClimatico from '../FactorClimatico/FactorClimatico'

const Menu = ({ user, setUser }) => {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [opcionSeleccionada, setOpcionSeleccionada] = useState(null)
  const [burbujas, setBurbujas] = useState([])
  const [burbujaExpandida, setBurbujaExpandida] = useState(null)

  const handleLogOut = () => {
    setUser('')
    navigate('/login')
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
  const closeSidebar = () => setSidebarOpen(false)

  const agregarBurbuja = (tipo, datosPrevios) => {
    const id = datosPrevios?.id || Date.now()
    const yaExiste = burbujas.find(b => b.id === id)
    if (!yaExiste) {
      const nueva = { id, tipo, datosPrevios, minimizada: true }
      setBurbujas(prev => [...prev, nueva])
    }
    setOpcionSeleccionada(null)
  }

  const cerrarBurbuja = (id) => {
    setBurbujas(prev => prev.filter(b => b.id !== id))
    if (burbujaExpandida === id) setBurbujaExpandida(null)
  }

  const toggleMinimizada = (id) => {
    setBurbujas(prev => prev.map(b => {
      if (b.id === id) {
        const nuevaMin = !b.minimizada
        setBurbujaExpandida(nuevaMin ? null : id)
        return { ...b, minimizada: nuevaMin }
      }
      return { ...b, minimizada: true }
    }))
  }

  const renderFormularioExpandido = () => {
    const burbuja = burbujas.find(b => b.id === burbujaExpandida)
    if (!burbuja) return null

    switch (burbuja.tipo) {
      case 'Accidente':
        return <AccidenteTransito datosPrevios={burbuja.datosPrevios} />
      case 'Factores Climáticos':
        return <FactorClimatico datosPrevios={burbuja.datosPrevios} />
      default:
        return <p>Formulario no encontrado</p>
    }
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
          <button key={key} className="sidebar-button" onClick={() => {
            closeSidebar()
            setOpcionSeleccionada(key)
            setBurbujaExpandida(null)
          }}>{label}</button>
        ))}

        <button className="sidebar-button logout" onClick={handleLogOut}>Cerrar sesión</button>
      </aside>

      <div className="menu-content-wrapper">
        {burbujaExpandida ? (
          <div className="form-wrapper">{renderFormularioExpandido()}</div>
        ) : opcionSeleccionada === null ? (
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
