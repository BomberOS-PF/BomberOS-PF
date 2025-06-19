import { useEffect, useState } from 'react'
import './ConsultarIncidente.css'

const ConsultarIncidente = ({ onVolver }) => {
  const [accidentes, setAccidentes] = useState([])
  const [idBusqueda, setIdBusqueda] = useState('')
  const [filtrados, setFiltrados] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchAccidentes()
  }, [])

  const fetchAccidentes = async () => {
    setLoading(true)
    try {
      const res = await fetch('http://localhost:3000/api/accidentes')
      const data = await res.json()

      if (res.ok && data.success) {
        setAccidentes(data.data)
        setFiltrados(data.data)
        setMensaje('')
      } else {
        setMensaje(data.message || 'Error al cargar incidentes')
      }
    } catch (err) {
      setMensaje('Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  const buscarPorId = () => {
    if (!idBusqueda.trim()) {
      setFiltrados(accidentes)
      setMensaje('')
      return
    }

    const resultados = accidentes.filter(a =>
      String(a.idIncidente).includes(idBusqueda.trim())
    )

    setFiltrados(resultados)
    setMensaje(resultados.length === 0 ? 'No se encontró ningún incidente con ese ID' : '')
  }

  const limpiarBusqueda = () => {
    setIdBusqueda('')
    setFiltrados(accidentes)
    setMensaje('')
  }

  return (
    <div className="container mt-4">
      <h2 className="text-white mb-3">Consultar Incidentes</h2>

      {mensaje && (
        <div className={`alert ${
          mensaje.includes('Error') || mensaje.includes('No se') ? 'alert-danger' :
          'alert-info'
        }`}>{mensaje}</div>
      )}

      {loading && (
        <div className="text-center text-white mb-3">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      )}

      <div className="mb-3 d-flex">
        <input
          type="text"
          className="form-control me-2 buscador-dni"
          placeholder="Buscar por ID de Incidente"
          value={idBusqueda}
          onChange={(e) => setIdBusqueda(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') buscarPorId() }}
          disabled={loading}
        />
        <button className="btn btn-primary btn-sm me-2" onClick={buscarPorId} disabled={loading}>
          Buscar
        </button>
        <button className="btn btn-secondary btn-limpiar" onClick={limpiarBusqueda} disabled={loading}>
          Limpiar
        </button>
      </div>

      {filtrados.length > 0 && (
        <div className="table-responsive">
          <table className="table table-dark table-hover table-bordered">
            <thead>
              <tr>
                <th>ID Accidente</th>
                <th>ID Incidente</th>
                <th>Detalle</th>
                <th>Vehículos</th>
                <th>Damnificados</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((a, i) => (
                <tr key={i}>
                  <td>{a.idAccidenteTransito}</td>
                  <td>{a.idIncidente}</td>
                  <td>{a.detalle}</td>
                  <td>
                    <ul className="mb-0">
                      {(a.vehiculos || []).map((v, idx) => (
                        <li key={idx}>{v.tipo} - {v.modelo} - {v.dominio}</li>
                      ))}
                    </ul>
                  </td>
                  <td>
                    <ul className="mb-0">
                      {(a.damnificados || []).map((d, idx) => (
                        <li key={idx}>{d.nombre} {d.apellido} - DNI: {d.dni} {d.fallecio ? '☠️' : ''}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-center mt-4">
        <button className="btn btn-light" onClick={onVolver} disabled={loading}>
          Volver
        </button>
      </div>
    </div>
  )
}

export default ConsultarIncidente
