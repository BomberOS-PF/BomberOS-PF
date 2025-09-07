import { useState, useEffect } from 'react'
import { API_URLS, apiRequest } from '../../../config/api'
import { UsersIcon, Shield } from 'lucide-react'
import { BackToMenuButton } from '../../Common/Button'
import '../../DisenioFormulario/DisenioFormulario.css'

const ConsultarUsuario = ({ onVolver }) => {
  // === Paginación (calcado a RegistrarGuardia) ===
  const [busqueda, setBusqueda] = useState('')
  const [paginaActual, setPaginaActual] = useState(1)
  const [limite] = useState(10)
  const [total, setTotal] = useState(0)

  // Datos
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])

  // UI / Edición
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(false)

  // Cargar usuarios cuando cambian página o búsqueda (server-side)
  useEffect(() => {
    cargarUsuarios()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginaActual, busqueda])

  // Cargar roles una vez
  useEffect(() => {
    cargarRoles()
  }, [])

  const cargarUsuarios = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        pagina: String(paginaActual),
        limite: String(limite),
        busqueda: busqueda || ''
      }).toString()

      const url = `${API_URLS.usuarios.getAll}?${params}`
      const response = await apiRequest(url, { method: 'GET' })

      if (response?.success) {
        const data = Array.isArray(response.data) ? response.data : []
        const totalSrv = Number.isFinite(response.total) ? response.total : data.length

        // Si quedamos en una página vacía (por eliminación o filtro) y hay páginas previas, retroceder
        const totalPaginas = Math.max(1, Math.ceil(totalSrv / limite))
        if (paginaActual > totalPaginas && totalPaginas >= 1) {
          setPaginaActual(totalPaginas)
          return
        }

        setUsuarios(data)
        setTotal(totalSrv)
        setMensaje(totalSrv === 0 ? 'No hay usuarios para los criterios de búsqueda.' : '')
      } else {
        throw new Error(response?.message || 'Error al obtener usuarios')
      }
    } catch (error) {
      console.error('❌ Error al cargar usuarios:', error)
      setUsuarios([])
      setTotal(0)
      setMensaje(`Error al cargar usuarios: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const cargarRoles = async () => {
    try {
      const response = await apiRequest(API_URLS.roles.getAll)
      if (response?.success) setRoles(response.data || [])
    } catch (error) {
      console.error('❌ Error al cargar roles:', error)
    }
  }

  const handleBusqueda = (e) => {
    setBusqueda(e.target.value)
    setPaginaActual(1) // reset de página (igual que RegistrarGuardia)
  }

  const seleccionarUsuario = (usuario) => {
    setUsuarioSeleccionado(usuario)
    setModoEdicion(false)
    setMensaje('')
  }

  const activarEdicion = () => setModoEdicion(true)

  const guardarCambios = async (datosActualizados) => {
    setLoading(true)

    const usuarioValue = datosActualizados.usuario || datosActualizados.username || ''
    if (!usuarioValue.trim()) {
      setMensaje('El nombre de usuario es obligatorio')
      setLoading(false)
      setTimeout(() => setMensaje(''), 2500)
      return
    }
    if (!datosActualizados.email?.trim()) {
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
          usuario: usuarioValue,
          password: datosActualizados.password || null,
          email: datosActualizados.email,
          idRol: datosActualizados.idRol
        })
      })

      if (response?.success) {
        setMensaje('✅ Usuario actualizado correctamente')
        setModoEdicion(false)
        setTimeout(() => {
          setUsuarioSeleccionado(null)
          setMensaje('')
        }, 1500)
        cargarUsuarios()
      } else {
        throw new Error(response?.message || 'Error al guardar')
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

  const eliminarUsuario = async (usuario) => {
    const nombre = usuario.username || usuario.usuario
    if (!window.confirm(`¿Estás seguro de que querés eliminar el usuario "${nombre}"?`)) return
    try {
      const response = await apiRequest(API_URLS.usuarios.delete(usuario.id), { method: 'DELETE' })
      if (response?.success) {
        setMensaje('✅ Usuario eliminado correctamente')

        // Si al eliminar queda vacía la página actual y no es la primera, retroceder una página
        const quedaVacia = usuarios.length === 1 && paginaActual > 1
        if (quedaVacia) {
          setPaginaActual(prev => Math.max(1, prev - 1))
        } else {
          await cargarUsuarios()
        }

        if (usuarioSeleccionado?.id === usuario.id) {
          setUsuarioSeleccionado(null)
          setModoEdicion(false)
        }
      } else {
        throw new Error(response?.message || 'Error al eliminar usuario')
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

  const totalPaginas = Math.max(1, Math.ceil(total / limite))

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
      <div className='card shadow-sm border-0 bg-white'>
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

          {/* Tabla + Buscador (server-side con paginación calcada) */}
          {!usuarioSeleccionado && !modoEdicion && (
            <>
              <div className='mb-3 position-relative'>
                <i className='bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary'></i>
                <input
                  type='text'
                  className='form-control border-secondary ps-5 py-3'
                  placeholder='Buscar por usuario, email o rol...'
                  value={busqueda}
                  onChange={handleBusqueda}
                  disabled={loading}
                />
              </div>

              {usuarios.length > 0 ? (
                <>
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
                        {usuarios.map((usuario) => (
                          <tr key={usuario.id}>
                            <td className='border-end'>{usuario.usuario || usuario.username}</td>
                            <td className='border-end'>{usuario.email}</td>
                            <td className='border-end'>
                              <span
                                className={`badge ${
                                  (usuario.rol || '').toLowerCase() === 'administrador'
                                    ? 'bg-danger'
                                    : (usuario.rol || '').toLowerCase() === 'jefe_cuartel'
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

                  {/* Paginación (calcada a RegistrarGuardia) */}
                  <div className="d-flex justify-content-center mb-3 py-2">
                    {Array.from({ length: totalPaginas }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setPaginaActual(i + 1)}
                        type='button'
                        className={`btn btn-sm me-1 custom-page-btn ${paginaActual === (i + 1) ? 'active' : ''}`}
                        disabled={loading}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </>
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
                    ? `✏️ Editando: ${usuarioSeleccionado.usuario || usuarioSeleccionado.username}`
                    : `👤 Detalles: ${usuarioSeleccionado.usuario || usuarioSeleccionado.username}`}
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
              <div className='card bg-light border-0 shadow-sm py-4' style={{borderRadius: '12px'}}>
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
                        <label className='form-label text-dark d-flex align-items-center gap-2'>
                          <i className='bi bi-person text-danger'></i> Nombre de Usuario
                        </label>
                        <input
                          type='text'
                          className='form-control border-secondary'
                          value={usuarioSeleccionado.usuario || usuarioSeleccionado.username}
                          onChange={(e) =>
                            setUsuarioSeleccionado({ ...usuarioSeleccionado, usuario: e.target.value })
                          }
                          disabled={!modoEdicion || loading}
                        />
                      </div>

                      {/* Password */}
                      <div className='col-md-6 py-3'>
                        <label className='form-label text-dark d-flex align-items-center gap-2'>
                          <i className='bi bi-shield-lock text-warning'></i> Contraseña (nueva)
                        </label>
                        <input
                          type='password'
                          className='form-control border-secondary'
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
                        <label className='form-label text-dark d-flex align-items-center gap-2'>
                          <i className='bi bi-envelope text-primary'></i> Correo electrónico
                        </label>
                        <input
                          type='email'
                          className='form-control border-secondary'
                          value={usuarioSeleccionado.email}
                          onChange={(e) =>
                            setUsuarioSeleccionado({ ...usuarioSeleccionado, email: e.target.value })
                          }
                          disabled={!modoEdicion || loading}
                        />
                      </div>

                      {/* Rol */}
                      <div className='col-md-6 py-3'>
                        <label className='form-label text-dark d-flex align-items-center gap-2'>
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
