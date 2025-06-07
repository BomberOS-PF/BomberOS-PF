import { useState, useEffect } from 'react'
import './Rescate.css'

const Rescate = ({ datosPrevios = {}, onFinalizar }) => {
  const incidenteId = datosPrevios.id || 'temp'
  const storageKey = `rescate-${incidenteId}`

  const [formData, setFormData] = useState(() => {
    const guardado = localStorage.getItem(storageKey)
    return guardado ? JSON.parse(guardado) : { ...datosPrevios }
  })

  const [mostrarOtroLugar, setMostrarOtroLugar] = useState(formData.lugar === 'Otro')

  useEffect(() => {
    setFormData(prev => ({ ...prev, ...datosPrevios }))
  }, [datosPrevios])

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }))
    if (id === 'lugar') {
      setMostrarOtroLugar(value === 'Otro')
    }
  }

  const guardarLocalmente = () => {
    localStorage.setItem(storageKey, JSON.stringify(formData))
    alert('Datos guardados localmente. Podés continuar después.')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    localStorage.setItem(storageKey, JSON.stringify(formData))
    if (onFinalizar) onFinalizar()
  }

  return (
    <div className="container d-flex justify-content-center align-items-center">
      <div className="form-abm p-4 shadow rounded">
        <h2 className="text-white text-center mb-4">Rescate</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Lugar</label>
            <select className="form-select" id="lugar" value={formData.lugar || ''} onChange={handleChange}>
              <option disabled value="">Seleccione</option>
              <option>Arroyo</option>
              <option>Lago</option>
              <option>Bar</option>
              <option>Montaña</option>
              <option>Río</option>
              <option>Restaurant-Comedor</option>
              <option>Otro</option>
            </select>
          </div>

          {mostrarOtroLugar && (
            <div className="mb-3">
              <label className="form-label">Describa el otro tipo de lugar</label>
              <input type="text" className="form-control" id="otroLugar" value={formData.otroLugar || ''} onChange={handleChange} />
            </div>
          )}

          <div className="mb-3">
            <label className="form-label">Detalle de lo sucedido</label>
            <textarea className="form-control" rows="3" id="detalle" value={formData.detalle || ''} onChange={handleChange}></textarea>
          </div>

          <h5 className="text-white mt-4">Personas damnificadas</h5>
          <div className="row mb-3">
            <div className="col">
              <label className="form-label">Nombre</label>
              <input type="text" className="form-control" id="nombre" value={formData.nombre || ''} onChange={handleChange} />
            </div>
            <div className="col">
              <label className="form-label">Apellido</label>
              <input type="text" className="form-control" id="apellido" value={formData.apellido || ''} onChange={handleChange} />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col">
              <label className="form-label">Domicilio</label>
              <input type="text" className="form-control" id="domicilio" value={formData.domicilio || ''} onChange={handleChange} />
            </div>
            <div className="col">
              <label className="form-label">Teléfono</label>
              <input type="tel" className="form-control" id="telefono" value={formData.telefono || ''} onChange={handleChange} />
            </div>
            <div className="col">
              <label className="form-label">DNI</label>
              <input type="text" className="form-control" id="dni" value={formData.dni || ''} onChange={handleChange} />
            </div>
          </div>

          <div className="mb-3 form-check">
            <input type="checkbox" className="form-check-input" id="fallecio" checked={formData.fallecio || false} onChange={handleChange} />
            <label className="form-check-label" htmlFor="fallecio">¿Falleció?</label>
          </div>

          <button type="submit" className="btn btn-danger w-100 mt-3">Finalizar carga</button>
          <button type="button" className="btn btn-secondary w-100 mt-2" onClick={guardarLocalmente}>Guardar y continuar después</button>
        </form>
      </div>
    </div>
  )
}

export default Rescate
