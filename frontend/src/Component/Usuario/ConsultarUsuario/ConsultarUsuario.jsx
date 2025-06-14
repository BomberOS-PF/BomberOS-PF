import { useState, useEffect } from 'react'
import { API_URLS, apiRequest } from '../../../config/api'
import './ConsultarUsuario.css'
import RegistrarUsuario from '../RegistrarUsuario/RegistrarUsuario'

const ConsultarUsuario = ({ onVolver }) => {
  const [usuarios, setUsuarios] = useState([])
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    cargarUsuarios()
  }, [])

  const cargarUsuarios = async () => {
    try {
      console.log('📋 Cargando usuarios desde el backend...')
      
      const response = await apiRequest(API_URLS.usuarios.getAll)
      
      if (response.success) {
        setUsuarios(response.data)
        
        if (response.data.length === 0) {
          setMensaje('No hay usuarios registrados. Registra algunos usuarios primero.')
        } else {
          setMensaje('')
        }
        
        console.log(`✅ ${response.data.length} usuarios cargados`)
      } else {
        throw new Error(response.message || 'Error al obtener usuarios')
      }
    } catch (error) {
      console.error('❌ Error al cargar usuarios:', error)
      setMensaje(`Error al cargar usuarios: ${error.message}`)
    }
  }

  const usuariosFiltrados = usuarios.filter(usuario =>
    usuario.username.toLowerCase().includes(busqueda.toLowerCase()) ||
    usuario.email.toLowerCase().includes(busqueda.toLowerCase()) ||
    usuario.rol.toLowerCase().includes(busqueda.toLowerCase())
  )

  const seleccionarUsuario = (usuario) => {
    setUsuarioSeleccionado(usuario)
    setModoEdicion(false)
    setMensaje('')
  }

  const activarEdicion = () => {
    setModoEdicion(true)
  }

  const eliminarUsuario = async (usuario) => {
    if (!window.confirm(`¿Estás seguro de que querés eliminar el usuario "${usuario.username}"?`)) return

    try {
      console.log('🗑️ Eliminando usuario:', { id: usuario.id, username: usuario.username })
      
      const response = await apiRequest(API_URLS.usuarios.delete(usuario.id), {
        method: 'DELETE'
      })

      if (response.success) {
        setMensaje('✅ Usuario eliminado correctamente')
        
        // Recargar la lista de usuarios
        await cargarUsuarios()
        
        // Si el usuario eliminado estaba seleccionado, limpiar selección
        if (usuarioSeleccionado && usuarioSeleccionado.id === usuario.id) {
          setUsuarioSeleccionado(null)
          setModoEdicion(false)
        }
      } else {
        throw new Error(response.message || 'Error al eliminar usuario')
      }
    } catch (error) {
      console.error('❌ Error al eliminar usuario:', error)
      setMensaje(`Error al eliminar usuario: ${error.message}`)
    }
  }

  const volverListado = async () => {
    setUsuarioSeleccionado(null)
    setModoEdicion(false)
    setMensaje('')
    await cargarUsuarios() // Recargar usuarios después de editar
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A'
    return new Date(fecha).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="container mt-4">
      <h2 className="text-white mb-3">Consultar Usuarios</h2>

      {mensaje && (
        <div className={`alert ${mensaje.includes('Error') ? 'alert-danger' : 'alert-info'}`}>
          {mensaje}
        </div>
      )}

      {!usuarioSeleccionado && !modoEdicion && (
        <>
          <div className="mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por usuario, email o rol..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {usuariosFiltrados.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-dark table-hover table-bordered">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Creado</th>
                    <th>Actualizado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.map((usuario) => (
                    <tr key={usuario.username}>
                      <td>{usuario.username}</td>
                      <td>{usuario.email}</td>
                      <td>
                        <span className={`badge ${
                          usuario.rol === 'administrador' ? 'bg-danger' :
                          usuario.rol === 'jefe_cuartel' ? 'bg-warning' : 'bg-info'
                        }`}>
                          {usuario.rol}
                        </span>
                      </td>
                      <td>{formatearFecha(usuario.createdAt)}</td>
                      <td>{formatearFecha(usuario.updatedAt)}</td>
                      <td>
                        <button
                          className="btn btn-outline-light btn-sm me-2"
                          onClick={() => seleccionarUsuario(usuario)}
                        >
                          Ver detalles
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => eliminarUsuario(usuario)}
                          title="Eliminar usuario"
                        >
                          ❌
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-white">
              <p>No se encontraron usuarios que coincidan con la búsqueda.</p>
            </div>
          )}
        </>
      )}

      {usuarioSeleccionado && (
        <div className="card bg-dark text-white">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5>Detalles del Usuario</h5>
            <div>
              {!modoEdicion && (
                <button className="btn btn-warning btn-sm me-2" onClick={activarEdicion}>
                  Editar
                </button>
              )}
              <button className="btn btn-secondary btn-sm" onClick={volverListado}>
                Volver
              </button>
            </div>
          </div>
          <div className="card-body">
            {modoEdicion ? (
              <RegistrarUsuario 
                usuario={usuarioSeleccionado} 
                onVolver={volverListado}
              />
            ) : (
              <div className="row">
                <div className="col-md-6">
                  <p><strong>Usuario:</strong> {usuarioSeleccionado.username}</p>
                  <p><strong>Email:</strong> {usuarioSeleccionado.email}</p>
                  <p><strong>Rol:</strong> 
                    <span className={`badge ms-2 ${
                      usuarioSeleccionado.rol === 'administrador' ? 'bg-danger' :
                      usuarioSeleccionado.rol === 'jefe_cuartel' ? 'bg-warning' : 'bg-info'
                    }`}>
                      {usuarioSeleccionado.rol}
                    </span>
                  </p>
                </div>
                <div className="col-md-6">
                  <p><strong>Creado:</strong> {formatearFecha(usuarioSeleccionado.createdAt)}</p>
                  <p><strong>Última actualización:</strong> {formatearFecha(usuarioSeleccionado.updatedAt)}</p>
                  <p><strong>ID:</strong> {usuarioSeleccionado.id}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="text-center mt-4">
        <button className="btn btn-light" onClick={onVolver}>
          Volver al Menú
        </button>
      </div>
    </div>
  )
}

export default ConsultarUsuario
