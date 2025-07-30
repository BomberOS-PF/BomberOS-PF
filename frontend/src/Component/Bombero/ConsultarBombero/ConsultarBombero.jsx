import { useState, useEffect } from 'react'
import { API_URLS } from '../../../config/api'
import FormularioBombero from '../FormularioBombero/FormularioBombero'
//import '../ConsultarBombero/ConsultarBombero.css'
// import '../../DisenioFormulario/DisenioFormulario.css'
import { User2, UsersIcon } from 'lucide-react'

const ConsultarBombero = ({ onVolver }) => {
  const [bomberos, setBomberos] = useState([])
  const [dniBusqueda, setdniBusqueda] = useState('')
  const [resultadosFiltrados, setResultadosFiltrados] = useState([])
  const [bomberoSeleccionado, setBomberoSeleccionado] = useState(null)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchBomberos()
  }, [])

  useEffect(() => {
    if (dniBusqueda.trim() === '') {
      setResultadosFiltrados(bomberos)
      setMensaje('')
      return
    }

    const filtrados = bomberos.filter(b => {
      const dni = String(b.dni || '')
      return dni.includes(dniBusqueda.trim())
    })

    setResultadosFiltrados(filtrados)

    if (filtrados.length === 0) {
      setMensaje('No se encontró ningún bombero con ese dni.')
    } else {
      setMensaje('')
    }
  }, [dniBusqueda, bomberos])

  const fetchBomberos = async () => {
    setLoading(true)
    try {
      const res = await fetch(API_URLS.bomberos.getAll)
      const data = await res.json()

      if (res.ok && data.success) {
        const bomberos = data.data || []
        setBomberos(bomberos)
        setResultadosFiltrados(bomberos)
        setMensaje('')
      } else {
        console.error('❌ Error en respuesta:', data)
        setMensaje(data.message || 'Error al cargar bomberos')
        setBomberos([])
        setResultadosFiltrados([])
      }
    } catch (error) {
      console.error('💥 Error al obtener bomberos:', error)
      setMensaje('Error de conexión. Verifique que el servidor esté funcionando.')
      setBomberos([])
      setResultadosFiltrados([])
    } finally {
      setLoading(false)
    }
  }

  const seleccionarBombero = (bombero) => {
    setBomberoSeleccionado(bombero)
    setModoEdicion(false)
    setMensaje('')
  }

  const activarEdicion = () => {
    setModoEdicion(true)
  }

  const guardarCambios = async (datosActualizados) => {
    const dni = bomberoSeleccionado.dni || bomberoSeleccionado.dni

    if (!dni) {
      console.error('❌ No se encontró dni válido para actualizar')
      setMensaje('Error: No se pudo identificar el dni del bombero')
      return
    }
    // Validación local: evitar legajo/correo duplicados de OTROS bomberos
    const otroConMismoEmail = bomberos.find(b =>
      b.dni !== dni && b.correo?.trim().toLowerCase() === datosActualizados.correo?.trim().toLowerCase()
    )
    const otroConMismoLegajo = bomberos.find(b =>
      b.dni !== dni && b.legajo?.trim().toLowerCase() === datosActualizados.legajo?.trim().toLowerCase()
    )

    if (otroConMismoEmail) {
      setMensaje('❌ El correo electrónico ya está en uso por otro bombero')
      return
    }

    if (otroConMismoLegajo) {
      setMensaje('❌ El legajo ya está en uso por otro bombero')
      return
    }

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

        // Volver al listado después de 1.5 segundos para mostrar el mensaje de éxito
        setTimeout(() => {
          setBomberoSeleccionado(null)
          setMensaje('')
        }, 1500)

        fetchBomberos() // Recargar lista
      } else {
        console.error('❌ Error al guardar:', result)
        setMensaje(result.message || result.error || 'Error al guardar los cambios')
      }
    } catch (error) {
      console.error('💥 Error al guardar cambios:', error)
      setMensaje('Error de conexión al guardar cambios')
    } finally {
      setLoading(false)
    }
  }

  const eliminarBombero = async (bombero) => {
    const dni = bombero.dni || bombero.dni

    if (!dni) {
      console.error('❌ No se encontró dni válido:', bombero)
      setMensaje('Error: No se pudo identificar el dni del bombero')
      return
    }

    if (!window.confirm(`¿Estás seguro de que querés eliminar al bombero ${bombero.nombre && bombero.apellido ? `${bombero.nombre} ${bombero.apellido}` : 'seleccionado'}?`)) return

    setLoading(true)
    try {
      const url = API_URLS.bomberos.delete(dni)

      const res = await fetch(url, {
        method: 'DELETE'
      })

      const result = await res.json()

      if (res.ok && result.success) {
        setMensaje('Bombero eliminado correctamente')
        fetchBomberos() // Recargar lista

        // Si el bombero eliminado estaba seleccionado, limpiar selección
        if (bomberoSeleccionado && (bomberoSeleccionado.dni === dni || bomberoSeleccionado.dni === dni)) {
          setBomberoSeleccionado(null)
          setModoEdicion(false)
        }
      } else {
        console.error('❌ Error al eliminar:', result)
        setMensaje(result.message || result.error || 'No se pudo eliminar el bombero')
      }
    } catch (error) {
      console.error('💥 Error al eliminar bombero:', error)
      setMensaje('Error de conexión al eliminar bombero')
    } finally {
      setLoading(false)
    }
  }

  const volverListado = () => {
    setBomberoSeleccionado(null)
    setModoEdicion(false)
    setMensaje('')
    fetchBomberos() // Recargar después de editar
  }

  return (
    <div className='container-fluid py-5'>
      <div className='text-center mb-4'>
        <div className='d-flex justify-content-center align-items-center gap-3 mb-3'>
          <div className="bg-danger p-3 rounded-circle">
            <UsersIcon size={32}
              color="white" />
          </div>
          <h1 className="fw-bold text-white fs-3 mb-0">Consultar Bomberos</h1>
        </div>
        <span className="badge bg-danger-subtle text-danger">
          <i className="bi bi-fire me-2"></i> Sistema de Gestión de Personal - Cuartel de Bomberos
        </span>
      </div>

      <div className="card shadow-sm border-0 bg-white bg-opacity-1 backdrop-blur-sm">
        <div className="card-header bg-danger text-white d-flex align-items-center gap-2 py-4">
          <User2 />
          <strong>Listado de Bomberos</strong>
        </div>
        <div className="card-body">
          {mensaje && (
            <div
              className={`alert ${mensaje.includes('Error') || mensaje.includes('No se') ? 'alert-danger' :
                mensaje.includes('✅') ? 'alert-success' : 'alert-info'
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

          {/* Buscador */}
          {!bomberoSeleccionado && (
            <>
              <div className="mb-3 position-relative">
                <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
                <input
                  type="text"
                  className="form-control ps-5 py-3 border-secondary"
                  placeholder="Buscar por DNI..."
                  value={dniBusqueda}
                  onChange={(e) => setdniBusqueda(e.target.value)}
                  disabled={loading}
                />
              </div>

              {resultadosFiltrados.length > 0 ? (
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
                      {[...resultadosFiltrados]
                        .sort((a, b) => (a.apellido || '').localeCompare(b.apellido || ''))
                        .map((bombero) => (
                          <tr key={bombero.dni}>
                            <td className="border-end px-3">{bombero.nombre} {bombero.apellido}</td>
                            <td className="border-end px-3">{bombero.dni}</td>
                            <td className="border-end px-2">{bombero.telefono || 'N/A'}</td>
                            <td className="border-end text-primary">{bombero.correo || 'N/A'}</td>
                            <td className="border-end">
                              <span className={`badge ${bombero.esDelPlan ? 'bg-success' : 'bg-secondary'}`}>
                                {bombero.esDelPlan ? 'Sí' : 'No'}
                              </span>
                            </td>
                            <td className="text-center">
                              <button
                                className="btn btn-outline-secondary btn-sm me-2"
                                onClick={() => seleccionarBombero(bombero)}
                                disabled={loading}
                              >
                                <i className="bi bi-eye me-1"></i> Ver
                              </button>
                              <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => eliminarBombero(bombero)}
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
              ) : !loading && resultadosFiltrados.length === 0 && (
                <div className="text-center py-3 text-muted">
                  No hay resultados para la búsqueda.
                </div>
              )}
            </>
          )}

          {/* Detalles */}
          {bomberoSeleccionado && (
            <div className="mt-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center gap-2">
                  <i className="text-secondary fs-5"></i>
                  <h3 className="text-dark mb-0">
                    {modoEdicion ? `✏️ Editando: ${bomberoSeleccionado.nombre} ${bomberoSeleccionado.apellido}` : `👤 Detalles: ${bomberoSeleccionado.nombre} ${bomberoSeleccionado.apellido}`}
                  </h3>
                </div>

                <div>
                  {!modoEdicion && (
                    <button className="btn btn-warning btn-sm me-2 d-flex align-items-center gap-1" onClick={activarEdicion}>
                      <i className="bi bi-pencil-square"></i>
                      Editar
                    </button>
                  )}
                  <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" onClick={volverListado}>
                    <i className="bi bi-arrow-left"></i> Volver al listado
                  </button>
                </div>
              </div>

              <hr className="border-4 border-danger mb-4" />

              <div className="card bg-dark text-white border-0 shadow-lg py-4">
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
          <div className="d-grid gap-3 py-2"></div>
          <button type="button" className="btn btn-secondary" onClick={onVolver} disabled={loading}>
            Volver al menú
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConsultarBombero
