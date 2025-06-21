import { useState, useEffect } from 'react'
import { API_URLS } from '../../../config/api'
import './ParticipacionIncidente.css'
import '../../DisenioFormulario/DisenioFormulario.css'

const ParticipacionIncidente = ({ datosPrevios, onFinalizar, onVolver }) => {
  const [bomberos, setBomberos] = useState([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fechaHoraArribo: '',
    fechaHoraSalida: '',
    personaAlerta: '',
    personaCargo: ''
  })

  // Cargar bomberos y establecer fecha/hora actual al montar el componente
  useEffect(() => {
    cargarBomberos()
    
    // Precargar fecha y hora actual
    const now = new Date()
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
    
    setFormData(prev => ({
      ...prev,
      fechaHoraArribo: localDateTime,
      fechaHoraSalida: localDateTime
    }))
  }, [])

  const cargarBomberos = async () => {
    setLoading(true)
    try {
      const response = await fetch(API_URLS.bomberos.getAll)
      const data = await response.json()
      if (response.ok && data.success) {
        setBomberos(data.data || [])
      } else {
        console.error('Error al cargar bomberos:', data.message)
      }
    } catch (error) {
      console.error('Error al cargar bomberos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const datosCompletos = {
      ...datosPrevios,
      participacion: formData
    }
    
    console.log('Datos completos del incidente:', datosCompletos)
    
    if (onFinalizar) {
      onFinalizar(datosCompletos)
    }
  }

  return (
    <div className="container d-flex justify-content-center align-items-center">
      <div className="formulario-consistente">
        <h2 className="text-black text-center mb-4">Participación del Incidente</h2>

        <form onSubmit={handleSubmit}>
          <div className="row mb-3">
            <div className="col-md-6">
              <label htmlFor="fechaHoraArribo" className="text-black form-label">Fecha y hora de arribo</label>
              <input 
                type="datetime-local" 
                id="fechaHoraArribo" 
                className="form-control" 
                value={formData.fechaHoraArribo}
                onChange={handleChange}
                required 
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="fechaHoraSalida" className="text-black form-label">Fecha y hora de salida</label>
              <input 
                type="datetime-local" 
                id="fechaHoraSalida" 
                className="form-control" 
                value={formData.fechaHoraSalida}
                onChange={handleChange}
                required 
              />
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="personaAlerta" className="text-black form-label">Persona que emitió la alerta</label>
            <select 
              id="personaAlerta" 
              className="form-select" 
              value={formData.personaAlerta}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="">Seleccione persona</option>
              {bomberos.map((bombero) => (
                <option key={bombero.dni || bombero.DNI} value={bombero.dni || bombero.DNI}>
                  {bombero.nombreCompleto}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label htmlFor="personaCargo" className="text-black form-label">Persona a cargo del siniestro</label>
            <select 
              id="personaCargo" 
              className="form-select" 
              value={formData.personaCargo}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="">Seleccione persona</option>
              {bomberos.map((bombero) => (
                <option key={bombero.dni || bombero.DNI} value={bombero.dni || bombero.DNI}>
                  {bombero.nombreCompleto}
                </option>
              ))}
            </select>
          </div>

          {loading && (
            <div className="alert alert-info">
              Cargando bomberos disponibles...
            </div>
          )}

          <div className="botones-accion">
            <button type="submit" className="btn btn-danger" disabled={loading}>
              Finalizar carga
            </button>
            
            {onVolver && (
              <button type="button" className="btn btn-secondary" onClick={onVolver}>
                Volver al menú
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default ParticipacionIncidente
