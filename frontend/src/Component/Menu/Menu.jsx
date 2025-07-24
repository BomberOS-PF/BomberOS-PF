import React, { useState, useEffect, useRef } from 'react'
import './Menu.css'
import * as bootstrap from 'bootstrap'
import { useNavigate } from 'react-router-dom'
import ParticlesBackground from '../ParticlesBackground/ParticlesBackground'

import CargarIncidente from '../Incidente/CargarIncidente/CargarIncidente'
import RegistrarBombero from '../Bombero/RegistrarBombero/RegistrarBombero'
import ConsultarBombero from '../Bombero/ConsultarBombero/ConsultarBombero'
import RegistrarUsuario from '../Usuario/RegistrarUsuario/RegistrarUsuario'
import ConsultarUsuario from '../Usuario/ConsultarUsuario/ConsultarUsuario'
import RegistrarRol from '../Rol/RegistrarRol'
import ConsultarRol from '../Rol/ConsultarRol'
import RegistrarGuardia from '../Guardia/RegistrarGuardia/RegistrarGuardia'
import ConsultarGrupoGuardia from '../Guardia/ConsultarGuardia/ConsultarGrupoGuardia'
import BurbujaFormulario from '../BurbujaFormulario/BurbujaFormulario'
import AccidenteTransito from '../Incidente/TipoIncidente/AccidenteTransito/AccidenteTransito'
import FactorClimatico from '../Incidente/TipoIncidente/FactorClimatico/FactorClimatico'
import IncendioEstructural from '../Incidente/TipoIncidente/IncendioEstructural/IncendioEstructural'
import IncendioForestal from '../Incidente/TipoIncidente/IncendioForestal/IncendioForestal'
import MaterialPeligroso from '../Incidente/TipoIncidente/MaterialPeligroso/MaterialPeligroso'
import Rescate from '../Incidente/TipoIncidente/Rescate/Rescate'
import ParticipacionIncidente from '../Incidente/ParticipacionIncidente/ParticipacionIncidente'
import VehiculoInvolucrado from '../VehiculoInvolucrado/VehiculoInvolucrado'

const Menu = ({user, setUser}) => {
  const [opcionSeleccionada, setOpcionSeleccionada] = useState('')
  const [usuario, setUsuario] = useState(null)
  const [mostrarDropdown, setMostrarDropdown] = useState(false)
  const [acordeonAbierto, setAcordeonAbierto] = useState(null)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()
  const [burbujas, setBurbujas] = useState([])
  const [burbujaExpandida, setBurbujaExpandida] = useState(null)
  const [datosFinalizados, setDatosFinalizados] = useState(null)

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
          const backdrop = document.querySelector('.offcanvas-backdrop')
          if (backdrop) backdrop.remove()
          document.body.classList.remove('offcanvas-backdrop', 'modal-open')
        }, 300)
      }
    }

    document.addEventListener('mousedown', handleClickOutsideMenu)
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideMenu)
    }
  }, [])

  useEffect(() => {
    const sidebar = document.getElementById('sidebarMenu')

    const handleOffcanvasHidden = () => {
      const backdrop = document.querySelector('.offcanvas-backdrop')
      if (backdrop) backdrop.remove()
      document.body.classList.remove('offcanvas-backdrop', 'modal-open')
    }

    if (sidebar) {
      sidebar.addEventListener('hidden.bs.offcanvas', handleOffcanvasHidden)
    }

    return () => {
      if (sidebar) {
        sidebar.removeEventListener('hidden.bs.offcanvas', handleOffcanvasHidden)
      }
    }
  }, [])

  const agregarBurbuja = (tipo, datosPrevios) => {
    const id = datosPrevios?.id || Date.now()
    const yaExiste = burbujas.find(b => b.id === id)
    if (!yaExiste) {
      setBurbujas(prev => [...prev, { id, tipo, datosPrevios, minimizada: true }])
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

  const usuarioActual = usuario || JSON.parse(localStorage.getItem('usuario')) || {}
  const rol = usuarioActual.rol || 'desconocido'

  const permisos = {
    administrador: [/* todas las opciones */],
    bombero: ['cargarIncidente', 'consultarBombero', 'participacion-incidente']
  }
  const puedeVer = (clave) => permisos[rol]?.includes(clave)

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
    setUser(null)
    navigate('/login')
  }

  const renderContenido = () => {
    switch (opcionSeleccionada) {
      case 'cargarIncidente': return (<CargarIncidente onVolver={() => setOpcionSeleccionada('')} onNotificar={agregarBurbuja}/>)
      case 'registrarBombero': return (<RegistrarBombero onVolver={() => setOpcionSeleccionada('')} onNotificar={agregarBurbuja}/>)
      case 'consultarBombero': return (<ConsultarBombero onVolver={() => setOpcionSeleccionada('')} onNotificar={agregarBurbuja}/>)
      case 'registrarUsuario': return (<RegistrarUsuario onVolver={() => setOpcionSeleccionada('')} onNotificar={agregarBurbuja}/>)
      case 'consultarUsuario': return (<ConsultarUsuario onVolver={() => setOpcionSeleccionada('')} onNotificar={agregarBurbuja}/>)
      case 'registrarRol': return (<RegistrarRol onVolver={() => setOpcionSeleccionada('')} onNotificar={agregarBurbuja}/>)
      case 'consultarRol': return (<ConsultarRol onVolver={() => setOpcionSeleccionada('')} onNotificar={agregarBurbuja}/>)
      case 'registrarGuardia': return (<RegistrarGuardia onVolver={() => setOpcionSeleccionada('')} onNotificar={agregarBurbuja}/>)
      case 'consultarGuardia': return (<ConsultarGrupoGuardia onVolver={() => setOpcionSeleccionada('')} onNotificar={agregarBurbuja}/>)
      case 'participacion-incidente':
        return <ParticipacionIncidente
          datosPrevios={datosFinalizados}
          onFinalizar={() => setOpcionSeleccionada('vehiculo-involucrado')}
          onVolver={() => setOpcionSeleccionada(null)}
        />
      case 'vehiculo-involucrado':
        return <VehiculoInvolucrado onVolver={() => setOpcionSeleccionada(null)} />
    }
  }

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
          {usuario && (
            <div className="d-flex align-items-center position-relative" ref={dropdownRef}>
              <span className="text-white me-2">{usuario.nombre} {usuario.apellido}</span>
              <button className="btn btn-light rounded-circle avatar-boton" onClick={() => setMostrarDropdown(!mostrarDropdown)}>
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
            {[{
              id: 'collapseIncidente',
              icono: 'bi-fire',
              titulo: 'Incidentes',
              botones: [{ texto: 'Cargar Incidente', accion: 'cargarIncidente' }]
            }, {
              id: 'collapseBomberos',
              icono: 'bi-person-badge',
              titulo: 'Bomberos',
              botones: [
                { texto: 'Registrar Bombero', accion: 'registrarBombero' },
                { texto: 'Consultar Bombero', accion: 'consultarBombero' }
              ]
            }, {
              id: 'collapseUsuarios',
              icono: 'bi-person-circle',
              titulo: 'Usuarios y Roles',
              botones: [
                { texto: 'Registrar Usuario', accion: 'registrarUsuario' },
                { texto: 'Consultar Usuario', accion: 'consultarUsuario' },
                { texto: 'Registrar Rol', accion: 'registrarRol' },
                { texto: 'Consultar Rol', accion: 'consultarRol' }
              ]
            }, {
              id: 'collapseGuardias',
              icono: 'bi-clock-history',
              titulo: 'Guardias',
              botones: [
                { texto: 'Registrar Guardia', accion: 'registrarGuardia' },
                { texto: 'Consultar Guardia', accion: 'consultarGuardia' }
              ]
            }].map(({ id, icono, titulo, botones }) => (
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
                <div
                  id={id}
                  className="accordion-collapse collapse"
                  data-bs-parent="#sidebarAccordion"
                >
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

      <main className={`container ${opcionSeleccionada || burbujaExpandida ? 'centrado' : ''}`}>
        {burbujaExpandida ? renderFormularioExpandido() : renderContenido()}
      </main>
      {burbujas.map((b, i) => (
        <div key={b.id} style={{ position: 'fixed', right: `${20 + i * 370}px`, bottom: 0, zIndex: 9999 }}>
          <BurbujaFormulario {...b} onCerrar={cerrarBurbuja} onToggleMinimizada={toggleMinimizada} />
        </div>
      ))}
    </div>
  )
}

export default Menu
