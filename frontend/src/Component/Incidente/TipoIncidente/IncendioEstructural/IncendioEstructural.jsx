import { useState, useEffect } from 'react'
import './IncendioEstructural.css'
import '../../../DisenioFormulario/DisenioFormulario.css'

const IncendioEstructural = ({ datosPrevios = {}, onFinalizar }) => {
  const incidenteId = datosPrevios.id || 'temp'
  const storageKey = `incendioEstructural-${incidenteId}`

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
    setFormData(prev => ({ ...prev, [id]: type === 'checkbox' ? checked : value }))
  }

  const handleSelectChange = (e) => {
    handleChange(e)
    if (e.target.id === 'tipoTecho' && e.target.value !== 'Otro') {
      setFormData(prev => ({ ...prev, otroTecho: '' }))
    }
    if (e.target.id === 'tipoAbertura' && e.target.value !== 'Otro') {
      setFormData(prev => ({ ...prev, otraAbertura: '' }))
    }
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
      <div className="formulario-consistente p-4 shadow rounded">
        <h2 className="text-black text-center mb-4">Incendio Estructural</h2>
        <form onSubmit={handleFinalizar}>
          <div className="mb-3">
            <label className="text-black text-black form-label">Nombre del comercio/casa de familia</label>
            <input type="text" className="form-control" id="nombreLugar" value={formData.nombreLugar || ''} onChange={handleChange} />
          </div>

          <div className="row mb-3">
            <div className="col">
              <label className="text-black text-black form-label">Cantidad de pisos afectados</label>
              <input type="number" className="form-control" id="pisos" value={formData.pisos || ''} onChange={handleChange} />
            </div>
            <div className="col">
              <label className="text-black text-black form-label">Cantidad de ambientes afectados</label>
              <input type="number" className="form-control" id="ambientes" value={formData.ambientes || ''} onChange={handleChange} />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col">
              <label className="text-black form-label">Tipo de techo</label>
              <select className="form-select" id="tipoTecho" value={formData.tipoTecho || ''} onChange={handleSelectChange}>
                <option disabled value="">Seleccione</option>
                <option>Chapa aislada</option>
                <option>Chapa metálica</option>
                <option>Madera/paja</option>
                <option>Teja</option>
                <option>Yeso</option>
                <option>Otro</option>
              </select>
              {formData.tipoTecho === 'Otro' && (
                <input type="text" className="form-control mt-2" id="otroTecho" value={formData.otroTecho || ''} placeholder="Especifique otro tipo de techo" onChange={handleChange} />
              )}
            </div>

            <div className="col">
              <label className="text-black form-label">Tipo de abertura</label>
              <select className="form-select" id="tipoAbertura" value={formData.tipoAbertura || ''} onChange={handleSelectChange}>
                <option disabled value="">Seleccione</option>
                <option>Acero/Hierro</option>
                <option>Aluminio</option>
                <option>Madera</option>
                <option>Plástico</option>
                <option>Otro</option>
              </select>
              {formData.tipoAbertura === 'Otro' && (
                <input type="text" className="form-control mt-2" id="otraAbertura" value={formData.otraAbertura || ''} placeholder="Especifique otro tipo de abertura" onChange={handleChange} />
              )}
            </div>

            <div className="col">
              <label className="text-black form-label">Superficie afectada (m²)</label>
              <input type="number" className="form-control" id="superficie" value={formData.superficie || ''} onChange={handleChange} />
            </div>
          </div>

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
              <label className="text-black form-label">DNI</label>
              <input type="text" className="form-control" id="dni" value={formData.dni || ''} onChange={handleChange} />
            </div>
          </div>

          <div className="mb-3 form-check">
            <input type="checkbox" className="form-check-input" id="fallecio" checked={formData.fallecio || false} onChange={handleChange} />
            <label className="text-black form-check-label" htmlFor="fallecio">¿Falleció?</label>
          </div>

          <button type="submit" className="btn btn-danger w-100 mt-3">Finalizar carga</button>
          <button type="button" className="btn btn-secondary w-100 mt-2" onClick={guardarLocalmente}>Guardar y continuar después</button>
        </form>
      </div>
    </div>
  )
}

export default IncendioEstructural
