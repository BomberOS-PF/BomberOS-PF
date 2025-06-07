import { useState, useEffect } from 'react'
import './FactorClimatico.css'

const FactorClimatico = ({ datosPrevios = {}, onFinalizar }) => {
  const incidenteId = datosPrevios.id || 'temp'
  const storageKey = `factorClimatico-${incidenteId}`

  const [formData, setFormData] = useState(() => {
    const guardado = localStorage.getItem(storageKey)
    return guardado ? JSON.parse(guardado) : {}
  })

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...datosPrevios
    }))
  }, [datosPrevios])

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }))
  }

  const guardarLocalmente = () => {
    localStorage.setItem(storageKey, JSON.stringify(formData))
    alert('Datos guardados localmente. Podés continuar después.')
  }

  const handleFinalizar = (e) => {
    e.preventDefault()
    localStorage.setItem(storageKey, JSON.stringify(formData))
    console.log('Datos enviados:', formData)
    if (onFinalizar) onFinalizar()
  }

  return (
    <div className="container d-flex justify-content-center align-items-center">
      <div className="form-abm p-4 shadow rounded">
        <h2 className="text-white text-center mb-4">Factores Climáticos</h2>
        <form onSubmit={handleFinalizar}>
          <div className="row mb-3">
            <div className="col">
              <label htmlFor="superficie" className="form-label">Superficie evacuada</label>
              <select className="form-select" id="superficie" onChange={handleChange} value={formData.superficie || ''}>
                <option disabled value="">Seleccione una opción</option>
                <option>Menos de 100 m²</option>
                <option>100 - 500 m²</option>
                <option>500 - 1000 m²</option>
                <option>Más de 1000 m²</option>
              </select>
            </div>
            <div className="col">
              <label htmlFor="personasEvacuadas" className="form-label">Cantidad de personas evacuadas</label>
              <input type="number" className="form-control" id="personasEvacuadas" value={formData.personasEvacuadas || ''} onChange={handleChange} />
            </div>
          </div>

          <h5 className="text-white mt-4">Personas damnificadas</h5>
          <div className="row mb-3">
            <div className="col">
              <label htmlFor="nombre" className="form-label">Nombre</label>
              <input type="text" className="form-control" id="nombre" value={formData.nombre || ''} onChange={handleChange} />
            </div>
            <div className="col">
              <label htmlFor="apellido" className="form-label">Apellido</label>
              <input type="text" className="form-control" id="apellido" value={formData.apellido || ''} onChange={handleChange} />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col">
              <label htmlFor="domicilio" className="form-label">Domicilio</label>
              <input type="text" className="form-control" id="domicilio" value={formData.domicilio || ''} onChange={handleChange} />
            </div>
            <div className="col">
              <label htmlFor="telefono" className="form-label">Teléfono</label>
              <input type="tel" className="form-control" id="telefono" value={formData.telefono || ''} onChange={handleChange} />
            </div>
            <div className="col">
              <label htmlFor="dni" className="form-label">DNI</label>
              <input type="text" className="form-control" id="dni" value={formData.dni || ''} onChange={handleChange} />
            </div>
          </div>

          <div className="mb-3 form-check">
            <input type="checkbox" className="form-check-input" id="fallecio" checked={formData.fallecio || false} onChange={handleChange} />
            <label className="form-check-label" htmlFor="fallecio">¿Falleció?</label>
          </div>

          <div className="mb-3">
            <label htmlFor="detalle" className="form-label">Detalle de lo sucedido</label>
            <textarea className="form-control" id="detalle" rows="3" value={formData.detalle || ''} onChange={handleChange}></textarea>
          </div>

          <button type="submit" className="btn btn-danger w-100 mt-3">Finalizar carga</button>
          <button type="button" className="btn btn-secondary w-100 mt-2" onClick={guardarLocalmente}>Guardar y continuar después</button>
        </form>
      </div>
    </div>
  )
}

export default FactorClimatico
