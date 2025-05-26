import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import './MaterialPeligroso.css'

const MaterialPeligroso = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({})

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log(formData)
  }

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="form-abm p-4 shadow rounded w-100" style={{ maxWidth: '800px' }}>
        <h2 className="text-white text-center mb-4">Material Peligroso</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Categoría</label>
            <select className="form-select" id="categoria" onChange={handleChange}>
              <option disabled selected>Seleccione</option>
              <option>Escape</option>
              <option>Fuga</option>
              <option>Derrame</option>
              <option>Explosión</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Cantidad de materiales involucrados</label>
            <input type="number" className="form-control" id="cantidadMateriales" onChange={handleChange} />
          </div>

          <fieldset className="mb-3">
            <legend className="text-white fs-6">Tipos de materiales involucrados</legend>
            {["Gas inflamable", "Sustancia corrosiva", "Explosivo", "Radiación"].map((item, index) => (
              <div className="form-check" key={index}>
                <input className="form-check-input" type="checkbox" id={`material${index}`} onChange={handleChange} />
                <label className="form-check-label" htmlFor={`material${index}`}>{item}</label>
              </div>
            ))}
          </fieldset>

          <fieldset className="mb-3">
            <legend className="text-white fs-6">Acciones sobre el material</legend>
            {["Quema controlada", "Venteo", "Dilución de vapores", "Neutralización", "Trasvase"].map((accion, index) => (
              <div className="form-check" key={index}>
                <input className="form-check-input" type="checkbox" id={`accion${index}`} onChange={handleChange} />
                <label className="form-check-label" htmlFor={`accion${index}`}>{accion}</label>
              </div>
            ))}
            <div className="form-check mt-2">
              <label className="form-label">Otra acción</label>
              <input type="text" className="form-control" id="otraAccionMaterial" onChange={handleChange} />
            </div>
          </fieldset>

          <fieldset className="mb-3">
            <legend className="text-white fs-6">Acciones sobre las personas</legend>
            {["Evacuación", "Descontaminación", "Confinamiento"].map((accion, index) => (
              <div className="form-check" key={index}>
                <input className="form-check-input" type="checkbox" id={`personaAccion${index}`} onChange={handleChange} />
                <label className="form-check-label" htmlFor={`personaAccion${index}`}>{accion}</label>
              </div>
            ))}
            <div className="form-check mt-2">
              <label className="form-label">Otra acción</label>
              <input type="text" className="form-control" id="otraAccionPersona" onChange={handleChange} />
            </div>
          </fieldset>

          <div className="mb-3">
            <label className="form-label">Detalle sobre otras acciones sobre personas</label>
            <textarea className="form-control" rows="2" id="detalleAccionesPersona" onChange={handleChange}></textarea>
          </div>

          <div className="mb-3">
            <label className="form-label">Cantidad de superficie evacuada</label>
            <input type="text" className="form-control" id="superficieEvacuada" onChange={handleChange} />
          </div>

          <div className="mb-3">
            <label className="form-label">Detalle de lo sucedido</label>
            <textarea className="form-control" rows="3" id="detalle" onChange={handleChange}></textarea>
          </div>

          <h5 className="text-white mt-4">Personas damnificadas</h5>
          <div className="row mb-3">
            <div className="col">
              <label className="form-label">Nombre</label>
              <input type="text" className="form-control" id="nombre" onChange={handleChange} />
            </div>
            <div className="col">
              <label className="form-label">Apellido</label>
              <input type="text" className="form-control" id="apellido" onChange={handleChange} />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Domicilio</label>
            <input type="text" className="form-control" id="domicilio" onChange={handleChange} />
          </div>

          <div className="row mb-3">
            <div className="col">
              <label className="form-label">Teléfono</label>
              <input type="tel" className="form-control" id="telefono" onChange={handleChange} />
            </div>
            <div className="col">
              <label className="form-label">DNI</label>
              <input type="text" className="form-control" id="dni" onChange={handleChange} />
            </div>
          </div>

          <div className="mb-3 form-check">
            <input type="checkbox" className="form-check-input" id="fallecio" onChange={handleChange} />
            <label className="form-check-label" htmlFor="fallecio">¿Falleció?</label>
          </div>

          <button type="submit" className="btn btn-danger w-100 mt-3">Finalizar carga</button>
          <button type="button" className="btn btn-secondary w-100 mt-2" onClick={() => navigate('/')}>Volver al menú</button>
        </form>
      </div>
    </div>
  )
}

export default MaterialPeligroso
