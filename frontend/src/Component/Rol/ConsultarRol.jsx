import { useState, useEffect } from 'react'
import FormularioRol from './FormularioRol'
import { apiRequest, API_URLS } from '../../config/api'
import './ConsultarRol.css'

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

  useEffect(() => {
    fetchRoles()
  }, [])

  // Limpiar mensajes después de 5 segundos
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
      console.error('Error al obtener roles:', error)
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

    if (filtrados.length === 0) {
      setMensaje('No se encontró ningún rol con ese nombre.')
      setTipoMensaje('warning')
    } else {
      setMensaje(`Se encontraron ${filtrados.length} rol(es) que coinciden con la búsqueda.`)
      setTipoMensaje('info')
    }
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

  const activarEdicion = () => {
    setModoEdicion(true)
  }

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
      console.error('Error al guardar cambios:', error)
      setMensaje(`Error al actualizar el rol: ${error.message}`)
      setTipoMensaje('danger')
    } finally {
      setLoading(false)
    }
  }

  const eliminarRol = async (rol) => {
    const confirmMessage = `¿Estás seguro de que quieres eliminar el rol "${rol.nombreRol}"?\n\nEsta acción no se puede deshacer.`
    if (!window.confirm(confirmMessage)) return
    
    try {
      setLoading(true)
      await apiRequest(API_URLS.roles.delete(rol.id), {
        method: 'DELETE'
      })
      setMensaje(`Rol "${rol.nombreRol}" eliminado correctamente`)
      setTipoMensaje('success')
      await fetchRoles()
    } catch (error) {
      console.error('Error al eliminar rol:', error)
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

  if (loadingRoles) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando roles...</span>
          </div>
          <p className="mt-2 text-white">Cargando roles...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mt-4">
      <h2 className="text-white mb-3">Consultar Roles</h2>

      {mensaje && (
        <div className={`alert alert-${tipoMensaje} alert-dismissible fade show`} role="alert">
          {mensaje}
          <button type="button" className="btn-close" onClick={() => setMensaje('')}></button>
        </div>
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
            <table className="table table-dark table-hover table-bordered">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(resultadosFiltrados) && resultadosFiltrados.map((rol) => (
                  <tr key={rol.id}>
                    <td>{rol.id}</td>
                    <td>{rol.nombreRol}</td>
                    <td>{rol.descripcion || <em className="text-muted">Sin descripción</em>}</td>
                    <td>
                      <button 
                        className="btn btn-outline-light btn-sm me-2" 
                        onClick={() => seleccionarRol(rol)}
                        disabled={loading}
                        title="Ver y editar rol"
                      >
                        👁️ Ver
                      </button>
                      <button 
                        className="btn btn-outline-danger btn-sm" 
                        onClick={() => eliminarRol(rol)}
                        disabled={loading}
                        title={`Eliminar rol "${rol.nombreRol}"`}
                      >
                        {loading ? '⏳' : '🗑️'}
                      </button>
                    </td>
                  </tr>
                ))}
                {resultadosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center text-muted">
                      No hay roles para mostrar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {rolSeleccionado && (
        <>
          <FormularioRol
            modo={modoEdicion ? 'edicion' : 'consulta'}
            datosIniciales={rolSeleccionado}
            onSubmit={guardarCambios}
            onVolver={volverListado}
            loading={loading}
          />
          {!modoEdicion && (
            <div className="text-center mt-2">
              <button 
                className="btn btn-warning me-2" 
                onClick={activarEdicion}
                disabled={loading}
              >
                ✏️ Editar datos
              </button>
            </div>
          )}
        </>
      )}

      <div className="text-center mt-4">
        <button 
          className="btn btn-secondary" 
          onClick={onVolver}
          disabled={loading}
        >
          Volver al menú
        </button>
      </div>
    </div>
  )
}

export default ConsultarRol
