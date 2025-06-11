import { useState } from 'react'
import './ConsultarUsuario.css'
import RegistrarUsuario from '../RegistrarUsuario/RegistrarUsuario'

const usuariosEjemplo = [
  { id: 1, username: 'admin123', email: 'admin@cuartel.com', rol: 'administrador' },
  { id: 2, username: 'jefe1', email: 'jefe@cuartel.com', rol: 'jefe_cuartel' },
  { id: 3, username: 'bombero1', email: 'bombero@cuartel.com', rol: 'bombero' }
]

const ConsultarUsuario = ({ onVolver }) => {
  const [usuarios, setUsuarios] = useState(usuariosEjemplo)
  const [busqueda, setBusqueda] = useState('')
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)

  const filtrarUsuarios = () => {
    return usuarios.filter(u =>
      u.username.toLowerCase().includes(busqueda.toLowerCase())
    )
  }

  const handleEditar = (usuario) => {
    setUsuarioSeleccionado(usuario)
  }

  const handleVolverListado = () => {
    setUsuarioSeleccionado(null)
  }

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      {usuarioSeleccionado ? (
        <div className="w-100" style={{ maxWidth: '800px' }}>
          <RegistrarUsuario
            onVolver={handleVolverListado}
            usuario={usuarioSeleccionado}
          />
        </div>
      ) : (
        <div className="form-incidente p-4 shadow rounded w-100" style={{ maxWidth: '1000px' }}>
          <h2 className="text-white text-center mb-4">Consultar Usuarios</h2>

          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por nombre de usuario..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div className="table-responsive">
            <table className="table table-dark table-bordered text-center">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrarUsuarios().map((usuario) => (
                  <tr key={usuario.id}>
                    <td>{usuario.id}</td>
                    <td>{usuario.username}</td>
                    <td>{usuario.email}</td>
                    <td>{usuario.rol}</td>
                    <td>
                      <button className="btn btn-sm btn-primary" onClick={() => handleEditar(usuario)}>
                        Ver / Editar
                      </button>
                    </td>
                  </tr>
                ))}
                {filtrarUsuarios().length === 0 && (
                  <tr>
                    <td colSpan="5">No se encontraron usuarios.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <button className="btn btn-secondary w-100 mt-3" onClick={onVolver}>
            Volver al menú
          </button>
        </div>
      )}
    </div>
  )
}

export default ConsultarUsuario
