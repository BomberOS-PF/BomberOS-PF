import { useState, useEffect } from 'react'
import { apiRequest, API_URLS } from '../../config/api'
import { ShieldUser, User2, UsersIcon } from 'lucide-react'
// import '../DisenioFormulario/DisenioFormulario.css'
import { BackToMenuButton } from '../Common/Button'

const ConsultarRol = ({ onVolver }) => {
  const [roles, setRoles] = useState([])
  const [nombreBusqueda, setNombreBusqueda] = useState('')
  const [resultadosFiltrados, setResultadosFiltrados] = useState([])
  const [rolSeleccionado, setRolSeleccionado] = useState(null)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchRoles()
  }, [])

  useEffect(() => {
    if (nombreBusqueda.trim() === '') {
      setResultadosFiltrados(roles)
      setMensaje('')
      return
    }

    const filtrados = roles.filter(r =>
      r.nombreRol.toLowerCase().includes(nombreBusqueda.toLowerCase())
    )

    setResultadosFiltrados(filtrados)
    setMensaje(filtrados.length === 0 ? 'No se encontró ningún rol con ese nombre.' : '')
  }, [nombreBusqueda, roles])


  const fetchRoles = async () => {
    setLoading(true)
    try {
      const data = await apiRequest(API_URLS.roles.getAll)
      if (data.success) {
        setRoles(data.data)
        setResultadosFiltrados(data.data)
        setMensaje('')
      } else {
        setMensaje(data.message || 'Error al cargar roles')
      }
    } catch (error) {
      setMensaje('Error de conexión. Verifique que el servidor esté funcionando.')
    } finally {
      setLoading(false)
    }
  }

  const seleccionarRol = (rol) => {
    setRolSeleccionado(rol)
    setModoEdicion(false)
    setMensaje('')
  }

  const activarEdicion = () => setModoEdicion(true)

  const guardarCambios = async (datosActualizados) => {
    setLoading(true)

    if (!datosActualizados.nombreRol.trim()) {
      setMensaje('El nombre del rol es obligatorio')
      setLoading(false)
      setTimeout(() => setMensaje(''), 2500)
      return
    }

    try {
      const response = await apiRequest(API_URLS.roles.update(rolSeleccionado.idRol), {
        method: 'PUT',
        body: JSON.stringify(datosActualizados)
      })

      if (response.success) {
        setMensaje('✅ Rol actualizado correctamente')
        setModoEdicion(false)
        setTimeout(() => {
          setRolSeleccionado(null)
          setMensaje('')
        }, 1500)
        fetchRoles()
      }
    } catch (error) {
      const errorMsg = error?.response?.error || error.message || 'Error al guardar'

      if (
        errorMsg.toLowerCase().includes('disponible') ||
        errorMsg.toLowerCase().includes('ya existe') ||
        errorMsg.toLowerCase().includes('duplicado')
      ) {
        setMensaje('Nombre de rol ya registrado')
      } else {
        setMensaje(errorMsg)
      }

      setTimeout(() => setMensaje(''), 2500)
    } finally {
      setLoading(false)
    }
  }

  const eliminarRol = async (rol) => {
    if (!window.confirm(`¿Estás seguro de eliminar el rol "${rol.nombreRol}"?`)) return
    setLoading(true)
    try {
      const response = await apiRequest(API_URLS.roles.delete(rol.idRol), {
        method: 'DELETE'
      })

      if (response.success) {
        setMensaje('✅ Rol eliminado correctamente')
        fetchRoles()
        if (rolSeleccionado?.idRol === rol.idRol) {
          setRolSeleccionado(null)
          setModoEdicion(false)
        }
      } else {
        setMensaje(response.message || 'No se pudo eliminar el rol')
      }
    } catch (error) {
      setMensaje('Error de conexión al eliminar rol')
    } finally {
      setLoading(false)
    }
  }

  const volverListado = () => {
    setRolSeleccionado(null)
    setModoEdicion(false)
    setMensaje('')
    fetchRoles()
  }

  return (
    <div className='container-fluid py-5'>
      {/* Header principal */}
      <div className='text-center mb-4'>
        <div className='d-flex justify-content-center align-items-center gap-3 mb-3'>
          <div className="bg-danger p-3 rounded-circle">
            <ShieldUser size={32}
              color="white" />
          </div>
          <h1 className="fw-bold text-white fs-3 mb-0">Consultar Roles</h1>
        </div>
        <span className="badge bg-danger-subtle text-danger">
          <i className="bi bi-fire me-2"></i> Sistema de Gestión de Personal - Cuartel de Bomberos
        </span>
      </div>

      {/* Card principal */}
      <div className="card shadow-sm border-0 bg-white">
        <div className="card-header bg-danger text-white d-flex align-items-center gap-2 py-4">
          <i className="bi bi-people-fill fs-5"></i>
          <strong>Listado de Roles</strong>
        </div>
        <div className="card-body">
          {/* Mensajes */}
          {mensaje && (
            <div className={`alert ${mensaje.includes('Error') ? 'alert-danger' :
              mensaje.includes('✅') ? 'alert-success' : 'alert-info'
              }`}>
              {mensaje}
            </div>
          )}

          {loading && (
            <div className="text-center mb-3">
              <div className="spinner-border text-danger" role="status"></div>
            </div>
          )}

          {/* Listado */}
          {!rolSeleccionado && !modoEdicion && (
            <>
              <div className="mb-3 position-relative">
                <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
                <input
                  type="text"
                  className="form-control border-secondary ps-5 py-3"
                  placeholder="Buscar por nombre del rol..."
                  value={nombreBusqueda}
                  onChange={(e) => setNombreBusqueda(e.target.value)}
                  disabled={loading}
                />
              </div>

              {resultadosFiltrados.length > 0 ? (
                <div className="table-responsive rounded border">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th className="border-end text-center">Nombre</th>
                        <th className="border-end text-center">Descripción</th>
                        <th className="text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultadosFiltrados.map((rol) => (
                        <tr key={rol.idRol}>
                          <td className="border-end">{rol.nombreRol}</td>
                          <td className="border-end">
                            {rol.descripcion || <em className="text-muted">Sin descripción</em>}
                          </td>
                          <td className="text-center">
                            <button
                              className="btn btn-outline-secondary btn-sm me-2"
                              onClick={() => seleccionarRol(rol)}
                              disabled={loading}
                            >
                              <i className="bi bi-eye me-1"></i> Ver
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => eliminarRol(rol)}
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
                  No hay roles para mostrar.
                </div>
              )}
            </>
          )}

          {/* Detalles */}
          {rolSeleccionado && (
            <div className="mt-4">
              <div className="d-flex align-items-center justify-content-between mb-3 gap-5">
                <div className="d-flex align-items-center gap-2">
                  <h3 className="text-dark mb-0">
                    {modoEdicion
                      ? `✏️ Editando: ${rolSeleccionado.nombreRol}`
                      : `👁️ Detalles: ${rolSeleccionado.nombreRol}`}
                  </h3>
                </div>

                <div>
                  {!modoEdicion && (
                    <button
                      className="btn btn-warning btn-sm me-2 d-flex align-items-center gap-1"
                      onClick={activarEdicion}
                      disabled={loading}
                    >
                      <i className="bi bi-pencil-square"></i>
                      Editar
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

              {/* Formulario de edición */}
              <div className="card bg-light border-0 shadow-sm py-4" style={{borderRadius: '12px'}}>
                <form
                  className="px-4"
                  onSubmit={(e) => {
                    e.preventDefault()
                    guardarCambios({
                      nombreRol: rolSeleccionado.nombreRol,
                      descripcion: rolSeleccionado.descripcion
                    })
                  }}
                >
                  <div className="mb-3">
                    <label htmlFor="nombreRol" className="form-label text-dark">Nombre del Rol *</label>
                    <input
                      type="text"
                      id="nombreRol"
                      className="form-control border-secondary"
                      value={rolSeleccionado.nombreRol}
                      onChange={(e) => setRolSeleccionado({ ...rolSeleccionado, nombreRol: e.target.value })}
                      disabled={!modoEdicion || loading}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="descripcion" className="form-label text-dark">Descripción</label>
                    <textarea
                      id="descripcion"
                      className="form-control border-secondary"
                      rows="3"
                      value={rolSeleccionado.descripcion || ''}
                      onChange={(e) => setRolSeleccionado({ ...rolSeleccionado, descripcion: e.target.value })}
                      disabled={!modoEdicion || loading}
                    />
                  </div>

                  {modoEdicion && (
                    <button type="submit" className="btn btn-danger w-100 mb-3" disabled={loading}>
                      {loading ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  )}
                </form>
              </div>
            </div>
          )}

          {/* Botón volver menú */}
          <div className="d-grid gap-3 py-4">
            <BackToMenuButton onClick={onVolver} />
          </div>
        </div>
      </div>
    </div>
  )

}

export default ConsultarRol
