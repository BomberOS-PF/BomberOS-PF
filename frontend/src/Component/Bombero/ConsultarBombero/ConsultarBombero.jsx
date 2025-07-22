import { useState, useEffect } from 'react'
import { API_URLS } from '../../../config/api'
import FormularioBombero from '../FormularioBombero/FormularioBombero'
//import '../ConsultarBombero/ConsultarBombero.css'
import '../../DisenioFormulario/DisenioFormulario.css'

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

  const buscarPordni = () => {
   
    if (dniBusqueda.trim() === '') {
      setResultadosFiltrados(bomberos)
      setMensaje('')
      return
    }

    const filtrados = bomberos.filter(b => {
      const dni = String(b.dni || b.dni || '')
      return dni.includes(dniBusqueda.trim())
    })
    
    setResultadosFiltrados(filtrados)

    if (filtrados.length === 0) {
      setMensaje('No se encontró ningún bombero con ese dni.')
    } else {
      setMensaje('')
    }
  }

  const limpiarBusqueda = () => {
    setdniBusqueda('')
    setResultadosFiltrados(bomberos)
    setMensaje('')
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
    
    if (!window.confirm(`¿Estás seguro de que querés eliminar al bombero ${bombero.nombre && bombero.apellido ? `${bombero.nombre} ${bombero.apellido}`: 'seleccionado'}?`)) return

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
    <>
      <div className="container mt-4 formulario-consistente">
        <h2 className="text-black mb-3">Consultar Bomberos</h2>

        {mensaje && (
          <div className={`alert ${
            mensaje.includes('Error') || mensaje.includes('No se') ? 'alert-danger' : 
            mensaje.includes('✅') || mensaje.includes('correctamente') ? 'alert-success' : 
            'alert-info'
          }`}>
            {mensaje}
          </div>
        )}

        {loading && (
          <div className="text-center text-black mb-3">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        )}

        {!bomberoSeleccionado && (
          <>
            <div className="mb-3 d-flex">
              <input
                type="text"
                className="form-control me-2 buscador-dni"
                placeholder="Buscar por dni"
                value={dniBusqueda}
                onChange={(e) => setdniBusqueda(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') buscarPordni() }}
                disabled={loading}
              />
              <button 
                className="btn btn-primary btn-sm me-2" 
                onClick={buscarPordni}
                disabled={loading}
              >
                Buscar
              </button>
              <button 
                className="btn btn-secondary btn-limpiar" 
                onClick={limpiarBusqueda}
                disabled={loading}
              >
                Limpiar
              </button>
            </div>

            {resultadosFiltrados.length > 0 ? (
              <div className="table-responsive">
                <table className="tabla-bomberos">
                  <thead>
                    <tr>
                      <th>Nombre completo</th>
                      <th>DNI</th>
                      <th>Teléfono</th>
                      <th>Email</th>
                      <th>Es del Plan</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...resultadosFiltrados]
                      .sort((a, b) => (a.apellido || '').localeCompare(b.apellido || '', undefined, { sensitivity: 'base' }))
                      .map((bombero, index) => (
                        <tr key={bombero.dni || index}>
                          <td>{bombero.nombre && bombero.apellido ? `${bombero.nombre} ${bombero.apellido}` : bombero.nombre || bombero.apellido || 'N/A'}</td>
                          <td>{bombero.dni || 'N/A'}</td>
                          <td>{bombero.telefono || 'N/A'}</td>
                          <td>{bombero.correo || 'N/A'}</td>
                          <td>
                            <span className={`badge ${(bombero.esDelPlan || bombero.es_del_plan) ? 'bg-success' : 'bg-secondary'}`}>
                              {(bombero.esDelPlan || bombero.es_del_plan) ? 'Sí' : 'No'}
                            </span>
                          </td>
                          <td>
                            <button
                              className="btn btn-outline-light btn-sm me-2"
                              onClick={() => seleccionarBombero(bombero)}
                              disabled={loading}
                            >
                              Ver detalles
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => eliminarBombero(bombero)}
                              disabled={loading}
                              title="Eliminar bombero"
                            >
                              ❌
                            </button>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : !loading && bomberos.length === 0 ? (
              <div className="text-center text-black">
                <p>No hay bomberos registrados.</p>
              </div>
            ) : !loading && resultadosFiltrados.length === 0 && dniBusqueda ? (
              <div className="text-center text-black">
                <p>No se encontraron bomberos que coincidan con la búsqueda.</p>
              </div>
            ) : null}
          </>
        )}

        {bomberoSeleccionado && (
          <div className="detalle-bombero">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="text-black mb-0">
                {modoEdicion ? (
                  <>✏️ Editando: {bomberoSeleccionado.nombre && bomberoSeleccionado.apellido ? `${bomberoSeleccionado.nombre} ${bomberoSeleccionado.apellido}` : 'Bombero'}</>
                ) : (
                  <>👤 Detalles: {bomberoSeleccionado.nombre && bomberoSeleccionado.apellido ? `${bomberoSeleccionado.nombre} ${bomberoSeleccionado.apellido}` : 'Bombero'}</>
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
            
            <FormularioBombero
              modo={modoEdicion ? 'edicion' : 'consulta'}
              datosIniciales={bomberoSeleccionado}
              onSubmit={guardarCambios}
              onVolver={volverListado}
              loading={loading}
              ocultarTitulo={true}
            />
          </div>
        )}
        <div className="text-center mt-4">
        <button className="btn-volver btn-secondary" onClick={onVolver} disabled={loading}>
          Volver
        </button>
      </div>
      </div>
    </>
  )
}

export default ConsultarBombero
