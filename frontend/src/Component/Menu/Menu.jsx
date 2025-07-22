import React, { useState, useEffect, useRef } from 'react'
import './Menu.css'
import logoBomberos from '/img/logo-bomberos.png'
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
      default:
        return (
          <div className="text-white text-center mt-5">
            <h2>Bienvenido a BomberOS</h2>
            <p>Seleccione una opción del menú</p>
          </div>
        )
    }
  }

  return (
    <div>
      {/* Navbar superior */}
      <nav className="navbar navbar-dark bg-dark fixed-top">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <div>
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="offcanvas"
              data-bs-target="#sidebarMenu"
              aria-controls="sidebarMenu"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <span className="navbar-brand ms-3">BomberOS</span>
          </div>
          {usuario && (
            <div className="d-flex align-items-center position-relative" ref={dropdownRef}>
              <span className="text-white me-2">
                {usuario.nombre} {usuario.apellido}
              </span>
              <button
                className="btn btn-light rounded-circle"
                style={{ width: '38px', height: '38px', padding: 0 }}
                onClick={() => setMostrarDropdown(!mostrarDropdown)}
              >
                <i className="bi bi-person-fill" style={{ fontSize: '1.2rem' }}></i>
              </button>
              {mostrarDropdown && (
                <ul className="dropdown-menu show mt-2 position-absolute end-0 shadow-sm border-0 overflow-visible" style={{ minWidth: '12rem', top: '100%' }}>
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

      {/* Menú lateral */}
      <div className="offcanvas offcanvas-start bg-dark text-white d-flex flex-column" tabIndex="-1" id="sidebarMenu">
        <div className="offcanvas-header">
          <h5 className="offcanvas-title">Menú</h5>
          <button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Cerrar"></button>
        </div>
        <div className="offcanvas-body flex-grow-1">
          <ul className="nav flex-column">
            <li className="nav-item"><button className="btn btn-link text-white" onClick={() => { setOpcionSeleccionada('cargarIncidente'); cerrarOffcanvas() }}>Cargar Incidente</button></li>
            <li className="nav-item"><button className="btn btn-link text-white" onClick={() => { setOpcionSeleccionada('registrarBombero'); cerrarOffcanvas() }}>Registrar Bombero</button></li>
            <li className="nav-item"><button className="btn btn-link text-white" onClick={() => { setOpcionSeleccionada('consultarBombero'); cerrarOffcanvas() }}>Consultar Bombero</button></li>
            <li className="nav-item"><button className="btn btn-link text-white" onClick={() => { setOpcionSeleccionada('registrarUsuario'); cerrarOffcanvas() }}>Registrar Usuario</button></li>
            <li className="nav-item"><button className="btn btn-link text-white" onClick={() => { setOpcionSeleccionada('consultarUsuario'); cerrarOffcanvas() }}>Consultar Usuario</button></li>
            <li className="nav-item"><button className="btn btn-link text-white" onClick={() => { setOpcionSeleccionada('registrarRol'); cerrarOffcanvas() }}>Registrar Rol</button></li>
            <li className="nav-item"><button className="btn btn-link text-white" onClick={() => { setOpcionSeleccionada('consultarRol'); cerrarOffcanvas() }}>Consultar Rol</button></li>
            <li className="nav-item"><button className="btn btn-link text-white" onClick={() => { setOpcionSeleccionada('registrarGuardia'); cerrarOffcanvas() }}>Registrar Guardia</button></li>
            <li className="nav-item"><button className="btn btn-link text-white" onClick={() => { setOpcionSeleccionada('consultarGuardia'); cerrarOffcanvas() }}>Consultar Guardia</button></li>
          </ul>
        </div>
      </div>

      {/* Contenido principal */}
      <main className="container mt-5 pt-5">
        {renderContenido()}
      </main>
    </div>
  )
}

export default Menu
