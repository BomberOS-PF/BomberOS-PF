import React from 'react'
import '../../../../styles/global.css'
import { User2, UsersIcon } from 'lucide-react'

const ConsultarBomberosDelGrupo = ({
  idGrupo,
  nombreGrupo,
  descripcion,
  bomberos = [],
  onVolver,
  onEditar,
  onIrAGestionarGuardias
}) => {
  return (
    <div className="ontainer-fluid py-5 registrar-guardia">
      <div className='text-center mb-4'>
        <div className='d-flex justify-content-center align-items-center gap-3 mb-3'>
          <div className="bg-danger p-3 rounded-circle">
            <UsersIcon size={32}
              color="white" />
          </div>
          <h1 className="fw-bold text-white fs-3 mb-0">
            Grupos de Guardia
          </h1>
        </div>
        <span className="badge bg-danger-subtle text-danger">
          <i className="bi bi-fire me-2"></i> Sistema de Gestión de Personal - Cuartel de Bomberos
        </span>
      </div>

      <div className="card edge-to-edge shadow-sm border-0 bg-white">
        <div className="card-header bg-danger text-white d-flex align-items-center gap-2 py-4">
          <User2 />
          <strong>Bomberos del grupo: {nombreGrupo || 'Sin nombre'}</strong>
        </div>
        
        <div className="card-body">
          {bomberos.length === 0 ? (
            <div className="text-center py-3 text-muted">No hay bomberos asignados a este grupo.</div>
          ) : (
            <div className="table-responsive rounded border">
              <table className="table table-hover align-middle mb-0 rg-table">
                <thead className="bg-light">
                  <tr>
                    <th className="border-end text-center">Nombre completo</th>
                    <th className="border-end text-center">DNI</th>
                    <th className="border-end text-center">Legajo</th>
                    <th className="text-center">Teléfono</th>
                  </tr>
                </thead>
                <tbody>
                  {bomberos.map((b, i) => (
                    <tr key={i}>
                      <td className="border-end px-3" data-label="Nombre">{b.nombre} {b.apellido}</td>
                      <td className="border-end px-3" data-label="DNI">{b.dni}</td>
                      <td className="border-end px-3" data-label="Legajo">{b.legajo}</td>
                      <td className="px-3" data-label="Teléfono">{b.telefono}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="d-flex align-items-center gap-2">
                <button
                  className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                  onClick={() => onEditar?.({ idGrupo, nombre: nombreGrupo, descripcion })}
                  title="Editar información del grupo"
                >
                  <i className="bi bi-pencil-square"></i>
                  <span className="btn-text">Editar grupo</span>
                </button>
                
                <button
                  className="btn btn-success btn-sm d-flex align-items-center gap-1"
                  onClick={() => onIrAGestionarGuardias?.({ idGrupo, nombreGrupo, bomberos })}
                  title="Gestionar guardias de este grupo"
                >
                  <i className="bi bi-calendar2-week"></i>
                  <span className="btn-text">Guardias</span>
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                  onClick={onVolver}
                >
                  <i className="bi bi-arrow-left"></i>
                  <span className="btn-text">Volver al listado</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConsultarBomberosDelGrupo
