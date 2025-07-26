import { useState, useEffect } from 'react'
import { API_URLS, apiRequest } from '../../../config/api'
import { User2, UsersIcon } from 'lucide-react'
// import './ConsultarUsuario.css'
import '../../DisenioFormulario/DisenioFormulario.css'
import RegistrarUsuario from '../RegistrarUsuario/RegistrarUsuario'

const ConsultarUsuario = ({ onVolver }) => {
  const [usuarios, setUsuarios] = useState([])
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    cargarUsuarios()
  }, [])

  const cargarUsuarios = async () => {
    try {
      const response = await apiRequest(API_URLS.usuarios.getAll)

      if (response.success) {
        setUsuarios(response.data)

        if (response.data.length === 0) {
          setMensaje('No hay usuarios registrados. Registra algunos usuarios primero.')
        } else {
          setMensaje('')
        }
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
    <div className='container-fluid py-5'>
      {/* Header principal */}
      <div className='text-center mb-4'>
        <div className='d-flex justify-content-center align-items-center gap-3 mb-3'>
          <div className="bg-danger p-3 rounded-circle">
            <UsersIcon size={32}
              color="white" />
          </div>
          <h1 className="fw-bold text-white fs-3 mb-0">Consultar Usuarios</h1>
        </div>
        <span className="badge bg-danger-subtle text-danger">
          <i className="bi bi-fire me-2"></i> Sistema de Gestión de Personal - Cuartel de Bomberos
        </span>
      </div>

      {/* Card principal */}
      <div className="card shadow-sm border-0 bg-white bg-opacity-1 backdrop-blur-sm">
        <div className="card-header bg-danger text-white d-flex align-items-center gap-2 py-4">
          <i className="bi bi-person-fill fs-5"></i>
          <strong>Listado de Usuarios</strong>
        </div>
        <div className="card-body">
          {/* Mensajes */}
          {mensaje && (
            <div
              className={`alert ${mensaje.includes('Error') || mensaje.includes('No se') ? 'alert-danger' : 'alert-info'}`}
            >
              {mensaje}
            </div>
          )}

          {/* Spinner */}
          {loading && (
            <div className="text-center mb-3">
              <div className="spinner-border text-danger" role="status"></div>
            </div>
          )}

          {/* Buscador */}
          {!usuarioSeleccionado && !modoEdicion && (
            <>
              <div className="mb-3 position-relative">
                <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
                <input
                  type="text"
                  className="form-control ps-5 py-3 border-secondary"
                  placeholder="Buscar por usuario, email o rol..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Tabla */}
              {usuariosFiltrados.length > 0 ? (
                <div className="table-responsive rounded border">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="border-end text-center">Usuario</th>
                        <th className="border-end text-center">Email</th>
                        <th className="border-end text-center">Rol</th>
                        <th className="text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuariosFiltrados.map((usuario) => (
                        <tr key={usuario.username}>
                          <td className="border-end">{usuario.username}</td>
                          <td className="border-end">{usuario.email}</td>
                          <td className="border-end">
                            <span
                              className={`badge ${usuario.rol === 'administrador'
                                ? 'bg-danger'
                                : usuario.rol === 'jefe_cuartel'
                                  ? 'bg-warning'
                                  : 'bg-info'
                                }`}
                            >
                              {usuario.rol}
                            </span>
                          </td>      
                          <td className="text-center">
                            <button
                              className="btn btn-outline-secondary btn-sm me-2"
                              onClick={() => seleccionarUsuario(usuario)}
                              disabled={loading}
                            >
                              <i className="bi bi-eye me-1"></i> Ver
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => eliminarUsuario(usuario)}
                              title="Eliminar usuario"
                              disabled={loading}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : !loading && (
                <div className="text-center py-3 text-muted">
                  No se encontraron usuarios que coincidan con la búsqueda.
                </div>
              )}
            </>
          )}

          {/* Detalles */}
          {usuarioSeleccionado && (
            <div className="mt-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-person-circle text-secondary fs-5"></i>
                  <h3 className="text-dark mb-0">
                    {modoEdicion
                      ? `✏️ Editando: ${usuarioSeleccionado.username}`
                      : `👤 Detalles: ${usuarioSeleccionado.username}`}
                  </h3>
                </div>
                <div>
                  {!modoEdicion && (
                    <button
                      className="btn btn-warning btn-sm me-2 d-flex align-items-center gap-1"
                      onClick={activarEdicion}
                      disabled={loading}
                    >
                      <i className="bi bi-pencil-square"></i> Editar
                    </button>
                  )}
                  <button
                    className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                    onClick={volverListado}
                    disabled={loading}
                  >
                    <i className="bi bi-arrow-left"></i> Volver al listado
                  </button>
                </div>
              </div>

              <hr className="border-4 border-danger mb-4" />

              {/* Modo edición o vista */}
              <div className="card bg-dark text-white border-0 shadow-lg py-4">
                {modoEdicion ? (
                  <RegistrarUsuario
                    usuario={usuarioSeleccionado}
                    onVolver={volverListado}
                    ocultarTitulo={true}
                    listaUsuarios={usuarios}
                  />
                ) : (
                  <div className="row px-4">
                    <div className="col-md-6">
                      <p><strong>Usuario:</strong> {usuarioSeleccionado.username}</p>
                      <p><strong>Email:</strong> {usuarioSeleccionado.email}</p>
                      <p><strong>Rol:</strong>
                        <span
                          className={`badge ms-2 ${usuarioSeleccionado.rol === 'administrador'
                            ? 'bg-danger'
                            : usuarioSeleccionado.rol === 'jefe_cuartel'
                              ? 'bg-warning'
                              : 'bg-info'
                            }`}
                        >
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

          {/* Botón volver menú */}
          <div className="d-grid gap-3 py-4">
            <button type="button" className="btn btn-secondary" onClick={onVolver} disabled={loading}>
              Volver al menú
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConsultarUsuario