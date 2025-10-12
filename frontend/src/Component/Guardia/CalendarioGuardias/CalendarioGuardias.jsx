import React, { useState } from 'react'
import './CalendarioGuardias.css'

import MisGuardiasCalendar from './MisGuardiasCalendar'
import GuardiasGrupoCalendar from './GuardiasGrupoCalendar'

const CalendarioGuardias = ({ dniUsuario }) => {
  const [modo, setModo] = useState('mis') // 'mis' | 'grupos'
  const [expandido, setExpandido] = useState(false)

  const headerRight = (
    <div className='d-flex align-items-center gap-2 ms-auto flex-shrink-0'>
      <div className='btn-group ms-auto flex-shrink-0 calendar-mode-switch'>
        <button
          className={`btn btn-sm ${modo === 'mis' ? 'btn-light' : 'btn-outline-light'}`}
          onClick={() => setModo('mis')}
        >
          Mis guardias
        </button>
        <button
          className={`btn btn-sm ${modo === 'grupos' ? 'btn-light' : 'btn-outline-light'}`}
          onClick={() => setModo('grupos')}
        >
          Guardias por grupo
        </button>
      </div>
      {/* ⬇️ Botón Max/Min */}
      <button
        className='btn btn-sm btn-light toggle-cal-btn'
        onClick={() => setExpandido(v => !v)}
        aria-expanded={expandido}
        aria-label={expandido ? 'Minimizar calendario' : 'Maximizar calendario'}
      >
        <i className={`bi ${expandido ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
      </button>
    </div>

  )

  return (
    <div className='container-fluid'>
      {modo === 'mis'
        ? (
          <MisGuardiasCalendar
            key='mis'
            dniUsuario={dniUsuario}
            titulo='Mis Guardias'
            headerRight={headerRight}
            collapsed={!expandido}
          />
        )
        : (
          <GuardiasGrupoCalendar
            key='grupos'
            titulo='Guardias por Grupo'
            headerRight={headerRight}
            collapsed={!expandido}
          />
        )
      }
    </div>
  )
}

export default CalendarioGuardias
