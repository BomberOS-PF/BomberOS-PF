import { useState, useEffect } from 'react'
import FormularioBombero from '../FormularioBombero/FormularioBombero'
import '../ConsultarBombero/ConsultarBombero.css'

const ConsultarBombero = ({ onVolver }) => {
  const [bomberos, setBomberos] = useState([])
  const [dniBusqueda, setDniBusqueda] = useState('')
  const [resultadosFiltrados, setResultadosFiltrados] = useState([])
  const [bomberoSeleccionado, setBomberoSeleccionado] = useState(null)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    fetchBomberos()
  }, [])

  const fetchBomberos = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/bomberos')
      const data = await res.json()
      setBomberos(data.data)
      setResultadosFiltrados(data.data)
    } catch (error) {
      console.error('Error al obtener bomberos:', error)
    }
  }

  const buscarPorDNI = () => {
    if (dniBusqueda.trim() === '') {
      setResultadosFiltrados(bomberos)
      setMensaje('')
      return
    }

    const filtrados = bomberos.filter(b => String(b.DNI) === String(dniBusqueda))
    setResultadosFiltrados(filtrados)

    if (filtrados.length === 0) {
      setMensaje('No se encontró ningún bombero con ese DNI.')
    } else {
      setMensaje('')
    }
  }

  const limpiarBusqueda = () => {
    setDniBusqueda('')
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
    try {
      const res = await fetch(`http://localhost:3000/api/bomberos/${bomberoSeleccionado.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosActualizados)
      })
      if (res.ok) {
        setMensaje('Cambios guardados correctamente')
        setModoEdicion(false)
        fetchBomberos()
      } else {
        const error = await res.json()
        setMensaje(error.error || 'Error al guardar los cambios')
      }
    } catch (error) {
      console.error('Error al guardar cambios:', error)
      setMensaje('Error de conexión')
    }
  }

  const volverListado = () => {
    setBomberoSeleccionado(null)
    setModoEdicion(false)
    setMensaje('')
  }

  return (
    <div className="container mt-4">
      <h2 className="text-white mb-3">Consultar Bomberos</h2>

      {mensaje && <div className="alert alert-info">{mensaje}</div>}

      {!bomberoSeleccionado && (
        <>
          <div className="mb-3 d-flex">
            <input
                type="text"
                className="form-control me-2 buscador-dni"
                placeholder="Buscar por DNI"
                value={dniBusqueda}
                onChange={(e) => setDniBusqueda(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') buscarPorDNI() }}
            />
            <button className="btn btn-primary btn-sm me-2" onClick={buscarPorDNI}>Buscar</button>
            <button className="btn btn-secondary btn-limpiar" onClick={limpiarBusqueda}>Limpiar</button>
          </div>

          <table className="table table-dark table-hover table-bordered">
            <thead>
              <tr>
                <th>Nombre completo</th>
                <th>DNI</th>
                <th>Teléfono</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(resultadosFiltrados) && resultadosFiltrados.map((b) => (
                <tr key={b.id}>
                  <td>{b.nombreCompleto}</td>
                  <td>{b.DNI}</td>
                  <td>{b.telefono}</td>
                  <td>
                    <button className="btn btn-outline-light btn-sm" onClick={() => seleccionarBombero(b)}>
                      Ver detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {bomberoSeleccionado && (
        <>
          <FormularioBombero
            modo={modoEdicion ? 'edicion' : 'consulta'}
            datosIniciales={bomberoSeleccionado}
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
    </div>
  )
}

export default ConsultarBombero
