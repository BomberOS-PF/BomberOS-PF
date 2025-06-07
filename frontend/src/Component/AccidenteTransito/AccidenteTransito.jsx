import { useState, useEffect } from 'react'
import './AccidenteTransito.css'

const AccidenteTransito = ({ datosPrevios = {} }) => {
  const incidenteId = datosPrevios.id || 'temp'
  const storageKey = `accidente-${incidenteId}`

  const [formData, setFormData] = useState(() => {
    const guardado = localStorage.getItem(storageKey)
    return guardado ? JSON.parse(guardado) : {}
  })

  useEffect(() => {
    // Al cargar datosPrevios, mergearlos con lo guardado
    setFormData(prev => ({ ...prev, ...datosPrevios }))
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

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Datos enviados:', formData)

    // 🔴 Aquí podrías enviar al backend:
    /*
    fetch('/api/incidentes/accidente', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then(data => console.log('Guardado en backend:', data))
      .catch(err => console.error('Error al guardar:', err))
    */

    // También podrías limpiar el localStorage si ya fue enviado:
    // localStorage.removeItem(storageKey)
  }

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="form-abm p-4 shadow rounded w-100" style={{ maxWidth: '700px' }}>
        <h2 className="text-white text-center mb-4">Accidente de Tránsito</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="causaAccidente" className="form-label">Causa del accidente</label>
            <select className="form-select" id="causaAccidente" onChange={handleChange} value={formData.causaAccidente || ''}>
              <option disabled value="">Seleccione causa</option>
              <option>Desperfecto mecánico</option>
              <option>Imprudencia</option>
              <option>Clima</option>
              <option>Otro</option>
            </select>
          </div>

          <h5 className="text-white mt-4">Vehículos involucrados</h5>
          <div className="row mb-3">
            <div className="col-md-4">
              <label className="form-label">Tipo</label>
              <input type="text" className="form-control" id="tipoVehiculo" value={formData.tipoVehiculo || ''} onChange={handleChange} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Dominio</label>
              <input type="text" className="form-control" id="dominio" value={formData.dominio || ''} onChange={handleChange} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Cantidad</label>
              <input type="number" className="form-control" id="cantidadVehiculos" value={formData.cantidadVehiculos || ''} onChange={handleChange} />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col">
              <label className="form-label">Modelo</label>
              <input type="text" className="form-control" id="modelo" value={formData.modelo || ''} onChange={handleChange} />
            </div>
            <div className="col">
              <label className="form-label">Año</label>
              <input type="number" className="form-control" id="anio" value={formData.anio || ''} onChange={handleChange} />
            </div>
            <div className="col">
              <label className="form-label">Aseguradora</label>
              <input type="text" className="form-control" id="aseguradora" value={formData.aseguradora || ''} onChange={handleChange} />
            </div>
            <div className="col">
              <label className="form-label">Póliza</label>
              <input type="text" className="form-control" id="poliza" value={formData.poliza || ''} onChange={handleChange} />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Detalle de lo sucedido</label>
            <textarea className="form-control" rows="3" id="detalle" value={formData.detalle || ''} onChange={handleChange}></textarea>
          </div>

          <h5 className="text-white mt-4">Personas damnificadas</h5>
          <div className="row mb-3">
            <div className="col">
              <label className="form-label">Nombre</label>
              <input type="text" className="form-control" id="nombreDamnificado" value={formData.nombreDamnificado || ''} onChange={handleChange} />
            </div>
            <div className="col">
              <label className="form-label">Apellido</label>
              <input type="text" className="form-control" id="apellidoDamnificado" value={formData.apellidoDamnificado || ''} onChange={handleChange} />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Domicilio</label>
            <input type="text" className="form-control" id="domicilioDamnificado" value={formData.domicilioDamnificado || ''} onChange={handleChange} />
          </div>

          <div className="row mb-3">
            <div className="col">
              <label className="form-label">Teléfono</label>
              <input type="tel" className="form-control" id="telefonoDamnificado" value={formData.telefonoDamnificado || ''} onChange={handleChange} />
            </div>
            <div className="col">
              <label className="form-label">DNI</label>
              <input type="text" className="form-control" id="dniDamnificado" value={formData.dniDamnificado || ''} onChange={handleChange} />
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

export default AccidenteTransito
