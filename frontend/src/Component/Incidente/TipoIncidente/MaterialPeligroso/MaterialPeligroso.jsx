import { useState } from 'react'
import './MaterialPeligroso.css'
import '../../../DisenioFormulario/DisenioFormulario.css'

const MaterialPeligroso = ({ datosPrevios = {}, onFinalizar }) => {
  const incidenteId = datosPrevios.id || 'temp'
  const storageKey = `materialPeligroso-${incidenteId}`

  const [formData, setFormData] = useState(() => {
    const guardado = localStorage.getItem(storageKey)
    return guardado ? JSON.parse(guardado) : { ...datosPrevios }
  })

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
    localStorage.setItem(storageKey, JSON.stringify(formData))
    console.log('Datos enviados:', formData)
    if (onFinalizar) onFinalizar()
  }

  return (
    <div className="container d-flex justify-content-center align-items-center">
      <div className="formulario-consistente p-4 shadow rounded">
        <h2 className="text-black text-center mb-4">Material Peligroso</h2>
        <form onSubmit={handleSubmit}>
          <div className="row mb-3">
            <div className="col">
              <label className="text-black form-label">Categoría</label>
              <select className="form-select" id="categoria" onChange={handleChange} value={formData.categoria || ''}>
                <option disabled value="">Seleccione</option>
                <option>Escape</option>
                <option>Fuga</option>
                <option>Derrame</option>
                <option>Explosión</option>
              </select>
            </div>
            <div className="col">
              <label className="text-black form-label">Cantidad de materiales involucrados</label>
              <input type="number" className="form-control" id="cantidadMateriales" value={formData.cantidadMateriales || ''} onChange={handleChange} />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col">
              <fieldset>
                <legend className="text-black fs-6">Tipos de materiales involucrados</legend>
                {["Gas inflamable", "Sustancia corrosiva", "Explosivo", "Radiación"].map((item, index) => (
                  <div className="form-check" key={index}>
                    <input className="form-check-input" type="checkbox" id={`material${index}`} checked={formData[`material${index}`] || false} onChange={handleChange} />
                    <label className="text-black form-check-label" htmlFor={`material${index}`}>{item}</label>
                  </div>
                ))}
              </fieldset>
            </div>

            <div className="col">
              <fieldset>
                <legend className="text-black fs-6">Acciones sobre el material</legend>
                {["Quema controlada", "Venteo", "Dilución de vapores", "Neutralización", "Trasvase"].map((accion, index) => (
                  <div className="form-check" key={index}>
                    <input className="form-check-input" type="checkbox" id={`accion${index}`} checked={formData[`accion${index}`] || false} onChange={handleChange} />
                    <label className="text-black form-check-label" htmlFor={`accion${index}`}>{accion}</label>
                  </div>
                ))}
                <div className="form-check mt-2">
                  <label className="text-black form-label">Otra acción</label>
                  <input type="text" className="form-control" id="otraAccionMaterial" value={formData.otraAccionMaterial || ''} onChange={handleChange} />
                </div>
              </fieldset>
            </div>
          </div>

          <fieldset className="mb-3">
            <legend className="text-black fs-6">Acciones sobre las personas</legend>
            {["Evacuación", "Descontaminación", "Confinamiento"].map((accion, index) => (
              <div className="form-check" key={index}>
                <input className="form-check-input" type="checkbox" id={`personaAccion${index}`} checked={formData[`personaAccion${index}`] || false} onChange={handleChange} />
                <label className="text-black form-check-label" htmlFor={`personaAccion${index}`}>{accion}</label>
              </div>
            ))}
            <div className="form-check mt-2">
              <label className="text-black form-label">Otra acción</label>
              <input type="text" className="form-control" id="otraAccionPersona" value={formData.otraAccionPersona || ''} onChange={handleChange} />
            </div>
          </fieldset>

          <div className="mb-3">
            <label className="text-black form-label">Detalle sobre otras acciones sobre personas</label>
            <textarea className="form-control" rows="2" id="detalleAccionesPersona" value={formData.detalleAccionesPersona || ''} onChange={handleChange}></textarea>
          </div>

          <div className="mb-3">
            <label className="text-black form-label">Cantidad de superficie evacuada</label>
            <input type="text" className="form-control" id="superficieEvacuada" value={formData.superficieEvacuada || ''} onChange={handleChange} />
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
              <label className="text-black form-label">dni</label>
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

export default MaterialPeligroso
