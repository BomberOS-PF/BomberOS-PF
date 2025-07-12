import { useState, useEffect } from 'react'
import { apiRequest, API_URLS } from '../../config/api'
import '../DisenioFormulario/DisenioFormulario.css'

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

  const buscarPorNombre = () => {
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
  }

  const limpiarBusqueda = () => {
    setNombreBusqueda('')
    setResultadosFiltrados(roles)
    setMensaje('')
  }

  const seleccionarRol = (rol) => {
    setRolSeleccionado(rol)
    setModoEdicion(false)
    setMensaje('')
  }

  const activarEdicion = () => setModoEdicion(true)

  const guardarCambios = async (datosActualizados) => {
    setLoading(true)
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
      } else {
        setMensaje(response.message || 'Error al guardar los cambios')
      }
    } catch (error) {
      setMensaje('Error de conexión al guardar cambios')
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
    <div className="container mt-4 formulario-consistente">
      <h2 className="text-black mb-3">Consultar Roles</h2>

      {mensaje && (
        <div className={`alert ${
          mensaje.includes('Error') ? 'alert-danger' :
          mensaje.includes('✅') ? 'alert-success' : 'alert-info'
        }`}>
          {mensaje}
        </div>
      )}

      {!rolSeleccionado && !modoEdicion && (
        <>
          <div className="mb-3 d-flex">
            <input
              type="text"
              className="form-control me-2"
              placeholder="Buscar por nombre del rol..."
              value={nombreBusqueda}
              onChange={(e) => setNombreBusqueda(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') buscarPorNombre() }}
            />
            <button
              className="btn btn-primary btn-sm me-2"
              onClick={buscarPorNombre}
              disabled={loading}
            >
              Buscar
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={limpiarBusqueda}
              disabled={loading}
            >
              Limpiar
            </button>
          </div>

          <div className="table-responsive">
            <table className="tabla-bomberos">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {resultadosFiltrados.map((rol) => (
                  <tr key={rol.idRol}>
                    <td>{rol.idRol}</td>
                    <td>{rol.nombreRol}</td>
                    <td>{rol.descripcion || <em className="text-muted">Sin descripción</em>}</td>
                    <td>
                      <button
                        className="btn btn-outline-light btn-sm me-2"
                        onClick={() => seleccionarRol(rol)}
                        disabled={loading}
                      >
                        Ver detalles
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => eliminarRol(rol)}
                        disabled={loading}
                      >
                        ❌
                      </button>
                    </td>
                  </tr>
                ))}
                {resultadosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center text-white">No hay roles para mostrar</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {rolSeleccionado && (
        <div className="formulario-consistente detalle-usuario">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="text-black mb-0">
              {modoEdicion ? (
                <>✏️ Editando: {rolSeleccionado.nombreRol}</>
              ) : (
                <>👁️ Detalles: {rolSeleccionado.nombreRol}</>
              )}
            </h3>
            <div className="d-flex gap-2">
              {!modoEdicion && (
                <button
                  className="btn btn-warning btn-sm"
                  onClick={activarEdicion}
                  disabled={loading}
                >
                  ✏️ Editar
                </button>
              )}
              <button
                className="btn btn-secondary btn-sm"
                onClick={volverListado}
                disabled={loading}
              >
                ← Volver al listado
              </button>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              guardarCambios({
                nombreRol: rolSeleccionado.nombreRol,
                descripcion: rolSeleccionado.descripcion
              })
            }}
          >
            <div className="mb-3">
              <label htmlFor="nombreRol" className="form-label text-white">Nombre del Rol *</label>
              <input
                type="text"
                id="nombreRol"
                className="form-control"
                value={rolSeleccionado.nombreRol}
                onChange={(e) => setRolSeleccionado({ ...rolSeleccionado, nombreRol: e.target.value })}
                disabled={!modoEdicion || loading}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="descripcion" className="form-label text-white">Descripción</label>
              <textarea
                id="descripcion"
                className="form-control"
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
      )}

      <div className="text-center mt-4">
        <button className="btn-volver btn-secondary" onClick={onVolver} disabled={loading}>
          Volver
        </button>
      </div>
    </div>
  )
}

export default ConsultarRol
