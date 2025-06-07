import { useState, useEffect } from 'react'
import './IncendioForestal.css'

const IncendioForestal = ({ datosPrevios = {}, onFinalizar }) => {
  const incidenteId = datosPrevios.id || 'temp'
  const storageKey = `incendioForestal-${incidenteId}`

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem(storageKey)
    return saved ? JSON.parse(saved) : {}
  })

  useEffect(() => {
    setFormData(prev => ({ ...prev, ...datosPrevios }))
  }, [datosPrevios])

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [id]: type === 'checkbox' ? checked : value }))
  }

  const guardarLocalmente = () => {
    localStorage.setItem(storageKey, JSON.stringify(formData))
    alert('Datos guardados localmente. Podés continuar después.')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    localStorage.setItem(storageKey, JSON.stringify(formData))
    console.log('Datos enviados:', formData)
    if (onFinalizar) onFinalizar()
  }

  return (
    <div className="container d-flex justify-content-center align-items-center">
      <div className="form-abm p-4 shadow rounded">
        <h2 className="text-white text-center mb-4">Incendio Forestal</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Características del lugar</label>
            <select className="form-select" id="caracteristicaLugar" value={formData.caracteristicaLugar || ''} onChange={handleChange}>
              <option disabled value="">Seleccione</option>
              <option>Basural</option>
              <option>Bosque cultivado</option>
              <option>Bosque nativo</option>
              <option>Interfase</option>
              <option>Montaña</option>
              <option>Pastizal</option>
              <option>Otro</option>
            </select>
          </div>

          <div className="row mb-3">
            <div className="col">
              <label className="form-label">Área afectada</label>
              <select className="form-select" id="unidadAfectada" value={formData.unidadAfectada || ''} onChange={handleChange}>
                <option disabled value="">Seleccione</option>
                <option>Hectáreas</option>
                <option>Kilómetros</option>
              </select>
            </div>
            <div className="col">
              <label className="form-label">Cantidad</label>
              <input type="number" className="form-control" id="cantidadAfectada" value={formData.cantidadAfectada || ''} onChange={handleChange} />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Causa probable</label>
            <select className="form-select" id="causaProbable" value={formData.causaProbable || ''} onChange={handleChange}>
              <option disabled value="">Seleccione</option>
              <option>Negligencia</option>
              <option>Natural</option>
              <option>Intencional</option>
              <option>Se desconoce</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Detalle de lo sucedido</label>
            <textarea className="form-control" id="detalle" rows="3" value={formData.detalle || ''} onChange={handleChange}></textarea>
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

export default IncendioForestal
