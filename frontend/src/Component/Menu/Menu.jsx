import React, { useState } from 'react'
import './Menu.css'
import { useNavigate } from 'react-router-dom'

const Menu = ({ user, setUser }) => {
  const [seccion, setSeccion] = useState('inicio')
  const navigate = useNavigate()

  const handleLogOut = () => {
    setUser('')
    navigate('/login')
  }
  
  return (
    <>
      {/* Botón hamburguesa en la esquina superior izquierda */}
      <button
        className="btn btn-dark position-fixed top-0 start-0 m-3"
        type="button"
        data-bs-toggle="offcanvas"
        data-bs-target="#sidebarMenu"
        aria-controls="sidebarMenu"
      >
        ☰
      </button>

      {/* Offcanvas menu lateral izquierdo */}
      <div
        className="offcanvas offcanvas-start text-bg-dark"
        tabIndex="-1"
        id="sidebarMenu"
        aria-labelledby="sidebarMenuLabel"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="sidebarMenuLabel">Bienvenido, {user.user}</h5>
          <button type="button" className="btn-close btn-close-white" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>

        <div className="offcanvas-body d-flex flex-column gap-2">
          {[
            { label: 'Registrar Bombero', path: '/registrar-bombero' },
            { label: 'Registrar Usuario', path: '/registrar-usuario' },
            { label: 'Cargar Incidente', path: '/cargar-incidente' },
            { label: 'Registrar Rol', path: '/registrar-rol' },
            { label: 'Accidente de Tránsito', path: '/accidente-transito' },
            { label: 'Factores Climáticos', path: '/factor-climatico' },
            { label: 'Incendio Estructural', path: '/incendio-estructural' },
            { label: 'Incendio Forestal', path: '/incendio-forestal' },
            { label: 'Material Peligroso', path: '/material-peligroso' },
            { label: 'Rescate', path: '/rescate' },
            { label: 'Participación en Incidente', path: '/participacion-incidente' },
            { label: 'Vehículo Involucrado', path: '/vehiculo-involucrado' }
          ].map(({ label, path }) => (
            <button
              key={path}
              className="btn btn-outline-light text-start"
              onClick={() => {
                navigate(path)
                document.querySelector('.offcanvas').classList.remove('show') // opcional: cerrar sidebar tras clic
              }}
            >
              {label}
            </button>
          ))}

          <hr />
          <button className="btn btn-danger mt-3" onClick={handleLogOut}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </>
  )

  // return (
  //   <div className="menu-container">
  //     <h1>Bienvenido</h1>
  //     <h2>{user.user}</h2>

  //     <div className="menu-buttons d-flex flex-wrap justify-content-center gap-3">
  //       {[
  //         { label: 'Registrar Bombero', path: '/registrar-bombero' },
  //         { label: 'Registrar Usuario', path: '/registrar-usuario' },
  //         { label: 'Cargar Incidente', path: '/cargar-incidente' },
  //         { label: 'Registrar Rol', path: '/registrar-rol' },
  //         { label: 'Accidente de Tránsito', path: '/accidente-transito' },
  //         { label: 'Factores Climáticos', path: '/factor-climatico' },
  //         { label: 'Incendio Estructural', path: '/incendio-estructural' },
  //         { label: 'Incendio Forestal', path: '/incendio-forestal' },
  //         { label: 'Material Peligroso', path: '/material-peligroso' },
  //         { label: 'Rescate', path: '/rescate' },
  //         { label: 'Participación en Incidente', path: '/participacion-incidente' },
  //         { label: 'Vehículo Involucrado', path: '/vehiculo-involucrado' }
          

  //       ].map(({ label, path }) => (
  //         <button
  //           key={path}
  //           onClick={() => navigate(path)}
  //           className="btn menu-btn">
  //           {label}
  //         </button>
  //       ))}
  //     </div>

  //     <div className="menu-content">
  //       {seccion === 'inicio' && <p>Selecciona una opción del menú para comenzar.</p>}
  //       {seccion === 'registrarIncidente' && <p>Formulario para registrar incidente (a implementar).</p>}
  //     </div>

  //     <button className="btn btn-danger mt-3" onClick={handleLogOut}>
  //       Cerrar sesión
  //     </button>
  //   </div>
  // )
}

export default Menu
