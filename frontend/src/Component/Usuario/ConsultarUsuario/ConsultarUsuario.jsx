import { useState, useEffect } from 'react'
import { API_URLS, apiRequest } from '../../../config/api'
import { UsersIcon, Shield } from 'lucide-react'
import Select from 'react-select'
import { swalConfirm, swalSuccess, swalError } from '../../Common/swalBootstrap'

import { BackToMenuButton } from '../../Common/Button'
import Pagination from '../../Common/Pagination'

const PAGE_SIZE_DEFAULT = 10

const ConsultarUsuario = ({ onVolver }) => {
  // Filtros / recarga
  const [busqueda, setBusqueda] = useState('')
  const [reloadTick, setReloadTick] = useState(0)

  // Datos auxiliares
  const [roles, setRoles] = useState([])

  // UI / Edición
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [loadingAccion, setLoadingAccion] = useState(false)

  // Cargar roles una vez
  useEffect(() => {
    const cargarRoles = async () => {
      try {
        const response = await apiRequest(API_URLS.roles.getAll)
        if (response?.success) setRoles(response.data || [])
      } catch (error) {
        console.error('❌ Error al cargar roles:', error)
      }
    }
    cargarRoles()
  }, [])

  const handleBusqueda = (e) => {
    setBusqueda(e.target.value)
    // Pagination resetea página en cambios de filters
  }

  const seleccionarUsuario = (usuario) => {
    setUsuarioSeleccionado(usuario)
    setModoEdicion(false)
    setMensaje('')
  }

  const activarEdicion = () => setModoEdicion(true)

  // ---- fetchPage para Pagination (server-side) ----
  const fetchUsuariosPage = async ({ page, limit, filters }) => {
    const params = new URLSearchParams({
      pagina: String(page),
      limite: String(limit),
      busqueda: (filters?.q || '').toString()
    }).toString()

    const url = `${API_URLS.usuarios.getAll}?${params}`
    const response = await apiRequest(url, { method: 'GET' })

    if (!response?.success) {
      throw new Error(response?.message || 'Error al obtener usuarios')
    }

    const data = Array.isArray(response.data) ? response.data : []
    const totalSrv = Number.isFinite(response.total) ? response.total : data.length

    if (totalSrv === 0) {
      setMensaje('No hay usuarios para los criterios de búsqueda.')
    } else {
      setMensaje('')
    }

    return { data, total: totalSrv }
  }

  const guardarCambios = async (datosActualizados) => {
    setLoadingAccion(true)

    const usuarioValue = datosActualizados.usuario || datosActualizados.username || ''
    if (!usuarioValue.trim()) {
      setMensaje('El nombre de usuario es obligatorio')
      setLoadingAccion(false)
      setTimeout(() => setMensaje(''), 2500)
      return
    }
    if (!datosActualizados.email?.trim()) {
      setMensaje('El email es obligatorio')
      setLoadingAccion(false)
      setTimeout(() => setMensaje(''), 2500)
      return
    }
    if (!datosActualizados.idRol) {
      setMensaje('Debe seleccionar un rol')
      setLoadingAccion(false)
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
          setReloadTick(t => t + 1) // recarga el listado
        }, 1200)
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
      setLoadingAccion(false)
    }
  }

  const eliminarUsuario = async (usuario) => {
    const nombre = usuario.username || usuario.usuario
    setLoadingAccion(true)

    try {
      const result = await swalConfirm({
        title: `¿Eliminar usuario "${nombre}"?`,
        html: 'Esta acción no se puede deshacer.',
        confirmText: 'Eliminar',
        icon: 'warning',
        preConfirm: async () => {
          const response = await apiRequest(API_URLS.usuarios.delete(usuario.id), { method: 'DELETE' })
          if (!response?.success) throw new Error(response?.message || 'Error al eliminar usuario')
          return true
        }
      })

      if (result.isConfirmed) {
        await swalSuccess('Eliminado', `El usuario "${nombre}" fue eliminado correctamente`)

        setMensaje('✅ Usuario eliminado correctamente')

        if (usuarioSeleccionado?.id === usuario.id) {
          setUsuarioSeleccionado(null)
          setModoEdicion(false)
        }

        setReloadTick(t => t + 1)
      }
    } catch (error) {
      console.error('❌ Error al eliminar usuario:', error)
      setMensaje(`Error al eliminar usuario: ${error.message}`)
      await swalError('Error', error.message || 'No se pudo eliminar el usuario')
    } finally {
      setLoadingAccion(false)
    }
  }

  const volverListado = () => {
    setUsuarioSeleccionado(null)
    setModoEdicion(false)
    setMensaje('')
    setReloadTick(t => t + 1) // recarga
  }

  return (
    <div className='container-fluid py-5 consultar-incidente registrar-guardia consultar-grupo'>
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
      <div className='card edge-to-edge shadow-sm border-0 bg-white'>
        <div className='card-header bg-danger text-white d-flex align-items-center gap-2 py-4'>
          <i className='bi bi-person-fill fs-5'></i>
          <strong>Listado de Usuarios</strong>
        </div>

        <div className='card-body'>
          {mensaje && (
            <div className={`alert ${mensaje.includes('Error') || mensaje.includes('No se') ? 'alert-danger' : 'alert-info'
              }`}>
              {mensaje}
            </div>
          )}

          {/* Listado + buscador con Pagination */}
          {!usuarioSeleccionado && !modoEdicion && (
            <>
              <div className='mb-3 position-relative col-md-5'>
                <i className='bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary'></i>
                <input
                  type='text'
                  className='form-control border-secondary ps-5 py-2'
                  placeholder='Buscar por usuario, email o rol...'
                  value={busqueda}
                  onChange={handleBusqueda}
                  disabled={loadingAccion}
                />
              </div>

              <div className='rg-pager'>
                <Pagination
                  fetchPage={fetchUsuariosPage}
                  initialPage={1}
                  initialPageSize={PAGE_SIZE_DEFAULT}
                  filters={{ q: busqueda, _tick: reloadTick }}
                  showControls
                  labels={{
                    prev: '‹ Anterior',
                    next: 'Siguiente ›',
                    of: '/',
                    showing: (shown, total) => `Mostrando ${shown} de ${total} usuarios`
                  }}
                >
                  {({ items, loading, error }) => (
                    <>
                      {error && (
                        <div className="alert alert-danger d-flex align-items-center">
                          <i className="bi bi-exclamation-triangle-fill me-2"></i>
                          {String(error)}
                        </div>
                      )}

                      {loading && (
                        <div className='text-center mb-3'>
                          <div className='spinner-border text-danger' role='status'></div>
                        </div>
                      )}

                      {items.length > 0 ? (
                        <div className='table-responsive rounded border'>
                          <table className='table table-hover align-middle mb-0 rg-table'>
                            <thead className='bg-light'>
                              <tr>
                                <th className='border-end text-center'>Usuario</th>
                                <th className='border-end text-center'>Email</th>
                                <th className='border-end text-center'>Rol</th>
                                <th className='text-center'>Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((usuario) => (
                                <tr key={usuario.id}>
                                  <td className='border-end' data-label="Usuario">{usuario.usuario || usuario.username}</td>
                                  <td className='border-end' data-label="Email">{usuario.email}</td>
                                  <td className='border-end' data-label="Rol">
                                    <span
                                      className={`badge ${(usuario.rol || '').toLowerCase() === 'administrador'
                                        ? 'bg-danger'
                                        : (usuario.rol || '').toLowerCase() === 'jefe_cuartel'
                                          ? 'bg-warning'
                                          : 'bg-info'
                                        }`}
                                    >
                                      {usuario.rol}
                                    </span>
                                  </td>
                                  <td className='text-center' data-label="Acciones">
                                    <div className="d-inline-flex align-items-center justify-content-center gap-2 flex-nowrap actions-inline">
                                      <button
                                        className='btn btn-outline-secondary btn-detail btn-ver'
                                        onClick={() => seleccionarUsuario(usuario)}
                                        disabled={loading || loadingAccion}
                                      >
                                        <i className='bi bi-eye'></i>
                                        <span className="btn-label ms-1">Ver</span>
                                      </button>
                                      <button
                                        className='btn btn-outline-danger btn-detail btn-trash'
                                        onClick={() => eliminarUsuario(usuario)}
                                        disabled={loading || loadingAccion}
                                      >
                                        <i className='bi bi-trash'></i>
                                      </button>
                                    </div>

                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        !loading && (
                          <div className='text-center py-3 text-muted'>
                            No se encontraron usuarios que coincidan con la búsqueda.
                          </div>
                        )
                      )}
                    </>
                  )}
                </Pagination>
              </div>

            </>
          )}

          {/* Detalles / Edición */}
          {usuarioSeleccionado && (
            <div className='mt-4'>
              <div className='detalle-header d-flex align-items-center justify-content-between mb-3'>
                <h3 className='text-dark mb-0 flex-grow-1 text-truncate pe-2'>
                  {modoEdicion
                    ? `✏️ Editando: ${usuarioSeleccionado.usuario || usuarioSeleccionado.username}`
                    : `👤 Detalles: ${usuarioSeleccionado.usuario || usuarioSeleccionado.username}`}
                </h3>

                <div className="detalle-actions d-flex align-items-center gap-2 flex-shrink-0">
                  {!modoEdicion && (
                    <button
                      className='btn btn-warning btn-sm me-2 d-flex align-items-center gap-1'
                      onClick={activarEdicion}
                      disabled={loadingAccion}
                    >
                      <i className='bi bi-pencil-square'></i>
                      <span className="d-none d-sm-inline">Editar</span>
                    </button>
                  )}
                  <button
                    className='btn btn-outline-secondary btn-sm d-flex align-items-center gap-1'
                    onClick={volverListado}
                    disabled={loadingAccion}
                  >
                    <i className='bi bi-arrow-left'></i>
                    <span className="d-none d-sm-inline">Volver al listado</span>
                  </button>
                </div>
              </div>

              <hr className='border-4 border-danger mb-4' />

              <div className='card bg-light border-0 shadow-sm py-4' style={{ borderRadius: '12px' }}>
                <div className='card-body'>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      guardarCambios(usuarioSeleccionado)
                    }}
                  >
                    <div className='row mb-3'>
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
                          disabled={!modoEdicion || loadingAccion}
                        />
                      </div>

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
                          disabled={!modoEdicion || loadingAccion}
                        />
                      </div>

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
                          disabled={!modoEdicion || loadingAccion}
                        />
                      </div>

                      <div className='col-md-6 py-3'>
                        <label className='form-label text-dark d-flex align-items-center gap-2'>
                          <Shield className='text-primary' /> Rol
                        </label>
                        {/* Campo oculto para validación HTML5 */}
                        <input
                          type="text"
                          value={usuarioSeleccionado.idRol || ''}
                          required={modoEdicion}
                          style={{ position: 'absolute', opacity: 0, height: 0, pointerEvents: 'none' }}
                          tabIndex={-1}
                          onChange={() => { }}
                        />
                        <Select
                          classNamePrefix="rs"
                          placeholder="Seleccione un rol"
                          isDisabled={!modoEdicion || loadingAccion}
                          options={roles.map((rol) => ({
                            value: String(rol.idRol),
                            label: rol.nombreRol
                          }))}
                          value={
                            usuarioSeleccionado.idRol
                              ? {
                                value: String(usuarioSeleccionado.idRol),
                                label: roles.find(r => String(r.idRol) === String(usuarioSeleccionado.idRol))?.nombreRol || ''
                              }
                              : null
                          }
                          onChange={(opt) =>
                            setUsuarioSeleccionado({
                              ...usuarioSeleccionado,
                              idRol: opt ? opt.value : ''
                            })
                          }
                        />
                      </div>
                    </div>

                    {modoEdicion && (
                      <div className='d-flex justify-content-center align-items-center gap-3'>
                        <button type='submit' className='btn btn-accept btn-lg btn-medium' disabled={loadingAccion}>
                          {loadingAccion ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            </div>
          )}

          {!usuarioSeleccionado && onVolver && (
            <div className='d-flex justify-content-start align-items-center gap-3 py-1'>
              <BackToMenuButton onClick={onVolver} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ConsultarUsuario
