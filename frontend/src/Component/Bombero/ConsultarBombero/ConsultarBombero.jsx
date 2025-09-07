import { useState, useEffect } from 'react'
import { API_URLS } from '../../../config/api'
import FormularioBombero from '../FormularioBombero/FormularioBombero'
import { User2, UsersIcon } from 'lucide-react'
import { BackToMenuButton } from '../../Common/Button'

const ConsultarBombero = ({ onVolver }) => {
  // ==== MISMA ESTRUCTURA QUE REGISTRARGUARDIA ====
  const [busqueda, setBusqueda] = useState('')
  const [paginaActual, setPaginaActual] = useState(1)
  const [limite] = useState(10)
  const [total, setTotal] = useState(0)

  const [bomberos, setBomberos] = useState([])

  // Detalle / Edición
  const [bomberoSeleccionado, setBomberoSeleccionado] = useState(null)
  const [modoEdicion, setModoEdicion] = useState(false)

  // UI
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchBomberos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginaActual, busqueda])

  const fetchBomberos = async () => {
    setLoading(true)
    try {
      const url = `${API_URLS.bomberos.buscar}?pagina=${paginaActual}&limite=${limite}&busqueda=${encodeURIComponent(busqueda)}`
      const res = await fetch(url)
      const data = await res.json()

      if (res.ok && data.success) {
        // Si el backend ya viene paginado:
        // - data.data: página actual
        // - data.total: total global de registros
        setBomberos(data.data || [])
        setTotal(data.total || 0)
        setMensaje('')
      } else {
        setBomberos([])
        setTotal(0)
        setMensaje(data.message || 'Error al cargar bomberos')
      }
    } catch (error) {
      setBomberos([])
      setTotal(0)
      setMensaje('Error de conexión. Verifique que el servidor esté funcionando.')
    } finally {
      setLoading(false)
    }
  }

  const handleBusqueda = (e) => {
    setBusqueda(e.target.value)
    setPaginaActual(1) // reset igual que en RegistrarGuardia
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
      setMensaje('Error: No se pudo identificar el dni del bombero')
      return
    }

    // Validaciones básicas contra duplicados (podés delegarlo al backend si ya valida)
    const otroConMismoEmail = bomberos.find(b =>
      b.dni !== dni && b.correo?.trim().toLowerCase() === datosActualizados.correo?.trim().toLowerCase()
    )
    const otroConMismoLegajo = bomberos.find(b =>
      b.dni !== dni && (b.legajo || '').trim().toLowerCase() === (datosActualizados.legajo || '').trim().toLowerCase()
    )
    if (otroConMismoEmail) return setMensaje('❌ El correo electrónico ya está en uso por otro bombero')
    if (otroConMismoLegajo) return setMensaje('❌ El legajo ya está en uso por otro bombero')

    setLoading(true)
    try {
      const url = API_URLS.bomberos.update(dni)
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosActualizados)
      })
      const result = await res.json()

      if (res.ok && result.success) {
        setMensaje('✅ Bombero actualizado correctamente. Volviendo al listado...')
        setModoEdicion(false)
        setTimeout(() => {
          setBomberoSeleccionado(null)
          setMensaje('')
        }, 1500)
        fetchBomberos()
      } else {
        setMensaje(result.message || result.error || 'Error al guardar los cambios')
      }
    } catch {
      setMensaje('Error de conexión al guardar cambios')
    } finally {
      setLoading(false)
    }
  }

  const eliminarBombero = async (bombero) => {
    const dni = bombero?.dni
    if (!dni) {
      setMensaje('Error: No se pudo identificar el dni del bombero')
      return
    }
    if (!window.confirm(`¿Estás seguro de eliminar a ${bombero.nombre || ''} ${bombero.apellido || ''}?`)) return

    setLoading(true)
    try {
      const url = API_URLS.bomberos.delete(dni)
      const res = await fetch(url, { method: 'DELETE' })
      const result = await res.json()

      if (res.ok && result.success) {
        setMensaje('Bombero eliminado correctamente')
        // Si al eliminar quedara vacía la página y no es la primera, retrocede una
        const quedaVacia = bomberos.length === 1 && paginaActual > 1
        if (quedaVacia) {
          setPaginaActual(prev => Math.max(1, prev - 1))
        } else {
          fetchBomberos()
        }

        if (bomberoSeleccionado?.dni === dni) {
          setBomberoSeleccionado(null)
          setModoEdicion(false)
        }
      } else {
        setMensaje(result.message || result.error || 'No se pudo eliminar el bombero')
      }
    } catch {
      setMensaje('Error de conexión al eliminar bombero')
    } finally {
      setLoading(false)
    }
  }

  const volverListado = () => {
    setBomberoSeleccionado(null)
    setModoEdicion(false)
    setMensaje('')
    fetchBomberos()
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

      <div className="card shadow-sm border-0 bg-white">
        <div className="card-header bg-danger text-white d-flex align-items-center gap-2 py-4">
          <User2 />
          <strong>Listado de Bomberos</strong>
        </div>

        <div className="card-body">
          {mensaje && (
            <div
              className={`alert ${
                mensaje.includes('Error') || mensaje.includes('No se') ? 'alert-danger'
                : mensaje.includes('✅') ? 'alert-success'
                : 'alert-info'
              }`}
            >
              {mensaje}
            </div>
          )}

          {loading && (
            <div className="text-center mb-3">
              <div className="spinner-border text-danger" role="status"></div>
            </div>
          )}

          {/* Buscador (igual patrón que RegistrarGuardia: server-side) */}
          {!bomberoSeleccionado && (
            <>
              <div className="mb-3 position-relative">
                <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
                <input
                  type="text"
                  className="form-control border-secondary ps-5 py-3"
                  placeholder="Buscar por DNI..."
                  value={dniBusqueda}
                  onChange={(e) => setdniBusqueda(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Tabla paginada por backend */}
              {bomberos.length > 0 ? (
                <>
                  <div className="table-responsive rounded border">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th className="border-end text-center">Nombre completo</th>
                          <th className="border-end text-center">DNI</th>
                          <th className="border-end text-center">Teléfono</th>
                          <th className="border-end text-center">Email</th>
                          <th className="border-end text-center">Plan</th>
                          <th className="text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bomberos.map((b) => (
                          <tr key={b.dni}>
                            <td className="border-end px-3">{b.nombre} {b.apellido}</td>
                            <td className="border-end px-3">{b.dni}</td>
                            <td className="border-end px-2">{b.telefono || 'N/A'}</td>
                            <td className="border-end text-primary">{b.correo || 'N/A'}</td>
                            <td className="border-end">
                              <span className={`badge ${b.esDelPlan ? 'bg-success' : 'bg-secondary'}`}>
                                {b.esDelPlan ? 'Sí' : 'No'}
                              </span>
                            </td>
                            <td className="text-center">
                              <button
                                className="btn btn-outline-secondary btn-sm me-2"
                                onClick={() => seleccionarBombero(b)}
                                disabled={loading}
                              >
                                <i className="bi bi-eye me-1"></i> Ver
                              </button>
                              <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => eliminarBombero(b)}
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

                  {/* Paginación (tal cual en RegistrarGuardia) */}
                  <div className="d-flex justify-content-center mb-3 py-2">
                    {Array.from({ length: Math.ceil(total / limite) }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setPaginaActual(i + 1)}
                        type='button'
                        className={`btn btn-sm me-1 custom-page-btn ${paginaActual === i + 1 ? 'active' : ''}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </>
              ) : !loading ? (
                <div className="text-center py-3 text-muted">
                  No hay resultados para la búsqueda.
                </div>
              ) : null}
            </>
          )}

          {/* Detalles / Edición */}
          {bomberoSeleccionado && (
            <div className="mt-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-2">
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
                      <i className="bi bi-pencil-square"></i> Editar
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

              <div className="card bg-light border-0 shadow-sm py-4" style={{borderRadius: '12px'}}>
                <FormularioBombero
                  modo={modoEdicion ? 'edicion' : 'consulta'}
                  datosIniciales={bomberoSeleccionado}
                  onSubmit={guardarCambios}
                  onVolver={volverListado}
                  loading={loading}
                  ocultarTitulo={true}
                />
              </div>
            </div>
          )}

          <div className="d-grid gap-3 py-2" />
          <BackToMenuButton onClick={onVolver} />
        </div>
      </div>
    </div>
  )
}

export default ConsultarBombero
