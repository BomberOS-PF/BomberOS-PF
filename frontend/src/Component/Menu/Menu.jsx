// Menu.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Menu.css'
import * as bootstrap from 'bootstrap'
import logoBomberos from '/img/logo-bomberos.png'

import CargarIncidente from '../Incidente/CargarIncidente/CargarIncidente'
import RegistrarBombero from '../Bombero/RegistrarBombero/RegistrarBombero'
import ConsultarBombero from '../Bombero/ConsultarBombero/ConsultarBombero'
import RegistrarUsuario from '../Usuario/RegistrarUsuario/RegistrarUsuario'
import ConsultarUsuario from '../Usuario/ConsultarUsuario/ConsultarUsuario'
import RegistrarRol from '../Rol/RegistrarRol'
import ConsultarRol from '../Rol/ConsultarRol'
import RegistrarGuardia from '../Guardia/RegistrarGuardia/RegistrarGuardia'
import ConsultarGrupoGuardia from '../Guardia/ConsultarGuardia/ConsultarGrupoGuardia'

import AccidenteTransito from '../Incidente/TipoIncidente/AccidenteTransito/AccidenteTransito'
import FactorClimatico from '../Incidente/TipoIncidente/FactorClimatico/FactorClimatico'
import IncendioEstructural from '../Incidente/TipoIncidente/IncendioEstructural/IncendioEstructural'
import IncendioForestal from '../Incidente/TipoIncidente/IncendioForestal/IncendioForestal'
import MaterialPeligroso from '../Incidente/TipoIncidente/MaterialPeligroso/MaterialPeligroso'
import Rescate from '../Incidente/TipoIncidente/Rescate/Rescate'

import ParticipacionIncidente from '../Incidente/ParticipacionIncidente/ParticipacionIncidente'
import VehiculoInvolucrado from '../VehiculoInvolucrado/VehiculoInvolucrado'
import BurbujaFormulario from '../BurbujaFormulario/BurbujaFormulario'

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

  useEffect(() => {
    const boton = document.getElementById('btnHamburguesa')
    const sidebar = document.getElementById('sidebarMenu')

    const handleOpen = () => boton.classList.add('abierto')
    const handleClose = () => boton.classList.remove('abierto')

    if (sidebar && boton) {
      sidebar.addEventListener('shown.bs.offcanvas', handleOpen)
      sidebar.addEventListener('hidden.bs.offcanvas', handleClose)
    }

    return () => {
      if (sidebar && boton) {
        sidebar.removeEventListener('shown.bs.offcanvas', handleOpen)
        sidebar.removeEventListener('hidden.bs.offcanvas', handleClose)
      }
    }
  }, [])

  useEffect(() => {
    const backdropClickHandler = (e) => {
      const sidebar = document.getElementById('sidebarMenu')
      const isSidebarVisible = sidebar?.classList.contains('show')
      const isClickOutside = !sidebar?.contains(e.target)

      if (isSidebarVisible && isClickOutside && !opcionSeleccionada) {
        cerrarMenuLateral()
      }
    }

    document.addEventListener('mousedown', backdropClickHandler)

    return () => {
      document.removeEventListener('mousedown', backdropClickHandler)
    }
  }, [opcionSeleccionada])

  // Permite abrir una burbuja flotante según el tipo
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
      const activa = b.id === id
      const minimizada = !b.minimizada
      if (activa) setBurbujaExpandida(minimizada ? null : id)
      return { ...b, minimizada: activa ? minimizada : true }
    }))
  }

  const manejarFinalizarCarga = (datos) => {
    if (burbujaExpandida) cerrarBurbuja(burbujaExpandida)
    setDatosFinalizados(datos)
    setOpcionSeleccionada('participacion-incidente')
  }

  const cerrarMenuLateral = () => {
    const sidebar = document.getElementById('sidebarMenu')
    const Offcanvas = window.bootstrap?.Offcanvas || bootstrap?.Offcanvas

    if (sidebar && Offcanvas) {
      let instancia = Offcanvas.getInstance(sidebar)
      if (!instancia) {
        instancia = new Offcanvas(sidebar)
      }
      instancia.hide()

      const backdrop = document.querySelector('.offcanvas-backdrop')
      if (backdrop) {
        backdrop.classList.remove('show')
        backdrop.remove()
      }
      document.body.classList.remove('offcanvas-backdrop', 'modal-open')
    }
  }

  // Renderiza el formulario expandido según el tipo de incidente
  const renderFormularioExpandido = () => {
    const burbuja = burbujas.find(b => b.id === burbujaExpandida)
    if (!burbuja) return null

    const props = {
      datosPrevios: burbuja.datosPrevios,
      onFinalizar: manejarFinalizarCarga
    }

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
      'registrar-rol', 'consultar-rol',
      'participacion-incidente', 'vehiculo-involucrado', 'registrar-guardia', 'consultar-grupos-guardia'
    ],
    bombero: ['cargar-incidente', 'consultar-bombero', 'participacion-incidente']
  }

  const items = [
    { key: 'cargar-incidente', label: 'Cargar Incidente' },
    { key: 'registrar-bombero', label: 'Nuevo Bombero' },
    { key: 'consultar-bombero', label: 'Consultar Bombero' },
    { key: 'registrar-usuario', label: 'Nuevo Usuario' },
    { key: 'consultar-usuario', label: 'Consultar Usuarios' },
    { key: 'registrar-rol', label: 'Registrar Rol' },
    { key: 'consultar-rol', label: 'Consultar Rol' },
    { key: 'participacion-incidente', label: 'Participación del Incidente' },
    { key: 'vehiculo-involucrado', label: 'Vehículo Involucrado' },
    { key: 'registrar-guardia', label: 'Registrar Guardia' },
    { key: 'consultar-grupos-guardia', label: 'Consultar Grupos' }
  ]

  const puedeVer = (key) => permisos[rol]?.includes(key)

  return (
    <div>
      {/* Sidebar */}
      <div className="offcanvas offcanvas-start bg-black text-white" tabIndex="-1" id="sidebarMenu">
        <div className="offcanvas-header d-flex justify-content-between px-3 py-3 sidebar-header">
          <div className="d-flex align-items-center">
            <img src={logoBomberos} alt="Logo" style={{ height: 30 }} className="me-2" />
            <span className="fs-5 fw-semibold text-white">BomberOS</span>
          </div>
          <button
            id="btnCerrarSidebar"
            className="btn btn-hamburguesa abierto d-flex flex-column justify-content-between align-items-center p-2"
            type="button"
            data-bs-dismiss="offcanvas"
            aria-label="Cerrar menú"
          >
            <span className="linea linea-top"></span>
            <span className="linea linea-middle"></span>
            <span className="linea linea-bottom"></span>
          </button>
        </div>
        <div className="offcanvas-body p-3 sidebar-body">
          <nav className="nav flex-column">
            {items.map(({ key, label }) => puedeVer(key) && (
              <button
                key={key}
                className="btn btn-menu-option text-white text-start w-100 mb-2"
                onClick={() => {
                  setOpcionSeleccionada(key)
                  cerrarMenuLateral()
                }}
              >
                {label}
              </button>
            ))}
            <hr />
            <button className="btn btn-outline-danger w-100 mt-3" onClick={handleLogOut}>
              <i className="bi bi-box-arrow-right me-2"></i> Cerrar sesión
            </button>
          </nav>
        </div>
      </div>

      {/* Topbar */}
      <header className="bg-dark border-bottom border-secondary p-3 d-flex justify-content-between align-items-center topbar">
        <button
          id='btnHamburguesa'
          className="btn btn-hamburguesa d-flex flex-column justify-content-between align-items-center p-2"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#sidebarMenu"
          aria-label="Menú"
        >
          <span className="linea linea-top"></span>
          <span className="linea linea-middle"></span>
          <span className="linea linea-bottom"></span>
        </button>
        <h1 className="h5 m-0">BomberOS - Panel Principal</h1>
        <div className="text-end">
          <span className="me-3">{nombreUsuario} - ({rol})</span>
          <img src="https://i.pravatar.cc/30" className="rounded-circle" alt="user" />
        </div>
      </header>

      {/* Contenido principal */}
      <div className="p-4">
        {burbujaExpandida ? renderFormularioExpandido() : opcionSeleccionada !== null && (
          <div className="form-wrapper">
            {opcionSeleccionada === 'cargar-incidente' && <CargarIncidente onVolver={() => setOpcionSeleccionada(null)} onNotificar={agregarBurbuja} />}
            {opcionSeleccionada === 'registrar-bombero' && <RegistrarBombero onVolver={() => setOpcionSeleccionada(null)} />}
            {opcionSeleccionada === 'consultar-bombero' && <ConsultarBombero onVolver={() => setOpcionSeleccionada(null)} />}
            {opcionSeleccionada === 'registrar-usuario' && <RegistrarUsuario onVolver={() => setOpcionSeleccionada(null)} />}
            {opcionSeleccionada === 'consultar-usuario' && <ConsultarUsuario onVolver={() => setOpcionSeleccionada(null)} />}
            {opcionSeleccionada === 'registrar-rol' && <RegistrarRol onVolver={() => setOpcionSeleccionada(null)} />}
            {opcionSeleccionada === 'consultar-rol' && <ConsultarRol onVolver={() => setOpcionSeleccionada(null)} />}
            {opcionSeleccionada === 'participacion-incidente' && (
              <ParticipacionIncidente
                datosPrevios={datosFinalizados}
                onFinalizar={() => setOpcionSeleccionada('vehiculo-involucrado')}
                onVolver={() => setOpcionSeleccionada(null)}
              />
            )}
            {opcionSeleccionada === 'vehiculo-involucrado' && <VehiculoInvolucrado onVolver={() => setOpcionSeleccionada(null)} />}
            {opcionSeleccionada === 'registrar-guardia' && <RegistrarGuardia onVolver={() => setOpcionSeleccionada(null)} />}
            {opcionSeleccionada === 'consultar-grupos-guardia' && <ConsultarGrupoGuardia onVolver={() => setOpcionSeleccionada(null)} />}
          </div>
        )}
      </div>

      {/* Burbujas flotantes */}
      {burbujas.map((b, i) => (
        <div key={b.id} style={{ position: 'fixed', right: `${20 + i * 370}px`, bottom: 0, zIndex: 9999 }}>
          <BurbujaFormulario {...b} onCerrar={cerrarBurbuja} onToggleMinimizada={toggleMinimizada} />
        </div>
      ))}
    </div>
  )
}

export default Menu
