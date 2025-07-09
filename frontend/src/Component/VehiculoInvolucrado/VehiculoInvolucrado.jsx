import { useState, useEffect } from 'react'
import { API_URLS } from '../../config/api'
// import './VehiculoInvolucrado.css'
import '../DisenioFormulario/DisenioFormulario.css'

const VehiculoInvolucrado = ({ onVolver }) => {
  const [participa, setParticipa] = useState(false)
  const [bomberos, setBomberos] = useState([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    choferMovil: '',
    aCargoMovil: '',
    retornoMovil: '',
    dotacionSeleccionada: []
  })

  // Cargar bomberos al montar el componente
  useEffect(() => {
    cargarBomberos()
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

  const handleDotacionChange = (bomberodni, checked) => {
    setFormData(prev => ({
      ...prev,
      dotacionSeleccionada: checked
        ? [...prev.dotacionSeleccionada, bomberodni]
        : prev.dotacionSeleccionada.filter(dni => dni !== bomberodni)
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (participa) {
      console.log('Datos del vehículo:', formData)
      // Aquí iría la lógica para enviar los datos
    }
    if (onVolver) onVolver()
  }

  return (
    <div className="container d-flex justify-content-center align-items-center">
      <div className="formulario-consistente">
        <h2 className="text-black text-center mb-4">Vehículo involucrado</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-check form-switch mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="participaVehiculo"
              checked={participa}
              onChange={(e) => setParticipa(e.target.checked)}
            />
            <label className="form-check-label text-black" htmlFor="participaVehiculo">
              ¿Participó vehículo del cuartel?
            </label>
          </div>

          <fieldset disabled={!participa}>
            <div className="mb-3">
              <label htmlFor="choferMovil" className="form-label text-black">Chofer del móvil</label>
              <select 
                id="choferMovil" 
                className="form-select" 
                value={formData.choferMovil}
                onChange={handleChange}
                required={participa}
                disabled={loading}
              >
                <option value="">Seleccione chofer</option>
                {bomberos.map((bombero) => (
                  <option key={bombero.dni} value={bombero.dni}>
                    {bombero.nombre && bombero.apellido ? `${bombero.nombre} ${bombero.apellido}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label htmlFor="aCargoMovil" className="form-label text-black">Persona a cargo del móvil</label>
              <select 
                id="aCargoMovil" 
                className="form-select" 
                value={formData.aCargoMovil}
                onChange={handleChange}
                required={participa}
                disabled={loading}
              >
                <option value="">Seleccione responsable</option>
                {bomberos.map((bombero) => (
                  <option key={bombero.dni || bombero.dni} value={bombero.dni || bombero.dni}>
                    {bombero.nombre && bombero.apellido ? `${bombero.nombre} ${bombero.apellido}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label htmlFor="retornoMovil" className="form-label text-black">Fecha y hora de retorno del móvil</label>
              <input 
                type="datetime-local" 
                id="retornoMovil" 
                className="form-control" 
                value={formData.retornoMovil}
                onChange={handleChange}
                required={participa}
              />
            </div>

            <div className="mb-3">
              <label className="form-label text-black">Dotación de bomberos</label>
              {loading ? (
                <p className="text-black">Cargando bomberos...</p>
              ) : (
                bomberos.map((bombero) => (
                  <div className="form-check text-black ms-2" key={bombero.dni || bombero.dni}>
                    <input 
                      className="text-black form-check-input" 
                      type="checkbox" 
                      id={`bombero-${bombero.dni || bombero.dni}`}
                      checked={formData.dotacionSeleccionada.includes(bombero.dni || bombero.dni)}
                      onChange={(e) => handleDotacionChange(bombero.dni || bombero.dni, e.target.checked)}
                    />
                    <label className="text-black form-check-label" htmlFor={`bombero-${bombero.dni || bombero.dni}`}>
                      {bombero.nombre && bombero.apellido ? `${bombero.nombre} ${bombero.apellido}` : ''}
                    </label>
                  </div>
                ))
              )}
            </div>
          </fieldset>

          <div className="botones-accion">
            <button type="submit" className="btn btn-danger">
              {participa ? 'Guardar datos del vehículo' : 'Continuar sin vehículo'}
            </button>
            
            {onVolver && (
              <button type="button" className="btn btn-secondary" onClick={onVolver}>
                Volver
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default VehiculoInvolucrado
