// frontend/src/Component/Guardia/ConsultarBomberosDelGrupo.jsx

import React from 'react'
import '../../DisenioFormulario/DisenioFormulario.css'

const ConsultarBomberosDelGrupo = ({ idGrupo, nombreGrupo, bomberos, onVolver, onEditar }) => {
  return (
    <div className="container formulario-consistente">
      <h2 className="mb-2 text-black"> Bomberos</h2>
      <h2 className="mb-3 text-black"> {nombreGrupo}</h2>

      {bomberos.length === 0 ? (
        <div className="alert alert-warning">No hay bomberos asignados a este grupo.</div>
      ) : (
        <div className="table-responsive">
          <table className="tabla-bomberos">
            <thead>
              <tr>
                <th>DNI</th>
                <th>Nombre</th>
                <th>Apellido</th>
                {/* Podés agregar más columnas si es necesario */}
              </tr>
            </thead>
            <tbody>
              {bomberos.map((b, i) => (
                <tr key={i}>
                  <td>{b.dni}</td>
                  <td>{b.nombre}</td>
                  <td>{b.apellido}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="botones-accion mt-4">
        <button className="btn btn-secondary w-100" onClick={onVolver}>
          ← Volver a grupos
        </button>
      </div>
    </div>
  )
}

export default ConsultarBomberosDelGrupo
