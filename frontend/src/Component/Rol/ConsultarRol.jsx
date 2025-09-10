// src/Component/Rol/ConsultarRol.jsx
import { useState } from 'react'
import { apiRequest, API_URLS } from '../../config/api'
import { ShieldUser } from 'lucide-react'
import { BackToMenuButton } from '../Common/Button'
import '../../../styles/global.css'
import Pagination from '../Common/Pagination'

const PAGE_SIZE_DEFAULT = 10

const ConsultarRol = ({ onVolver }) => {
  // búsqueda + tick para refrescar la grilla luego de acciones
  const [busqueda, setBusqueda] = useState('')
  const [reloadTick, setReloadTick] = useState(0)

  // selección / edición
  const [rolSeleccionado, setRolSeleccionado] = useState(null)
  const [modoEdicion, setModoEdicion] = useState(false)

  // mensajes y loading de acciones (Pagination maneja el suyo)
  const [mensaje, setMensaje] = useState('')
  const [loadingAccion, setLoadingAccion] = useState(false)

  const handleBusqueda = (e) => setBusqueda(e.target.value)
  const seleccionarRol = (rol) => { setRolSeleccionado(rol); setModoEdicion(false); setMensaje('') }
  const activarEdicion = () => setModoEdicion(true)

  // ---- fetchPage para Pagination (server-side) ----
  const fetchRolesPage = async ({ page, limit, filters }) => {
    const params = new URLSearchParams({
      pagina: String(page),
      limite: String(limit),
      busqueda: (filters?.q || '').toString()
    }).toString()

    const url = `${API_URLS.roles.getAll}?${params}`
    const response = await apiRequest(url, { method: 'GET' })

    if (!response?.success) {
      throw new Error(response?.message || 'Error al obtener roles')
    }

    const data = Array.isArray(response.data) ? response.data : []
    const totalSrv = Number.isFinite(response.total) ? response.total : data.length

    setMensaje(totalSrv === 0 ? 'No hay roles para los criterios de búsqueda.' : '')

    return { data, total: totalSrv }
  }

  const guardarCambios = async (datosActualizados) => {
    if (!datosActualizados.nombreRol?.trim()) {
      setMensaje('El nombre del rol es obligatorio')
      setTimeout(() => setMensaje(''), 2500)
      return
    }

    setLoadingAccion(true)
    try {
      const response = await apiRequest(API_URLS.roles.update(rolSeleccionado.idRol), {
        method: 'PUT',
        body: JSON.stringify({
          nombreRol: datosActualizados.nombreRol,
          descripcion: datosActualizados.descripcion || ''
        })
      })

      if (response?.success) {
        setMensaje('✅ Rol actualizado correctamente')
        setModoEdicion(false)
        setTimeout(() => {
          setRolSeleccionado(null)
          setMensaje('')
          setReloadTick((t) => t + 1) // recarga listado
        }, 1200)
      } else {
        throw new Error(response?.message || 'Error al guardar')
      }
    } catch (error) {
      const msg = error?.response?.error || error.message || 'Error al guardar'
      setMensaje(
        /disponible|ya existe|duplicado/i.test(msg)
          ? 'Nombre de rol ya registrado'
          : msg
      )
      setTimeout(() => setMensaje(''), 2500)
    } finally {
      setLoadingAccion(false)
    }
  }

  const eliminarRol = async (rol) => {
    if (!window.confirm(`¿Estás seguro de eliminar el rol "${rol.nombreRol}"?`)) return

    setLoadingAccion(true)
    try {
      const response = await apiRequest(API_URLS.roles.delete(rol.idRol), { method: 'DELETE' })
      if (response?.success) {
        setMensaje('✅ Rol eliminado correctamente')
        if (rolSeleccionado?.idRol === rol.idRol) {
          setRolSeleccionado(null)
          setModoEdicion(false)
        }
        setReloadTick((t) => t + 1)
      } else {
        setMensaje(response?.message || 'No se pudo eliminar el rol')
      }
    } catch {
      setMensaje('Error de conexión al eliminar rol')
    } finally {
      setLoadingAccion(false)
    }
  }

  const volverListado = () => {
    setRolSeleccionado(null)
    setModoEdicion(false)
    setMensaje('')
    setReloadTick((t) => t + 1)
  }

  return (
    <div className='container-fluid py-5'>
      {/* Header principal */}
      <div className='text-center mb-4'>
        <div className='d-flex justify-content-center align-items-center gap-3 mb-3'>
          <div className='bg-danger p-3 rounded-circle'>
            <ShieldUser size={32} color='white' />
          </div>
          <h1 className='fw-bold text-white fs-3 mb-0'>Consultar Roles</h1>
        </div>
        <span className='badge bg-danger-subtle text-danger'>
          <i className='bi bi-fire me-2'></i> Sistema de Gestión de Personal - Cuartel de Bomberos
        </span>
      </div>

      {/* Card principal */}
      <div className='card shadow-sm border-0 bg-white'>
        <div className='card-header bg-danger text-white d-flex align-items-center gap-2 py-4'>
          <i className='bi bi-people-fill fs-5'></i>
          <strong>Listado de Roles</strong>
        </div>

        <div className='card-body'>
          {/* Mensajes */}
          {mensaje && (
            <div className={`alert ${
              mensaje.includes('Error') ? 'alert-danger' :
              mensaje.includes('✅') ? 'alert-success' : 'alert-info'
            }`}>
              {mensaje}
            </div>
          )}

          {/* Listado con paginación */}
          {!rolSeleccionado && !modoEdicion && (
            <>
              <div className='mb-3 position-relative'>
                <i className='bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary'></i>
                <input
                  type='text'
                  className='form-control border-secondary ps-5 py-3'
                  placeholder='Buscar por nombre del rol...'
                  value={busqueda}
                  onChange={handleBusqueda}
                  disabled={loadingAccion}
                />
              </div>

              <Pagination
                fetchPage={fetchRolesPage}
                initialPage={1}
                initialPageSize={PAGE_SIZE_DEFAULT}   // ✅ 10 por página
                filters={{ q: busqueda, _tick: reloadTick }}
                showControls
                labels={{
                  prev: '‹ Anterior',
                  next: 'Siguiente ›',
                  of: '/',
                  showing: (shown, total) => `Mostrando ${shown} de ${total} roles`
                }}
              >
                {({ items, loading, error }) => (
                  <>
                    {error && (
                      <div className='alert alert-danger d-flex align-items-center'>
                        <i className='bi bi-exclamation-triangle-fill me-2'></i>
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
                        <table className='table table-hover align-middle mb-0'>
                          <thead className='bg-light'>
                            <tr>
                              <th className='border-end text-center'>Nombre</th>
                              <th className='border-end text-center'>Descripción</th>
                              <th className='text-center'>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((rol) => (
                              <tr key={rol.idRol}>
                                <td className='border-end'>{rol.nombreRol}</td>
                                <td className='border-end'>
                                  {rol.descripcion || <em className='text-muted'>Sin descripción</em>}
                                </td>
                                <td className='text-center'>
                                  <button
                                    className='btn btn-outline-secondary btn-sm me-2'
                                    onClick={() => seleccionarRol(rol)}
                                    disabled={loading || loadingAccion}
                                  >
                                    <i className='bi bi-eye me-1'></i> Ver
                                  </button>
                                  <button
                                    className='btn btn-outline-danger btn-sm'
                                    onClick={() => eliminarRol(rol)}
                                    disabled={loading || loadingAccion}
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
                      !loading && (
                        <div className='text-center py-3 text-muted'>
                          No hay roles para mostrar.
                        </div>
                      )
                    )}
                  </>
                )}
              </Pagination>
            </>
          )}

          {/* Detalles / Edición */}
          {rolSeleccionado && (
            <div className='mt-4'>
              <div className='d-flex align-items-center justify-content-between mb-3 gap-5'>
                <h3 className='text-dark mb-0'>
                  {modoEdicion ? `✏️ Editando: ${rolSeleccionado.nombreRol}` : `👁️ Detalles: ${rolSeleccionado.nombreRol}`}
                </h3>

                <div>
                  {!modoEdicion && (
                    <button
                      className='btn btn-warning btn-sm me-2 d-flex align-items-center gap-1'
                      onClick={activarEdicion}
                      disabled={loadingAccion}
                    >
                      <i className='bi bi-pencil-square'></i> Editar
                    </button>
                  )}
                  <button
                    className='btn btn-outline-secondary btn-sm d-flex align-items-center gap-1'
                    onClick={volverListado}
                    disabled={loadingAccion}
                  >
                    <i className='bi bi-arrow-left'></i> Volver al listado
                  </button>
                </div>
              </div>

              <hr className='border-4 border-danger mb-4' />

              <div className='card bg-light border-0 shadow-sm py-4' style={{ borderRadius: '12px' }}>
                <form
                  className='px-4'
                  onSubmit={(e) => {
                    e.preventDefault()
                    guardarCambios({
                      nombreRol: rolSeleccionado.nombreRol,
                      descripcion: rolSeleccionado.descripcion
                    })
                  }}
                >
                  <div className='mb-3'>
                    <label htmlFor='nombreRol' className='form-label text-dark'>Nombre del Rol *</label>
                    <input
                      type='text'
                      id='nombreRol'
                      className='form-control border-secondary'
                      value={rolSeleccionado.nombreRol}
                      onChange={(e) => setRolSeleccionado({ ...rolSeleccionado, nombreRol: e.target.value })}
                      disabled={!modoEdicion || loadingAccion}
                    />
                  </div>

                  <div className='mb-3'>
                    <label htmlFor='descripcion' className='form-label text-dark'>Descripción</label>
                    <textarea
                      id='descripcion'
                      className='form-control border-secondary'
                      rows='3'
                      value={rolSeleccionado.descripcion || ''}
                      onChange={(e) => setRolSeleccionado({ ...rolSeleccionado, descripcion: e.target.value })}
                      disabled={!modoEdicion || loadingAccion}
                    />
                  </div>

                  {modoEdicion && (
                    <button type='submit' className='btn btn-danger w-100 mb-3' disabled={loadingAccion}>
                      {loadingAccion ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  )}
                </form>
              </div>
            </div>
          )}

          {/* Botón volver menú */}
          <div className='d-grid gap-3 py-4'>
            <BackToMenuButton onClick={onVolver} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConsultarRol
