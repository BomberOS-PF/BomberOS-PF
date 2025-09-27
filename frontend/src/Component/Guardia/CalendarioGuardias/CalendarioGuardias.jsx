import React, { useState } from 'react'
import './CalendarioGuardias.css'

import MisGuardiasCalendar from './MisGuardiasCalendar'
import GuardiasGrupoCalendar from './GuardiasGrupoCalendar'

const CalendarioGuardias = ({ dniUsuario }) => {
  const [modo, setModo] = useState('mis') // 'mis' | 'grupos'

  const headerRight = (
    <div className='btn-group ms-auto flex-shrink-0'>
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
  )

  return (
    <div className='container-fluid'>
      {modo === 'mis'
        ? (
          <MisGuardiasCalendar
            dniUsuario={dniUsuario}
            titulo='Mis Guardias'
            headerRight={headerRight}
          />
        )
        : (
          <GuardiasGrupoCalendar
            titulo='Guardias por Grupo'
            headerRight={headerRight}
          />
        )
      }
    </div>
  )
}

export default CalendarioGuardias
