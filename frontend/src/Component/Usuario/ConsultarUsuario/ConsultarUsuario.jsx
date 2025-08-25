import { useState, useEffect } from 'react'
import { API_URLS, apiRequest } from '../../../config/api'
import { UsersIcon, Shield } from 'lucide-react'

import { BackToMenuButton } from '../../Common/Button'

const ConsultarUsuario = ({ onVolver }) => {
  const [usuarios, setUsuarios] = useState([])
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState([])

  useEffect(() => {
    cargarUsuarios()
    cargarRoles()
  }, [])

  const cargarUsuarios = async () => {
    try {
      const response = await apiRequest(API_URLS.usuarios.getAll)
      if (response.success) {
        setUsuarios(response.data)
        setMensaje(response.data.length === 0 ? 'No hay usuarios registrados. Registra algunos usuarios primero.' : '')
      } else {
        throw new Error(response.message || 'Error al obtener usuarios')
      }
    } catch (error) {
      console.error('❌ Error al cargar usuarios:', error)
      setMensaje(`Error al cargar usuarios: ${error.message}`)
    }
  }

  const cargarRoles = async () => {
    try {
      const response = await apiRequest(API_URLS.roles.getAll)
      if (response.success) {
        setRoles(response.data)
      }
    } catch (error) {
      console.error('❌ Error al cargar roles:', error)
    }
  }

  const guardarCambios = async (datosActualizados) => {
    setLoading(true)

    if (!datosActualizados.usuario.trim()) {
      setMensaje('El nombre de usuario es obligatorio')
      setLoading(false)
      setTimeout(() => setMensaje(''), 2500)
      return
    }

    if (!datosActualizados.email.trim()) {
      setMensaje('El email es obligatorio')
      setLoading(false)
      setTimeout(() => setMensaje(''), 2500)
      return
    }

    if (!datosActualizados.idRol) {
      setMensaje('Debe seleccionar un rol')
      setLoading(false)
      setTimeout(() => setMensaje(''), 2500)
      return
    }

    try {
      const response = await apiRequest(API_URLS.usuarios.update(usuarioSeleccionado.id), {
        method: 'PUT',
        body: JSON.stringify({
          usuario: datosActualizados.usuario,
          password: datosActualizados.password || null,
          email: datosActualizados.email,
          idRol: datosActualizados.idRol
        })
      })

      if (response.success) {
        setMensaje('✅ Usuario actualizado correctamente')
        setModoEdicion(false)
        setTimeout(() => {
          setUsuarioSeleccionado(null)
          setMensaje('')
        }, 1500)
        cargarUsuarios()
      }
    } catch (error) {
      const errorMsg = error?.response?.error || error.message || 'Error al guardar'
      setMensaje(
        errorMsg.toLowerCase().includes('disponible') ||
        errorMsg.toLowerCase().includes('ya existe') ||
        errorMsg.toLowerCase().includes('duplicado')
          ? 'El nombre de usuario o email ya está registrado'
          : errorMsg
      )
      setTimeout(() => setMensaje(''), 2500)
    } finally {
      setLoading(false)
    }
  }

  const usuariosFiltrados = usuarios.filter((usuario) =>
    usuario.username.toLowerCase().includes(busqueda.toLowerCase()) ||
    usuario.email.toLowerCase().includes(busqueda.toLowerCase()) ||
    usuario.rol.toLowerCase().includes(busqueda.toLowerCase())
  )

  const seleccionarUsuario = (usuario) => {
    setUsuarioSeleccionado(usuario)
    setModoEdicion(false)
    setMensaje('')
  }

  const activarEdicion = () => setModoEdicion(true)

  const eliminarUsuario = async (usuario) => {
    if (!window.confirm(`¿Estás seguro de que querés eliminar el usuario "${usuario.username}"?`)) return
    try {
      const response = await apiRequest(API_URLS.usuarios.delete(usuario.id), {
        method: 'DELETE'
      })
      if (response.success) {
        setMensaje('✅ Usuario eliminado correctamente')
        await cargarUsuarios()
        if (usuarioSeleccionado?.id === usuario.id) {
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
    await cargarUsuarios()
  }

  return (
    <div className='container-fluid py-5'>
      {/* Header */}
      <div className='text-center mb-4'>
        <div className='d-flex justify-content-center align-items-center gap-3 mb-3'>
          <div className='bg-danger p-3 rounded-circle'>
            <UsersIcon size={32} color='white' />
          </div>
          <h1 className='fw-bold text-white fs-3 mb-0'>Consultar Usuarios</h1>
        </div>
        <span className='badge bg-danger-subtle text-danger'>
          <i className='bi bi-fire me-2'></i> Sistema de Gestión de Personal - Cuartel de Bomberos
        </span>
      </div>

      {/* Card */}
      <div className='card shadow-sm border-0 bg-white bg-opacity-1 backdrop-blur-sm'>
        <div className='card-header bg-danger text-white d-flex align-items-center gap-2 py-4'>
          <i className='bi bi-person-fill fs-5'></i>
          <strong>Listado de Usuarios</strong>
        </div>

        <div className='card-body'>
          {mensaje && (
            <div className={`alert ${mensaje.includes('Error') || mensaje.includes('No se') ? 'alert-danger' : 'alert-info'}`}>
              {mensaje}
            </div>
          )}

          {loading && (
            <div className='text-center mb-3'>
              <div className='spinner-border text-danger' role='status'></div>
            </div>
          )}

          {/* Tabla */}
          {!usuarioSeleccionado && !modoEdicion && (
            <>
              <div className='mb-3 position-relative'>
                <i className='bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary'></i>
                <input
                  type='text'
                  className='form-control ps-5 py-3 border-secondary'
                  placeholder='Buscar por usuario, email o rol...'
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  disabled={loading}
                />
              </div>

              {usuariosFiltrados.length > 0 ? (
                <div className='table-responsive rounded border'>
                  <table className='table table-hover align-middle mb-0'>
                    <thead className='bg-light'>
                      <tr>
                        <th className='border-end text-center'>Usuario</th>
                        <th className='border-end text-center'>Email</th>
                        <th className='border-end text-center'>Rol</th>
                        <th className='text-center'>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuariosFiltrados.map((usuario) => (
                        <tr key={usuario.username}>
                          <td className='border-end'>{usuario.username}</td>
                          <td className='border-end'>{usuario.email}</td>
                          <td className='border-end'>
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
                          <td className='text-center'>
                            <button
                              className='btn btn-outline-secondary btn-sm me-2'
                              onClick={() => seleccionarUsuario(usuario)}
                              disabled={loading}
                            >
                              <i className='bi bi-eye me-1'></i> Ver
                            </button>
                            <button
                              className='btn btn-outline-danger btn-sm'
                              onClick={() => eliminarUsuario(usuario)}
                              disabled={loading}
                            >
                              <i className='bi bi-trash'></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                !loading && <div className='text-center py-3 text-muted'>No se encontraron usuarios que coincidan con la búsqueda.</div>
              )}
            </>
          )}

          {/* Detalles / Edición */}
          {usuarioSeleccionado && (
            <div className='mt-4'>
              {/* Header */}
              <div className='d-flex align-items-center justify-content-between mb-3'>
                <h3 className='text-dark mb-0'>
                  {modoEdicion
                    ? `✏️ Editando: ${usuarioSeleccionado.username}`
                    : `👤 Detalles: ${usuarioSeleccionado.username}`}
                </h3>

                <div>
                  {!modoEdicion && (
                    <button
                      className='btn btn-warning btn-sm me-2 d-flex align-items-center gap-1'
                      onClick={activarEdicion}
                      disabled={loading}
                    >
                      <i className='bi bi-pencil-square'></i> Editar
                    </button>
                  )}
                  <button
                    className='btn btn-outline-secondary btn-sm d-flex align-items-center gap-1'
                    onClick={volverListado}
                    disabled={loading}
                  >
                    <i className='bi bi-arrow-left'></i> Volver al listado
                  </button>
                </div>
              </div>

              <hr className='border-4 border-danger mb-4' />

              {/* Card de detalles o edición */}
              <div className='card bg-dark text-white border-0 shadow-lg py-4'>
                <div className='card-body'>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      guardarCambios(usuarioSeleccionado)
                    }}
                  >
                    <div className='row mb-3'>
                      {/* Usuario */}
                      <div className='col-md-6 py-3'>
                        <label className='form-label text-white d-flex align-items-center gap-2'>
                          <i className='bi bi-person text-danger'></i> Nombre de Usuario
                        </label>
                        <input
                          type='text'
                          className='form-control'
                          value={usuarioSeleccionado.usuario || usuarioSeleccionado.username}
                          onChange={(e) =>
                            setUsuarioSeleccionado({ ...usuarioSeleccionado, usuario: e.target.value })
                          }
                          disabled={!modoEdicion || loading}
                        />
                      </div>

                      {/* Password */}
                      <div className='col-md-6 py-3'>
                        <label className='form-label text-white d-flex align-items-center gap-2'>
                          <i className='bi bi-shield-lock text-warning'></i> Contraseña (nueva)
                        </label>
                        <input
                          type='password'
                          className='form-control'
                          placeholder='Dejar en blanco para no cambiar'
                          value={usuarioSeleccionado.password || ''}
                          onChange={(e) =>
                            setUsuarioSeleccionado({ ...usuarioSeleccionado, password: e.target.value })
                          }
                          disabled={!modoEdicion || loading}
                        />
                      </div>

                      {/* Email */}
                      <div className='col-md-6 py-3'>
                        <label className='form-label text-white d-flex align-items-center gap-2'>
                          <i className='bi bi-envelope text-primary'></i> Correo electrónico
                        </label>
                        <input
                          type='email'
                          className='form-control'
                          value={usuarioSeleccionado.email}
                          onChange={(e) =>
                            setUsuarioSeleccionado({ ...usuarioSeleccionado, email: e.target.value })
                          }
                          disabled={!modoEdicion || loading}
                        />
                      </div>

                      {/* Rol */}
                      <div className='col-md-6 py-3'>
                        <label className='form-label text-white d-flex align-items-center gap-2'>
                          <Shield className='text-primary' /> Rol
                        </label>
                        <select
                          className='form-select form-control text-dark'
                          value={usuarioSeleccionado.idRol || ''}
                          onChange={(e) =>
                            setUsuarioSeleccionado({ ...usuarioSeleccionado, idRol: e.target.value })
                          }
                          disabled={!modoEdicion || loading}
                        >
                          <option value=''>Seleccione un rol</option>
                          {roles.map((rol) => (
                            <option key={rol.idRol} value={rol.idRol}>
                              {rol.nombreRol}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Botón guardar solo en edición */}
                    {modoEdicion && (
                      <div className='d-grid gap-3'>
                        <button type='submit' className='btn btn-danger' disabled={loading}>
                          {loading ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Botón Volver al menú */}
          <div className='d-grid gap-3 py-4'>
            <BackToMenuButton onClick={onVolver} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConsultarUsuario
