// ✅ Menu.jsx completo con visualización de usuario y rol
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Menu.css'
import logoBomberos from '/img/logo-bomberos.png'
import CargarIncidente from '../Incidente/CargarIncidente/CargarIncidente'
import RegistrarBombero from '../Bombero/RegistrarBombero/RegistrarBombero'
import RegistrarUsuario from '../Usuario/RegistrarUsuario/RegistrarUsuario'
import ConsultarUsuario from '../Usuario/ConsultarUsuario/ConsultarUsuario'
import RegistrarRol from '../RegistrarRol/RegistrarRol'
import BurbujaFormulario from '../BurbujaFormulario/BurbujaFormulario'
import AccidenteTransito from '../Incidente/TipoIncidente/AccidenteTransito/AccidenteTransito'
import FactorClimatico from '../Incidente/TipoIncidente/FactorClimatico/FactorClimatico'
import IncendioEstructural from '../Incidente/TipoIncidente/IncendioEstructural/IncendioEstructural'
import IncendioForestal from '../Incidente/TipoIncidente/IncendioForestal/IncendioForestal'
import MaterialPeligroso from '../Incidente/TipoIncidente/MaterialPeligroso/MaterialPeligroso'
import Rescate from '../Incidente/TipoIncidente/Rescate/Rescate'
import ParticipacionIncidente from '../Incidente/ParticipacionIncidente/ParticipacionIncidente'
import VehiculoInvolucrado from '../VehiculoInvolucrado/VehiculoInvolucrado'
import ConsultarBombero from '../Bombero/ConsultarBombero/ConsultarBombero'
import ConsultarIncidente from '../Incidente/ConsultarIncidente/ConsultarIncidente'

const Menu = ({ user, setUser }) => {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [opcionSeleccionada, setOpcionSeleccionada] = useState(null)
  const [burbujas, setBurbujas] = useState([])
  const [burbujaExpandida, setBurbujaExpandida] = useState(null)
  const [datosFinalizados, setDatosFinalizados] = useState(null)

  const usuarioActual = user || JSON.parse(localStorage.getItem('usuario')) || {}
  const nombreUsuario = usuarioActual.usuario || 'Usuario'
  const rol = usuarioActual.rol || 'desconocido'

  const handleLogOut = () => {
    localStorage.removeItem('usuario')
    setUser(null)
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

  const manejarFinalizarCarga = (datos) => {
    if (burbujaExpandida) cerrarBurbuja(burbujaExpandida)
    setDatosFinalizados(datos)
    setOpcionSeleccionada('participacion-incidente')
  }

  const renderFormularioExpandido = () => {
    const burbuja = burbujas.find(b => b.id === burbujaExpandida)
    if (!burbuja) return null
    const props = { datosPrevios: burbuja.datosPrevios, onFinalizar: manejarFinalizarCarga }

    switch (burbuja.tipo) {
      case 'Accidente': return <AccidenteTransito {...props} />
      case 'Factores Climáticos': return <FactorClimatico {...props} />
      case 'Incendio Estructural': return <IncendioEstructural {...props} />
      case 'Incendio Forestal': return <IncendioForestal {...props} />
      case 'Material Peligroso': return <MaterialPeligroso {...props} />
      case 'Rescate': return <Rescate {...props} />
      default: return <p>Formulario no encontrado</p>
    }
  }

  const permisos = {
    administrador: [
      'cargar-incidente', 'registrar-bombero', 'consultar-bombero',
      'registrar-usuario', 'consultar-usuario',
      'registrar-rol', 'participacion-incidente', 'vehiculo-involucrado', 
      'accidente-transito', 'consultar-incidente'
    ],
    bombero: [
      'cargar-incidente', 'consultar-bombero',
      'participacion-incidente'
    ]
  }

  const items = [
    { key: 'cargar-incidente', label: 'Cargar Incidente' },
    { key: 'registrar-bombero', label: 'Nuevo Bombero' },
    { key: 'consultar-bombero', label: 'Consultar Bombero' },
    { key: 'registrar-usuario', label: 'Nuevo Administrador' },
    { key: 'consultar-usuario', label: 'Consultar Usuarios' },
    { key: 'registrar-rol', label: 'Registrar Rol' },
    { key: 'participacion-incidente', label: 'Participación del Incidente' },
    { key: 'vehiculo-involucrado', label: 'Vehículo Involucrado' },
    
    { key: 'accidente-transito', label: 'Accidente de Tránsito' }
  ]

  const puedeVer = (key) => permisos[rol]?.includes(key)

  return (
    <div className="sidebar-container">
      <button className="hamburger-btn d-lg-none" onClick={toggleSidebar}>☰</button>

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header d-flex justify-content-between align-items-center">
          <img src={logoBomberos} alt="Logo Bomberos" style={{ height: '40px' }} />
          <button className="close-btn d-lg-none" onClick={closeSidebar}>×</button>
        </div>

        {items.map(({ key, label }) => (
          puedeVer(key) && (
            <button key={key} className="sidebar-button" onClick={() => {
              closeSidebar()
              setOpcionSeleccionada(key)
              setBurbujaExpandida(null)
            }}>{label}</button>
          )
        ))}

        <button className="sidebar-button logout" onClick={handleLogOut}>Cerrar sesión</button>
      </aside>

      <div className="menu-content-wrapper">
        {burbujaExpandida ? (
          <div className="form-wrapper">{renderFormularioExpandido()}</div>
        ) : opcionSeleccionada === null ? (
          <div className="menu-container">
            <h2 className="usuario-logueado">
              <strong>{rol?.toUpperCase()}</strong> - {nombreUsuario}
            </h2>
            <p>Seleccioná una opción desde el menú lateral izquierdo.</p>
          </div>
        ) : (
          <div className="form-wrapper">
            {opcionSeleccionada === 'cargar-incidente' && <CargarIncidente onVolver={() => setOpcionSeleccionada(null)} onNotificar={agregarBurbuja} />}
            {opcionSeleccionada === 'consultar-incidente' && <ConsultarIncidente onVolver={() => setOpcionSeleccionada(null)} />} 
            {opcionSeleccionada === 'registrar-bombero' && <RegistrarBombero onVolver={() => setOpcionSeleccionada(null)} />}
            {opcionSeleccionada === 'consultar-bombero' && <ConsultarBombero onVolver={() => setOpcionSeleccionada(null)} />}
            {opcionSeleccionada === 'registrar-usuario' && <RegistrarUsuario onVolver={() => setOpcionSeleccionada(null)} />}
            {opcionSeleccionada === 'consultar-usuario' && <ConsultarUsuario onVolver={() => setOpcionSeleccionada(null)} />}
            {opcionSeleccionada === 'registrar-rol' && <RegistrarRol onVolver={() => setOpcionSeleccionada(null)} />}
            {opcionSeleccionada === 'participacion-incidente' && <ParticipacionIncidente datosPrevios={datosFinalizados} onFinalizar={() => setOpcionSeleccionada('vehiculo-involucrado')} onVolver={() => setOpcionSeleccionada(null)} />}
            {opcionSeleccionada === 'vehiculo-involucrado' && <VehiculoInvolucrado onVolver={() => setOpcionSeleccionada(null)} />}
            
            {opcionSeleccionada === 'accidente-transito' && <AccidenteTransito datosPrevios={{ id: 999 }} onFinalizar={() => setOpcionSeleccionada(null)} />}


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
