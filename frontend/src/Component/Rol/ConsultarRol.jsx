import { useState, useEffect } from 'react'
import FormularioRol from './FormularioRol'
import './ConsultarRol.css'

const ConsultarRol = ({ onVolver }) => {
  const [roles, setRoles] = useState([])
  const [nombreBusqueda, setNombreBusqueda] = useState('')
  const [resultadosFiltrados, setResultadosFiltrados] = useState([])
  const [rolSeleccionado, setRolSeleccionado] = useState(null)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/roles')
      const data = await res.json()
      setRoles(data.data)
      setResultadosFiltrados(data.data)
    } catch (error) {
      console.error('Error al obtener roles:', error)
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
    } else {
      setMensaje('')
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
      const res = await fetch(`http://localhost:3000/api/roles/${rolSeleccionado.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosActualizados)
      })
      if (res.ok) {
        setMensaje('Cambios guardados correctamente')
        setModoEdicion(false)
        fetchRoles()
        setRolSeleccionado(null)
      } else {
        const error = await res.json()
        setMensaje(error.error || 'Error al guardar los cambios')
      }
    } catch (error) {
      console.error('Error al guardar cambios:', error)
      setMensaje('Error de conexión')
    }
  }

  const eliminarRol = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este rol?')) return
    try {
      const res = await fetch(`http://localhost:3000/api/roles/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setMensaje('Rol eliminado correctamente')
        fetchRoles()
      } else {
        const error = await res.json()
        setMensaje(error.error || 'Error al eliminar el rol')
      }
    } catch (error) {
      console.error('Error al eliminar rol:', error)
      setMensaje('Error de conexión')
    }
  }

  const volverListado = () => {
    setRolSeleccionado(null)
    setModoEdicion(false)
    setMensaje('')
  }

  return (
    <div className="container mt-4">
      <h2 className="text-white mb-3">Consultar Roles</h2>

      {mensaje && <div className="alert alert-info">{mensaje}</div>}

      {!rolSeleccionado && (
        <>
          <div className="mb-3 d-flex">
            <input
              type="text"
              className="form-control me-2"
              placeholder="Buscar por nombre"
              value={nombreBusqueda}
              onChange={(e) => setNombreBusqueda(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') buscarPorNombre() }}
            />
            <button className="btn btn-primary btn-sm me-2" onClick={buscarPorNombre}>Buscar</button>
            <button className="btn btn-secondary btn-sm" onClick={limpiarBusqueda}>Limpiar</button>
          </div>

          <table className="table table-dark table-hover table-bordered">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(resultadosFiltrados) && resultadosFiltrados.map((r) => (
                <tr key={r.id}>
                  <td>{r.nombreRol}</td>
                  <td>{r.descripcion}</td>
                  <td>
                    <button className="btn btn-outline-light btn-sm me-2" onClick={() => seleccionarRol(r)}>
                      Ver detalles
                    </button>
                    <button className="btn btn-outline-danger btn-sm" onClick={() => eliminarRol(r.id)}>
                      ❌
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {rolSeleccionado && (
        <>
          <FormularioRol
            modo={modoEdicion ? 'edicion' : 'consulta'}
            datosIniciales={rolSeleccionado}
            onSubmit={guardarCambios}
            onVolver={volverListado}
          />
          {!modoEdicion && (
            <div className="text-center mt-2">
              <button className="btn btn-warning" onClick={activarEdicion}>Editar datos</button>
            </div>
          )}
        </>
      )}

      <div className="text-center mt-4">
        <button className="btn btn-secondary" onClick={onVolver}>Volver al menú</button>
      </div>
    </div>
  )
}

export default ConsultarRol
