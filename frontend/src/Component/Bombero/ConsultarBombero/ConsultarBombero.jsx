import { useState } from 'react'
import { API_URLS } from '../../../config/api'
import FormularioBombero from '../FormularioBombero/FormularioBombero'
import { User2, UsersIcon } from 'lucide-react'
import { BackToMenuButton } from '../../Common/Button.jsx'
import Pagination from '../../Common/Pagination'
import { swalConfirm, swalSuccess, swalError } from '../../Common/swalBootstrap'
import '../../../../styles/global.css'

const PAGE_SIZE_DEFAULT = 10

const ConsultarBombero = ({ onVolver }) => {
  const [dniBusqueda, setDniBusqueda] = useState('')
  const [bomberoSeleccionado, setBomberoSeleccionado] = useState(null)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [loadingAccion, setLoadingAccion] = useState(false)

  // Para forzar recargas del listado sin tocar el estado interno del Pagination
  const [reloadTick, setReloadTick] = useState(0)

  // ---- fetchPage para Pagination (server-side) ----
  const fetchBomberosPage = async ({ page, limit, filters }) => {
    const params = new URLSearchParams({
      pagina: page,
      limite: limit
    })
    if (filters?.dni) params.append('busqueda', String(filters.dni).trim())

    const url = `${API_URLS.bomberos.buscar}?${params.toString()}`
    const res = await fetch(url)
    const data = await res.json().catch(() => ({}))

    // Soporta tanto {success,data,total} como array simple
    if (res.ok && data && typeof data === 'object' && 'success' in data) {
      const arr = Array.isArray(data.data) ? data.data : []
      const total = Number(data.total) || arr.length
      return { data: arr, total }
    }
    if (Array.isArray(data)) return { data, total: data.length }
    return { data: [], total: 0 }
  }

  const seleccionarBombero = (bombero) => {
    setBomberoSeleccionado(bombero)
    setModoEdicion(false)
    setMensaje('')
  }

  const activarEdicion = () => setModoEdicion(true)

  const guardarCambios = async (datosActualizados) => {
    const dni = bomberoSeleccionado?.dni
    if (!dni) {
      setMensaje('Error: No se pudo identificar el DNI del bombero')
      return
    }

    setLoadingAccion(true)
    try {
      // Si hay un nuevo archivo de ficha médica, subirlo primero
      if (datosActualizados.fichaMedica && datosActualizados.fichaMedica instanceof File) {
        try {
          const formDataFile = new FormData()
          formDataFile.append('fichaMedica', datosActualizados.fichaMedica)

          const uploadResponse = await fetch(`/api/bomberos/${dni}/ficha-medica`, {
            method: 'POST',
            body: formDataFile
          })

          if (uploadResponse.ok) {
            // El PDF se guardó en la BD, solo marcar que tiene ficha médica
            datosActualizados.fichaMedica = 1
            // NO enviar fichaMedicaArchivo en el PUT para no sobrescribir lo que guardó el POST
            delete datosActualizados.fichaMedicaArchivo
          } else {
            const errorText = await uploadResponse.text()
            console.error('Error al subir ficha médica:', errorText)
          }
        } catch (uploadError) {
          console.error('Error al subir archivo:', uploadError)
        }
      }

      const url = API_URLS.bomberos.update(dni)
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosActualizados)
      })
      const result = await res.json().catch(() => ({}))

      if (res.ok && result?.success) {
        setMensaje('✅ Bombero actualizado correctamente. Volviendo al listado...')
        setModoEdicion(false)
        setTimeout(() => {
          setBomberoSeleccionado(null)
          setMensaje('')
          setReloadTick(t => t + 1) // recarga listado
        }, 1200)
      } else {
        setMensaje(result?.message || result?.error || 'Error al guardar los cambios')
      }
    } catch {
      setMensaje('Error de conexión al guardar cambios')
    } finally {
      setLoadingAccion(false)
    }
  }

  const eliminarBombero = async (bombero) => {
    const dni = bombero?.dni
    const nombreCompleto = [bombero?.nombre, bombero?.apellido].filter(Boolean).join(' ')
    if (!dni) {
      setMensaje('Error: No se pudo identificar el DNI del bombero')
      return
    }

    setLoadingAccion(true)
    try {
      const result = await swalConfirm({
        title: `¿Eliminar bombero ${nombreCompleto ? `"${nombreCompleto}"` : ''}?`,
        html: `DNI: <b>${dni}</b><br>Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        icon: 'warning',
        preConfirm: async () => {
          const url = API_URLS.bomberos.delete(dni)
          const res = await fetch(url, { method: 'DELETE' })
          const data = await res.json().catch(() => ({}))
          if (!res.ok || !data?.success) {
            throw new Error(data?.message || data?.error || 'No se pudo eliminar el bombero')
          }
          return true
        }
      })

      if (result.isConfirmed) {
        await swalSuccess('Eliminado', `El bombero ${nombreCompleto || dni} fue eliminado correctamente`)
        setMensaje('Bombero eliminado correctamente')

        // Si estaba en detalle, limpiamos
        if (bomberoSeleccionado?.dni === dni) {
          setBomberoSeleccionado(null)
          setModoEdicion(false)
        }

        // Recargar el listado
        setReloadTick(t => t + 1)
      }
    } catch (err) {
      const msg = err?.message || 'Error de conexión al eliminar bombero'
      setMensaje(msg)
      await swalError('Error', msg)
    } finally {
      setLoadingAccion(false)
    }
  }


  const volverListado = () => {
    setBomberoSeleccionado(null)
    setModoEdicion(false)
    setMensaje('')
    setReloadTick(t => t + 1)
  }

  return (
    <div className='container-fluid py-5'>
      <div className='text-center mb-4'>
        <div className='d-flex justify-content-center align-items-center gap-3 mb-3'>
          <div className="bg-danger p-3 rounded-circle">
            <UsersIcon size={32} color="white" />
          </div>
          <h1 className="fw-bold text-white fs-3 mb-0">Consultar Bomberos</h1>
        </div>
        <span className="badge bg-danger-subtle text-danger">
          <i className="bi bi-fire me-2"></i> Sistema de Gestión de Personal - Cuartel de Bomberos
        </span>
      </div>

      <div className="card edge-to-edge shadow-sm border-0 bg-white bg-opacity-1 backdrop-blur-sm">
        <div className="card-header bg-danger text-white d-flex align-items-center gap-2 py-4">
          <User2 />
          <strong>Listado de Bomberos</strong>
        </div>

        <div className="card-body">
          {mensaje && (
            <div className={`alert ${mensaje.includes('Error') || mensaje.includes('No se') ? 'alert-danger' :
              mensaje.includes('✅') ? 'alert-success' : 'alert-info'
              }`}>
              {mensaje}
            </div>
          )}

          {/* Listado con paginado (oculto cuando hay un bombero seleccionado) */}
          {!bomberoSeleccionado && (
            <>
              {/* Buscador */}
              <div className="mb-3 position-relative col-md-5">
                <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
                <input
                  type="text"
                  className="form-control ps-5 py-2 border-secondary"
                  placeholder="Buscar por DNI, nombre o apellido..."
                  value={dniBusqueda}
                  onChange={(e) => setDniBusqueda(e.target.value)}
                  disabled={loadingAccion}
                />
              </div>

              <div className='rg-pager'>
                <Pagination
                  fetchPage={fetchBomberosPage}
                  initialPage={1}
                  initialPageSize={PAGE_SIZE_DEFAULT}
                  filters={{ dni: dniBusqueda, _tick: reloadTick }}
                  showControls
                  labels={{
                    prev: '‹ Anterior',
                    next: 'Siguiente ›',
                    of: '/',
                    showing: (shown, total) => `Mostrando ${shown} de ${total} bomberos`
                  }}
                >
                  {({ items, loading, error }) => (
                    <>
                      {error && (
                        <div className="alert alert-danger d-flex align-items-center">
                          <i className="bi bi-exclamation-triangle-fill me-2"></i>
                          {error}
                        </div>
                      )}

                      {loading && (
                        <div className="text-center mb-3">
                          <div className="spinner-border text-danger" role="status"></div>
                        </div>
                      )}

                      {items.length > 0 ? (
                        <div className="table-responsive rounded border">
                          <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light">
                              <tr>
                                <th className="border-end text-center">Nombre completo</th>
                                <th className="border-end text-center">DNI</th>
                                <th className="border-end text-center">Teléfono</th>
                                <th className="border-end text-center">Plan</th>
                                <th className="text-center">Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[...items]
                                .sort((a, b) => (a.apellido || '').localeCompare(b.apellido || ''))
                                .map((bombero) => (
                                  <tr key={bombero.dni}>
                                    <td className="border-end px-3">{bombero.apellido} {bombero.nombre}</td>
                                    <td className="border-end px-3">{bombero.dni}</td>
                                    <td className="border-end px-2">{bombero.telefono || 'N/A'}</td>
                                    <td className="border-end">
                                      <span className={`badge ${bombero.esDelPlan ? 'bg-success' : 'bg-secondary'}`}>
                                        {bombero.esDelPlan ? 'Sí' : 'No'}
                                      </span>
                                    </td>
                                    <td className="text-center">
                                      <button
                                        className="btn btn-outline-secondary btn-detail me-2"
                                        onClick={() => seleccionarBombero(bombero)}
                                        disabled={loading || loadingAccion}
                                      >
                                        <i className="bi bi-eye me-1"></i> Ver
                                      </button>
                                      <button
                                        className="btn btn-outline-danger btn-detail"
                                        onClick={() => eliminarBombero(bombero)}
                                        disabled={loading || loadingAccion}
                                      >
                                        <i className="bi bi-trash"></i>
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        !loading && (
                          <div className="text-center py-3 text-muted">
                            No hay resultados para la búsqueda.
                          </div>
                        )
                      )}
                    </>
                  )}
                </Pagination>
              </div>

            </>
          )}

          {/* Detalle / Edición */}
          {bomberoSeleccionado && (
            <div className="mt-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-2">
                  <i className="text-secondary fs-5"></i>
                  <h3 className="text-dark mb-0">
                    {modoEdicion
                      ? `✏️ Editando: ${bomberoSeleccionado.nombre} ${bomberoSeleccionado.apellido}`
                      : `👤 Detalles: ${bomberoSeleccionado.nombre} ${bomberoSeleccionado.apellido}`}
                  </h3>
                </div>

                <div>
                  {!modoEdicion && (
                    <button
                      className="btn btn-warning btn-sm me-2 d-flex align-items-center gap-1"
                      onClick={activarEdicion}
                    >
                      <i className="bi bi-pencil-square"></i>
                      Editar
                    </button>
                  )}
                  <button
                    className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1"
                    onClick={volverListado}
                  >
                    <i className="bi bi-arrow-left"></i> Volver al listado
                  </button>
                </div>
              </div>

              <hr className="border-4 border-danger mb-4" />

              <div className="text-black border-2 shadow-lg">
                <FormularioBombero
                  modo={modoEdicion ? 'edicion' : 'consulta'}
                  datosIniciales={bomberoSeleccionado}
                  onSubmit={guardarCambios}
                  onVolver={volverListado}
                  loading={loadingAccion}
                  ocultarTitulo={true}
                />
              </div>
            </div>
          )}

          {!bomberoSeleccionado && onVolver && (
            <BackToMenuButton onClick={onVolver} />
          )}
        </div>
      </div>
    </div>
  )
}

export default ConsultarBombero
