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
  const [tipoMensaje, setTipoMensaje] = useState('info')
  const [loading, setLoading] = useState(false)
  const [loadingRoles, setLoadingRoles] = useState(true)
  const [formData, setFormData] = useState({ nombreRol: '', descripcion: '' })

  useEffect(() => { fetchRoles() }, [])

  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => setMensaje(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [mensaje])

  const fetchRoles = async () => {
    try {
      setLoadingRoles(true)
      const data = await apiRequest(API_URLS.roles.getAll)
      setRoles(data.data)
      setResultadosFiltrados(data.data)
    } catch (error) {
      setMensaje('Error al cargar los roles. Por favor, intenta nuevamente.')
      setTipoMensaje('danger')
    } finally {
      setLoadingRoles(false)
    }
  }

  const buscarPorNombre = () => {
    if (nombreBusqueda.trim() === '') {
      setResultadosFiltrados(roles)
      setMensaje('')
      return
    }
    const filtrados = roles.filter(r => r.nombreRol.toLowerCase().includes(nombreBusqueda.toLowerCase()))
    setResultadosFiltrados(filtrados)
    setMensaje(filtrados.length === 0
      ? 'No se encontró ningún rol con ese nombre.'
      : `Se encontraron ${filtrados.length} rol(es) que coinciden con la búsqueda.`)
    setTipoMensaje(filtrados.length === 0 ? 'warning' : 'info')
  }

  const limpiarBusqueda = () => {
    setNombreBusqueda('')
    setResultadosFiltrados(roles)
    setMensaje('')
  }

  const seleccionarRol = (rol) => {
    setRolSeleccionado(rol)
    setFormData({ nombreRol: rol.nombreRol, descripcion: rol.descripcion || '' })
    setModoEdicion(false)
    setMensaje('')
  }

  const activarEdicion = () => setModoEdicion(true)

  const guardarCambios = async (datosActualizados) => {
    try {
      setLoading(true)
      await apiRequest(API_URLS.roles.update(rolSeleccionado.id), {
        method: 'PUT',
        body: JSON.stringify(datosActualizados)
      })
      setMensaje(`Rol "${datosActualizados.nombreRol}" actualizado correctamente`)
      setTipoMensaje('success')
      setModoEdicion(false)
      await fetchRoles()
      setRolSeleccionado(null)
    } catch (error) {
      setMensaje(`Error al actualizar el rol: ${error.message}`)
      setTipoMensaje('danger')
    } finally {
      setLoading(false)
    }
  }

  const eliminarRol = async (rol) => {
    if (!window.confirm(`¿Estás seguro de eliminar el rol "${rol.nombreRol}"?`)) return
    try {
      setLoading(true)
      await apiRequest(API_URLS.roles.delete(rol.id), { method: 'DELETE' })
      setMensaje(`Rol "${rol.nombreRol}" eliminado correctamente`)
      setTipoMensaje('success')
      await fetchRoles()
    } catch (error) {
      setMensaje(`Error al eliminar el rol: ${error.message}`)
      setTipoMensaje('danger')
    } finally {
      setLoading(false)
    }
  }

  const volverListado = () => {
    setRolSeleccionado(null)
    setModoEdicion(false)
    setMensaje('')
  }

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    guardarCambios(formData)
  }

  const isReadOnly = !modoEdicion
  const submitText = 'Guardar Cambios'

  if (loadingRoles) {
    return <div className="text-center text-white">Cargando roles...</div>
  }

  return (
    <div className="container mt-4">
      <h2 className="text-white mb-3">Consultar Roles</h2>

      {mensaje && (
        <div className={`alert alert-${tipoMensaje}`} role="alert">{mensaje}</div>
      )}

      {!rolSeleccionado && (
        <>
          <div className="mb-3 d-flex">
            <input
              type="text"
              className="form-control me-2"
              placeholder="Buscar rol por nombre..."
              value={nombreBusqueda}
              onChange={(e) => setNombreBusqueda(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') buscarPorNombre() }}
              disabled={loading}
            />
            <button className="btn btn-primary btn-sm me-2" onClick={buscarPorNombre}>Buscar</button>
            <button className="btn btn-secondary btn-sm" onClick={limpiarBusqueda}>Limpiar</button>
          </div>

          <table className="table table-dark table-hover table-bordered">
            <thead>
              <tr><th>ID</th><th>Nombre</th><th>Descripción</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {resultadosFiltrados.map(rol => (
                <tr key={rol.id}>
                  <td>{rol.id}</td>
                  <td>{rol.nombreRol}</td>
                  <td>{rol.descripcion || <em className="text-muted">Sin descripción</em>}</td>
                  <td>
                    <button className="btn btn-outline-light btn-sm me-2" onClick={() => seleccionarRol(rol)}>👁️ Ver</button>
                    <button className="btn btn-outline-danger btn-sm" onClick={() => eliminarRol(rol)}>🗑️</button>
                  </td>
                </tr>
              ))}
              {resultadosFiltrados.length === 0 && (
                <tr><td colSpan="4" className="text-center">No hay roles para mostrar</td></tr>
              )}
            </tbody>
          </table>
        </>
      )}

      {rolSeleccionado && (
        <div className="form-rol p-4 shadow rounded w-100" style={{ maxWidth: '500px' }}>
          <h2 className="text-center mb-4">
            {modoEdicion ? 'Editar Rol' : 'Ver Rol'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="nombreRol" className="form-label text-black">Nombre del Rol *</label>
              <input
                type="text"
                className="form-control"
                id="nombreRol"
                required
                value={formData.nombreRol}
                onChange={handleChange}
                disabled={isReadOnly || loading}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="descripcion" className="form-label text-black">Descripción</label>
              <textarea
                className="form-control"
                id="descripcion"
                rows="3"
                value={formData.descripcion}
                onChange={handleChange}
                disabled={isReadOnly || loading}
              />
            </div>
            {!isReadOnly && (
              <button type="submit" className="btn btn-danger w-100 mb-3" disabled={loading}>
                {loading ? 'Guardando...' : submitText}
              </button>
            )}
            <button type="button" className="btn btn-secondary w-100" onClick={volverListado} disabled={loading}>
              Volver
            </button>
          </form>
          {!modoEdicion && (
            <div className="text-center mt-2">
              <button className="btn btn-warning" onClick={activarEdicion} disabled={loading}>✏️ Editar datos</button>
            </div>
          )}
        </div>
      )}

      <div className="text-center mt-4">
        <button className="btn btn-secondary" onClick={onVolver}>Volver al menú</button>
      </div>
    </div>
  )
}

export default ConsultarRol