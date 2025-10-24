import React, { useState } from 'react'
import './CalendarioGuardias.css'

import MisGuardiasCalendar from './MisGuardiasCalendar'
import GuardiasGrupoCalendar from './GuardiasGrupoCalendar'

const CalendarioGuardias = ({ dniUsuario }) => {
  const [modo, setModo] = useState('mis') // 'mis' | 'grupos'
  const [expandido, setExpandido] = useState(true) // arranca expandido

  const headerRight = (
    <div className='d-flex align-items-center gap-2 ms-auto flex-shrink-0'>
      <div className='btn-group ms-auto flex-shrink-0 calendar-mode-switch'>
        <button
          className={`btn btn-sm ${modo === 'mis' ? 'btn-light' : 'btn-outline-light'}`}
          onClick={() => setModo('mis')}
          type='button'
        >
          Mis guardias
        </button>
        <button
          className={`btn btn-sm ${modo === 'grupos' ? 'btn-light' : 'btn-outline-light'}`}
          onClick={() => setModo('grupos')}
          type='button'
        >
          Guardias por grupo
        </button>
      </div>

      {/* expandido => chevron-down (minimizar) | colapsado => chevron-up (expandir) */}
      <button
        className='btn btn-sm btn-light toggle-cal-btn'
        onClick={() => setExpandido(v => !v)}
        aria-expanded={expandido}
        aria-label={expandido ? 'Minimizar calendario' : 'Maximizar calendario'}
        title={expandido ? 'Minimizar calendario' : 'Maximizar calendario'}
        type='button'
      >
        <i className={`bi ${expandido ? 'bi-chevron-down' : 'bi-chevron-up'}`} />
      </button>
    </div>
  )

  return (
  <div className="container-fluid px-0">
    {/* ⬇️ grid de Bootstrap idéntica a la que te funciona */}
    <div className="row justify-content-center">
      <div className="col-12 col-sm-11 col-md-10 col-lg-9">
        {/* wrapper que limita ancho SOLO en mobile */}
        <div className="fc-mobile-wrap">
          {modo === 'mis' ? (
            <MisGuardiasCalendar
              key='mis'
              dniUsuario={dniUsuario}
              titulo='Mis Guardias'
              headerRight={headerRight}
              collapsed={!expandido}
            />
          ) : (
            <GuardiasGrupoCalendar
              key='grupos'
              titulo='Guardias por Grupo'
              headerRight={headerRight}
              collapsed={!expandido}
            />
          )}
        </div>
      </div>
    </div>
  </div>
)

}

export default CalendarioGuardias
