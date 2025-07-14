import React from 'react'
import '../../DisenioFormulario/DisenioFormulario.css'

const ConsultarBomberosDelGrupo = ({ idGrupo, nombreGrupo, bomberos, onVolver, onEditar }) => {
  return (
    <div className="container formulario-consistente">
      <h2 className="mb-3 text-black">Bomberos del grupo: {nombreGrupo || 'Sin nombre'}</h2>

      {bomberos.length === 0 ? (
        <div className="alert alert-warning">No hay bomberos asignados a este grupo.</div>
      ) : (
        <div className="table-responsive">
          <table className="tabla-bomberos">
            <thead>
              <tr>
                <th>DNI</th>
                <th>Legajo</th>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>Teléfono</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {bomberos.map((b, i) => (
                <tr key={i}>
                  <td>{b.dni}</td>
                  <td>{b.legajo}</td>
                  <td>{b.nombre}</td>
                  <td>{b.apellido}</td>
                  <td>{b.telefono}</td>
                  <td>{b.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="botones-accion mt-4">
        <button className="btn btn-secondary w-100 mb-2" onClick={onVolver}>
          ← Volver a grupos
        </button>
        <button
          className="btn btn-warning w-100"
          onClick={() => onEditar({ idGrupo, nombre: nombreGrupo })}
        >
          ✏️ Editar grupo
        </button>
      </div>
    </div>
  )
}

export default ConsultarBomberosDelGrupo
