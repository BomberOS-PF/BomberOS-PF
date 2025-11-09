import React, { useState, useEffect, useRef } from 'react'
import './Menu.css'
import * as bootstrap from 'bootstrap'
import { useNavigate } from 'react-router-dom'
import ParticlesBackground from '../ParticlesBackground/ParticlesBackground'

import CargarIncidente from '../Incidente/CargarIncidente/CargarIncidente'
import ConsultarIncidente from '../Incidente/ConsultarIncidente/ConsultarIncidente'
import RegistrarBombero from '../Bombero/RegistrarBombero/RegistrarBombero'
import ConsultarBombero from '../Bombero/ConsultarBombero/ConsultarBombero'
import RegistrarUsuario from '../Usuario/RegistrarUsuario/RegistrarUsuario'
import ConsultarUsuario from '../Usuario/ConsultarUsuario/ConsultarUsuario'
import RegistrarRol from '../Rol/RegistrarRol'
import ConsultarRol from '../Rol/ConsultarRol'
import RegistrarGuardia from '../Guardia/RegistrarGuardia/RegistrarGuardia'
import ConsultarGrupoGuardia from '../Guardia/ConsultarGuardia/ConsultarGrupoGuardia'
import GestionarGuardias from '../Guardia/GestionarGuardias/GestionarGuardia'

import ParticipacionIncidente from '../Incidente/ParticipacionIncidente/ParticipacionIncidente'
import VehiculoInvolucrado from '../VehiculoInvolucrado/VehiculoInvolucrado'
import DashboardRespuestas from '../Respuestas/DashboardRespuestas'

import CalendarioGuardias from '../Guardia/CalendarioGuardias/CalendarioGuardias'
import MisGuardias from '../Guardia/MisGuardias/MisGuardias'
import ReporteIncidentes from '../Reportes/ReporteIncidentes/ReporteIncidentes'

/* ==== NUEVO: Flota (ABMC + Controles) ==== */
import ListarMoviles from '../Flota/Moviles/ListarMovil'
import NuevoControlMovil from '../Flota/Controles/NuevoControlMovil'
import ControlMovilSemanal from '../Flota/Controles/ControlMovilSemanal'
import ControlesMain from '../Flota/Controles/ControlesPanel'


const Menu = ({ user, setUser }) => {
  const [opcionSeleccionada, setOpcionSeleccionada] = useState('')
  const [usuario, setUsuario] = useState(null)
  const [mostrarDropdown, setMostrarDropdown] = useState(false)
  const [acordeonAbierto, setAcordeonAbierto] = useState(null)
  const dropdownRef = useRef(null)
  const dropdownRef2 = useRef(null)
  const navigate = useNavigate()

  const [datosFinalizados, setDatosFinalizados] = useState(null)

  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null)
  const [grupoAGestionar, setGrupoAGestionar] = useState(null)



  // Usuario actual y rol
  const usuarioActual = user || JSON.parse(localStorage.getItem('usuario')) || {}
  const nombreUsuario = usuarioActual.usuario || 'Usuario'
  const rol = usuarioActual.rol || 'desconocido'
  const isBombero = rol === 'bombero'
  const [target, setTarget] = useState('consultar-incidente')

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
      if (dropdownRef2.current && !dropdownRef2.current.contains(event.target)) {
        setMostrarDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleClickOutsideMenu = (event) => {
      const sidebar = document.getElementById('sidebarMenu')
      const backdrop = document.querySelector('.offcanvas-backdrop')

      if (sidebar && !sidebar.contains(event.target) && backdrop) {
        const Offcanvas = bootstrap.Offcanvas
        const instancia = Offcanvas.getInstance(sidebar) || new Offcanvas(sidebar)
        instancia.hide()

        const items = document.querySelectorAll('#sidebarAccordion .accordion-collapse.show')
        items.forEach(item => {
          const instance = bootstrap.Collapse.getInstance(item)
          if (instance) instance.hide()
        })

        setAcordeonAbierto(null)

        setTimeout(() => {
          const backdrop2 = document.querySelector('.offcanvas-backdrop')
          if (backdrop2) backdrop2.remove()
          document.body.classList.remove('offcanvas-backdrop', 'modal-open')
        }, 300)
      }
    }

    document.addEventListener('mousedown', handleClickOutsideMenu)
    return () => document.removeEventListener('mousedown', handleClickOutsideMenu)
  }, [])

  useEffect(() => {
    const sidebar = document.getElementById('sidebarMenu')
    const handleOffcanvasHidden = () => {
      const backdrop = document.querySelector('.offcanvas-backdrop')
      if (backdrop) backdrop.remove()
      document.body.classList.remove('offcanvas-backdrop', 'modal-open')
    }
    if (sidebar) sidebar.addEventListener('hidden.bs.offcanvas', handleOffcanvasHidden)
    return () => {
      if (sidebar) sidebar.removeEventListener('hidden.bs.offcanvas', handleOffcanvasHidden)
    }
  }, [])

  const manejarNotificacion = (tipo, datosPrevios) => {
    console.log('Notificación enviada:', tipo, datosPrevios)
  }

  const permisos = {
    administrador: ['*'],
    bombero: [
      'cargarIncidente',
      'consultarIncidente',
      'mis-guardias'
    ]
  }
  const puedeVer = clave => permisos[rol]?.includes('*') || permisos[rol]?.includes(clave)

  const toggleAcordeon = (id) => {
    const target = document.getElementById(id)
    if (!target) return
    const instancia = bootstrap.Collapse.getInstance(target)
    if (acordeonAbierto === id && instancia) {
      instancia.hide()
      setAcordeonAbierto(null)
    } else {
      if (!instancia) new bootstrap.Collapse(target, { toggle: true })
      else instancia.show()
      setAcordeonAbierto(id)
    }
  }

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
    setUser && setUser(null)
    navigate('/login')
  }

  const renderContenido = () => {
    switch (opcionSeleccionada) {
      case 'cargarIncidente':
        return <CargarIncidente onVolver={(opcion) => setOpcionSeleccionada(opcion || null)} onNotificar={manejarNotificacion} />
      case 'registrarBombero':
        return <RegistrarBombero onVolver={() => setOpcionSeleccionada(null)} />
      case 'consultarBombero':
        return <ConsultarBombero onVolver={() => setOpcionSeleccionada(null)} />
      case 'registrarUsuario':
        return <RegistrarUsuario onVolver={() => setOpcionSeleccionada(null)} />
      case 'consultarUsuario':
        return <ConsultarUsuario onVolver={() => setOpcionSeleccionada(null)} />
      case 'registrarRol':
        return <RegistrarRol onVolver={() => setOpcionSeleccionada(null)} />
      case 'consultarRol':
        return <ConsultarRol onVolver={() => setOpcionSeleccionada(null)} />
      case 'registrarGuardia':
        return <RegistrarGuardia onVolver={() => setOpcionSeleccionada(null)} />
      case 'consultarGuardia':
        return (
          <ConsultarGrupoGuardia
            onVolver={() => setOpcionSeleccionada(null)}
            onIrAGestionarGuardias={(grupo) => {
              setGrupoSeleccionado(grupo)
              setOpcionSeleccionada('gestionar-guardias')
            }}
          />
        )
      case 'gestionar-guardias':
        return grupoSeleccionado
          ? (
            rol === 'administrador'
              ? (
                <GestionarGuardias
                  idGrupo={grupoSeleccionado.idGrupo}
                  nombreGrupo={grupoSeleccionado.nombreGrupo}
                  bomberos={grupoSeleccionado.bomberos}
                  onVolver={() => {
                    setOpcionSeleccionada('consultar-grupos-guardia')
                    setGrupoSeleccionado(null)
                  }}
                />
              )
              : (
                <>
                  <div className="alert alert-danger text-center mt-4">
                    No tenés permisos para acceder a esta sección. Cerrando sesión...
                  </div>
                  {setTimeout(() => cerrarSesion(), 3000)}
                </>
              )
          )
          : null
      case 'participacion-incidente':
        return (
          <ParticipacionIncidente
            datosPrevios={datosFinalizados}
            onFinalizar={() => setOpcionSeleccionada('vehiculo-involucrado')}
            onVolver={() => setOpcionSeleccionada(null)}
          />
        )
      case 'vehiculo-involucrado':
        return <VehiculoInvolucrado onVolver={() => setOpcionSeleccionada(null)} />
      case 'consultarIncidente':
        return <ConsultarIncidente onVolverMenu={() => setOpcionSeleccionada('')} />
      case 'dashboard-respuestas':
        return <DashboardRespuestas onVolver={() => setOpcionSeleccionada(null)} />
      case 'mis-guardias':
        return <MisGuardias />
      case 'cal-guardias':
        return (
          <CalendarioGuardias
            dniUsuario={usuario?.dni ?? usuarioActual?.dni}
            titulo="Calendario de Guardias"
          />
        )
      case 'reporte-incidentes':
        return <ReporteIncidentes onVolver={() => setOpcionSeleccionada(null)} />
       case 'flota-moviles':
      return <ListarMoviles key="flota-moviles" />

      /* ==== NUEVO: Flota ==== */
          case 'flota-nuevo-control':
      return <ControlesMain key="flota-nuevo" initialView="new" />
    case 'flota-control':
      return <ControlesMain key="flota-control" initialView="control" />
      

      default:
        return isBombero
          ? (
            <CalendarioGuardias
              dniUsuario={usuario?.dni ?? usuarioActual?.dni}
              titulo="Calendario de Guardias"
            />
          )
          : (
            <CalendarioGuardias
              dniUsuario={usuario?.dni ?? usuarioActual?.dni}
              titulo="Tus Guardias"
            />
          )
    }
  }

  // ===== Construcción dinámica de secciones según rol =====

  const secciones = [
    {
      id: 'collapseIncidente',
      icono: 'bi-fire',
      titulo: 'Incidentes',
      botones: [
        { texto: 'Cargar Incidente', accion: 'cargarIncidente' },
        { texto: 'Consultar Incidentes', accion: 'consultarIncidente' }
      ]
    },
    {
      id: 'collapseBomberos',
      icono: 'bi-person-badge',
      titulo: 'Bomberos',
      botones: [
        { texto: 'Registrar Bombero', accion: 'registrarBombero' },
        { texto: 'Consultar Bomberos', accion: 'consultarBombero' }
      ]
    },
    {
      id: 'collapseUsuarios',
      icono: 'bi-person-circle',
      titulo: 'Usuarios y Roles',
      botones: [
        { texto: 'Registrar Usuario', accion: 'registrarUsuario' },
        { texto: 'Consultar Usuarios', accion: 'consultarUsuario' },
        { texto: 'Registrar Rol', accion: 'registrarRol' },
        { texto: 'Consultar Roles', accion: 'consultarRol' }
      ]
    },
    {
      id: 'collapseGuardias',
      icono: 'bi-clock-history',
      titulo: 'Guardias',
      botones: rol === 'administrador'
        ? [
            { texto: 'Registrar Grupo', accion: 'registrarGuardia' },
            { texto: 'Consultar Grupos', accion: 'consultarGuardia' },
            { texto: 'Mis guardias', accion: 'mis-guardias' }
          ]
        : isBombero
          ? [{ texto: 'Mis guardias', accion: 'mis-guardias' }]
          : [
              { texto: 'Registrar Grupo', accion: 'registrarGuardia' },
              { texto: 'Consultar Grupos', accion: 'consultarGuardia' }
            ]
    },
    {
      id: 'collapseFlota',                // NUEVO
      icono: 'bi-truck',                  // requiere Bootstrap Icons
      titulo: 'Flota',
      botones: [
        { texto: 'Gestionar Móviles', accion: 'flota-moviles' },
        { texto: 'Nuevo control de móvil', accion: 'flota-nuevo-control' }
      ]
    },
    {
      id: 'collapseNotificaciones',
      icono: 'bi-bell',
      titulo: 'Notificaciones',
      botones: [
        { texto: 'Dashboard Respuestas', accion: 'dashboard-respuestas' }
      ]
    },
    {
      id: 'collapseReportes',
      icono: 'bi-bar-chart-line',
      titulo: 'Reportes',
      botones: [
        { texto: 'Incidentes por tipo', accion: 'reporte-incidentes' }
      ]
    }
  ]

  const seccionesVisibles = secciones
    .map(sec => ({ ...sec, botones: sec.botones.filter(b => puedeVer(b.accion)) }))
    .filter(sec => sec.botones.length > 0)

  return (
    <div>
      <ParticlesBackground />

      <nav className="navbar navbar-dark bg-dark fixed-top">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <button
              className="navbar-toggler me-3"
              type="button"
              onClick={() => {
                const sidebar = document.getElementById('sidebarMenu')
                const Offcanvas = bootstrap.Offcanvas
                if (sidebar && Offcanvas) {
                  const instancia = Offcanvas.getInstance(sidebar) || new Offcanvas(sidebar)
                  instancia.show()
                }
              }}
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="logo-bomberos-container">
              <img src="/img/logo-bomberos.png" alt="Logo Bomberos" />
              <span className="navbar-brand mb-0 h1">BomberOS</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="offcanvas offcanvas-start bg-dark text-white d-flex flex-column" tabIndex="-1" id="sidebarMenu">
        <div className="offcanvas-header">
          <h5 className="offcanvas-title">Menú</h5>
          <button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Cerrar"></button>
        </div>

        <div className="offcanvas-body flex-grow-1">
          {usuario && (
            <div className="offcanvas-profile d-flex align-items-center justify-content-between mb-3" ref={dropdownRef2}>
              <div className="d-flex align-items-center gap-2">
                <button
                  className="btn btn-light rounded-circle avatar-boton d-flex align-items-center justify-content-center p-0"
                  onClick={() => setMostrarDropdown(!mostrarDropdown)}
                >
                  <i className="bi bi-person-fill"></i>
                </button>
                <div className="d-flex flex-column">
                  <span className="fw-semibold">{usuario.nombre} {usuario.apellido}</span>
                  <small className="text-secondary">{rol}</small>
                </div>
              </div>

              {mostrarDropdown && (
                <ul className="dropdown-menu show user-dropdown">
                  <li><button className="dropdown-item" disabled>Mi perfil</button></li>
                  <li><button className="dropdown-item" disabled>Configuración</button></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item" onClick={cerrarSesion}>
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Cerrar sesión
                    </button>
                  </li>
                </ul>
              )}
            </div>
          )}

          <div className="accordion accordion-flush" id="sidebarAccordion">
            {seccionesVisibles.map(({ id, icono, titulo, botones }) => (
              <div key={id} className="accordion-item bg-dark border-0">
                <h2 className="accordion-header">
                  <button
                    className={`accordion-button bg-dark text-white ${acordeonAbierto !== id ? 'collapsed' : ''}`}
                    type="button"
                    onClick={() => toggleAcordeon(id)}
                  >
                    <i className={`bi ${icono} me-2`}></i>{titulo}
                  </button>
                </h2>
                <div id={id} className="accordion-collapse collapse" data-bs-parent="#sidebarAccordion">
                  <div className="accordion-body p-0">
                    {botones.map(b => (
                      <button
                        key={b.accion}
                        className="menu-btn"
                        onClick={() => {
                          setOpcionSeleccionada(b.accion)
                          cerrarOffcanvas()
                        }}
                      >
                        {b.texto}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className={`container ${opcionSeleccionada ? 'centrado' : ''}`}>
        {renderContenido()}
      </main>
    </div>
  )
}

export default Menu
