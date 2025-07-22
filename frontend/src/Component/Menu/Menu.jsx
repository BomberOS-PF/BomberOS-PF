import React, { useState, useEffect, useRef } from 'react'
import './Menu.css'
import * as bootstrap from 'bootstrap'
import { useNavigate } from 'react-router-dom'

import CargarIncidente from '../Incidente/CargarIncidente/CargarIncidente'
import RegistrarBombero from '../Bombero/RegistrarBombero/RegistrarBombero'
import ConsultarBombero from '../Bombero/ConsultarBombero/ConsultarBombero'
import RegistrarUsuario from '../Usuario/RegistrarUsuario/RegistrarUsuario'
import ConsultarUsuario from '../Usuario/ConsultarUsuario/ConsultarUsuario'
import RegistrarRol from '../Rol/RegistrarRol'
import ConsultarRol from '../Rol/ConsultarRol'
import RegistrarGuardia from '../Guardia/RegistrarGuardia/RegistrarGuardia'
import ConsultarGrupoGuardia from '../Guardia/ConsultarGuardia/ConsultarGrupoGuardia'

const Menu = () => {
  const [opcionSeleccionada, setOpcionSeleccionada] = useState('')
  const [usuario, setUsuario] = useState(null)
  const [mostrarDropdown, setMostrarDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const datosUsuario = localStorage.getItem('usuario')
    if (datosUsuario) {
      try {
        setUsuario(JSON.parse(datosUsuario))
      } catch (e) {
        console.error('Error al parsear usuario:', e)
      }
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMostrarDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const cerrarOffcanvas = () => {
    const sidebar = document.getElementById('sidebarMenu')
    const Offcanvas = bootstrap.Offcanvas
    if (sidebar && Offcanvas) {
      const instancia = Offcanvas.getInstance(sidebar) || new Offcanvas(sidebar)
      instancia.hide()
    }
  }

  const cerrarSesion = () => {
    localStorage.clear()
    navigate('/login')
  }

  const renderContenido = () => {
    switch (opcionSeleccionada) {
      case 'cargarIncidente': return <CargarIncidente onVolver={() => setOpcionSeleccionada('')} />
      case 'registrarBombero': return <RegistrarBombero onVolver={() => setOpcionSeleccionada('')} />
      case 'consultarBombero': return <ConsultarBombero onVolver={() => setOpcionSeleccionada('')} />
      case 'registrarUsuario': return <RegistrarUsuario onVolver={() => setOpcionSeleccionada('')} />
      case 'consultarUsuario': return <ConsultarUsuario onVolver={() => setOpcionSeleccionada('')} />
      case 'registrarRol': return <RegistrarRol onVolver={() => setOpcionSeleccionada('')} />
      case 'consultarRol': return <ConsultarRol onVolver={() => setOpcionSeleccionada('')} />
      case 'registrarGuardia': return <RegistrarGuardia onVolver={() => setOpcionSeleccionada('')} />
      case 'consultarGuardia': return <ConsultarGrupoGuardia onVolver={() => setOpcionSeleccionada('')} />
    }
  }

  return (
    <div>
      <nav className="navbar navbar-dark bg-dark fixed-top">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <button
              className="navbar-toggler me-3"
              type="button"
              data-bs-toggle="offcanvas"
              data-bs-target="#sidebarMenu"
              aria-controls="sidebarMenu"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="logo-bomberos-container">
              <img src="/img/logo-bomberos.png" alt="Logo Bomberos" />
              <span className="navbar-brand mb-0 h1">BomberOS</span>
            </div>
          </div>
          {usuario && (
            <div className="d-flex align-items-center position-relative" ref={dropdownRef}>
              <span className="text-white me-2">
                {usuario.nombre} {usuario.apellido}
              </span>
              <button
                className="btn btn-light rounded-circle avatar-boton"
                onClick={() => setMostrarDropdown(!mostrarDropdown)}
              >
                <i className="bi bi-person-fill"></i>
              </button>
              {mostrarDropdown && (
                <ul className="dropdown-menu show user-dropdown">
                  <li><button className="dropdown-item" disabled>Mi perfil</button></li>
                  <li><button className="dropdown-item" disabled>Configuración</button></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><button className="dropdown-item" onClick={cerrarSesion}><i className="bi bi-box-arrow-right me-2"></i>Cerrar sesión</button></li>
                </ul>
              )}
            </div>
          )}
        </div>
      </nav>

      <div className="offcanvas offcanvas-start bg-dark text-white d-flex flex-column" tabIndex="-1" id="sidebarMenu">
        <div className="offcanvas-header">
          <h5 className="offcanvas-title">Menú</h5>
          <button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Cerrar"></button>
        </div>
        <div className="offcanvas-body flex-grow-1">
          <div className="accordion accordion-flush" id="sidebarAccordion">

            {/* Incidentes */}
            <div className="accordion-item bg-dark border-0">
              <h2 className="accordion-header">
                <button className="accordion-button collapsed bg-dark text-white" type="button" data-bs-toggle="collapse" data-bs-target="#collapseIncidente">
                  <i className="bi bi-fire me-2"></i>Incidentes
                </button>
              </h2>
              <div id="collapseIncidente" className="accordion-collapse collapse" data-bs-parent="#sidebarAccordion">
                <div className="accordion-body p-0">
                  <button className="menu-btn" onClick={() => { setOpcionSeleccionada('cargarIncidente'); cerrarOffcanvas() }}>
                    Cargar Incidente
                  </button>
                </div>
              </div>
            </div>

            {/* Bomberos */}
            <div className="accordion-item bg-dark border-0">
              <h2 className="accordion-header">
                <button className="accordion-button collapsed bg-dark text-white" type="button" data-bs-toggle="collapse" data-bs-target="#collapseBomberos">
                  <i className="bi bi-person-badge me-2"></i>Bomberos
                </button>
              </h2>
              <div id="collapseBomberos" className="accordion-collapse collapse" data-bs-parent="#sidebarAccordion">
                <div className="accordion-body p-0">
                  <button className="menu-btn" onClick={() => { setOpcionSeleccionada('registrarBombero'); cerrarOffcanvas() }}>
                    Registrar Bombero
                  </button>
                  <button className="menu-btn" onClick={() => { setOpcionSeleccionada('consultarBombero'); cerrarOffcanvas() }}>
                    Consultar Bombero
                  </button>
                </div>
              </div>
            </div>

            {/* Usuarios y Roles */}
            <div className="accordion-item bg-dark border-0">
              <h2 className="accordion-header">
                <button className="accordion-button collapsed bg-dark text-white" type="button" data-bs-toggle="collapse" data-bs-target="#collapseUsuarios">
                  <i className="bi bi-person-circle me-2"></i>Usuarios y Roles
                </button>
              </h2>
              <div id="collapseUsuarios" className="accordion-collapse collapse" data-bs-parent="#sidebarAccordion">
                <div className="accordion-body p-0">
                  <button className="menu-btn" onClick={() => { setOpcionSeleccionada('registrarUsuario'); cerrarOffcanvas() }}>
                    Registrar Usuario
                  </button>
                  <button className="menu-btn" onClick={() => { setOpcionSeleccionada('consultarUsuario'); cerrarOffcanvas() }}>
                    Consultar Usuario
                  </button>
                  <button className="menu-btn" onClick={() => { setOpcionSeleccionada('registrarRol'); cerrarOffcanvas() }}>
                    Registrar Rol
                  </button>
                  <button className="menu-btn" onClick={() => { setOpcionSeleccionada('consultarRol'); cerrarOffcanvas() }}>
                    Consultar Rol
                  </button>
                </div>
              </div>
            </div>

            {/* Guardias */}
            <div className="accordion-item bg-dark border-0">
              <h2 className="accordion-header">
                <button className="accordion-button collapsed bg-dark text-white" type="button" data-bs-toggle="collapse" data-bs-target="#collapseGuardias">
                  <i className="bi bi-clock-history me-2"></i>Guardias
                </button>
              </h2>
              <div id="collapseGuardias" className="accordion-collapse collapse" data-bs-parent="#sidebarAccordion">
                <div className="accordion-body p-0">
                  <button className="menu-btn" onClick={() => { setOpcionSeleccionada('registrarGuardia'); cerrarOffcanvas() }}>
                    Registrar Guardia
                  </button>
                  <button className="menu-btn" onClick={() => { setOpcionSeleccionada('consultarGuardia'); cerrarOffcanvas() }}>
                    Consultar Guardia
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <main className="container mt-5 pt-5">
        {renderContenido()}
      </main>
    </div>
  )
}

export default Menu
