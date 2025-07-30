import { useState, useEffect, useRef } from 'react'
import './Rescate.css'
import '../../../DisenioFormulario/DisenioFormulario.css'

const Rescate = ({ datosPrevios = {}, onFinalizar }) => {
  const incidenteId = datosPrevios.idIncidente || datosPrevios.id || 'temp'
  const storageKey = `rescate-${incidenteId}`

  const [formData, setFormData] = useState(() => {
    const guardado = localStorage.getItem(storageKey)
    return guardado ? JSON.parse(guardado) : { ...datosPrevios }
  })

  const [mostrarOtroLugar, setMostrarOtroLugar] = useState(formData.lugar === 'Otro')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const toastRef = useRef(null)

  // Mostrar información del incidente básico si existe
  const incidenteBasico = datosPrevios.idIncidente || datosPrevios.id ? {
    id: datosPrevios.idIncidente || datosPrevios.id,
    tipo: datosPrevios.tipoSiniestro,
    fecha: datosPrevios.fechaHora || datosPrevios.fecha,
    localizacion: datosPrevios.localizacion,
    lugar: datosPrevios.lugar
  } : null

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
    setLoading(true)
    setSuccessMsg('')
    setErrorMsg('')
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(formData))
      
      const esActualizacion = datosPrevios.idIncidente || datosPrevios.id
      setSuccessMsg(esActualizacion ? 
        'Rescate actualizado con éxito' : 
        'Rescate registrado exitosamente'
      )
      setErrorMsg('')
      localStorage.removeItem(storageKey)
      if (onFinalizar) onFinalizar()
    } catch (error) {
      setErrorMsg('Error al procesar los datos: ' + error.message)
      setSuccessMsg('')
    } finally {
      setLoading(false)
      if (toastRef.current) toastRef.current.focus()
    }
  }

  return (
    <div className="container d-flex justify-content-center align-items-center">
      <div className="formulario-consistente p-4 shadow rounded">
        <h2 className="text-black text-center mb-4">Rescate</h2>
        
        {/* Información del incidente básico */}
        {incidenteBasico && (
          <div className="alert alert-info mb-4">
            <h6 className="alert-heading">📋 Incidente Base Registrado</h6>
            <div className="row">
              <div className="col-md-6">
                <strong>ID:</strong> {incidenteBasico.id}<br/>
                <strong>Tipo:</strong> {incidenteBasico.tipo}<br/>
                <strong>Fecha:</strong> {incidenteBasico.fecha}
              </div>
              <div className="col-md-6">
                <strong>Localización:</strong> {incidenteBasico.localizacion}<br/>
                <strong>Lugar:</strong> {incidenteBasico.lugar}
              </div>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="text-black form-label">Lugar</label>
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
              <label className="text-black form-label">Describa el otro tipo de lugar</label>
              <input type="text" className="form-control" id="otroLugar" value={formData.otroLugar || ''} onChange={handleChange} />
            </div>
          )}

          <div className="mb-3">
            <label className="text-black form-label">Detalle de lo sucedido</label>
            <textarea className="form-control" rows="3" id="detalle" value={formData.detalle || ''} onChange={handleChange}></textarea>
          </div>

          <h5 className="text-white mt-4">Personas damnificadas</h5>
          <div className="row mb-3">
            <div className="col">
              <label className="text-black form-label">Nombre</label>
              <input type="text" className="form-control" id="nombre" value={formData.nombre || ''} onChange={handleChange} />
            </div>
            <div className="col">
              <label className="text-black form-label">Apellido</label>
              <input type="text" className="form-control" id="apellido" value={formData.apellido || ''} onChange={handleChange} />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col">
              <label className="text-black form-label">Domicilio</label>
              <input type="text" className="form-control" id="domicilio" value={formData.domicilio || ''} onChange={handleChange} />
            </div>
            <div className="col">
              <label className="text-black form-label">Teléfono</label>
              <input type="tel" className="form-control" id="telefono" value={formData.telefono || ''} onChange={handleChange} />
            </div>
            <div className="col">
              <label className="text-black form-label">dni</label>
              <input type="text" className="form-control" id="dni" value={formData.dni || ''} onChange={handleChange} />
            </div>
          </div>

          <div className="mb-3 form-check">
            <input type="checkbox" className="form-check-input" id="fallecio" checked={formData.fallecio || false} onChange={handleChange} />
            <label className="text-black form-check-label" htmlFor="fallecio">¿Falleció?</label>
          </div>

          <button type="submit" className="btn btn-danger w-100 mt-3" disabled={loading}>
            {loading ? 'Cargando...' : (datosPrevios.idIncidente || datosPrevios.id ? 'Actualizar rescate' : 'Finalizar carga')}
          </button>
          <button type="button" className="btn btn-secondary w-100 mt-2" onClick={guardarLocalmente} disabled={loading}>
            Guardar y continuar después
          </button>
        </form>
        
        {errorMsg && (
          <div ref={toastRef} tabIndex={-1} className="alert alert-danger mt-3" role="alert">{errorMsg}</div>
        )}
        {successMsg && (
          <div ref={toastRef} tabIndex={-1} className="alert alert-success mt-3" role="alert">{successMsg}</div>
        )}
      </div>
    </div>
  )
}

export default Rescate
