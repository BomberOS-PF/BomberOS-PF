import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './IncendioEstructural.css'

const IncendioEstructural = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({})

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
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

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Datos enviados:', formData)
  }

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="form-abm p-4 shadow rounded w-100" style={{ maxWidth: '700px' }}>
        <h2 className="text-white text-center mb-4">Incendio Estructural</h2>
        <form onSubmit={handleSubmit}>

          <div className="mb-3">
            <label className="form-label">Nombre del comercio/casa de familia</label>
            <input type="text" className="form-control" id="nombreLugar" onChange={handleChange} />
          </div>

          <div className="row mb-3">
            <div className="col">
              <label className="form-label">Cantidad de pisos afectados</label>
              <input type="number" className="form-control" id="pisos" onChange={handleChange} />
            </div>
            <div className="col">
              <label className="form-label">Cantidad de ambientes afectados</label>
              <input type="number" className="form-control" id="ambientes" onChange={handleChange} />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Tipo de techo</label>
            <select className="form-select" id="tipoTecho" onChange={handleSelectChange}>
              <option disabled selected>Seleccione</option>
              <option>Chapa aislada</option>
              <option>Chapa metálica</option>
              <option>Madera/paja</option>
              <option>Teja</option>
              <option>Yeso</option>
              <option>Otro</option>
            </select>
            {formData.tipoTecho === 'Otro' && (
              <input type="text" className="form-control mt-2" id="otroTecho" placeholder="Especifique otro tipo de techo" onChange={handleChange} />
            )}
          </div>

          <div className="mb-3">
            <label className="form-label">Tipo de abertura</label>
            <select className="form-select" id="tipoAbertura" onChange={handleSelectChange}>
              <option disabled selected>Seleccione</option>
              <option>Acero/Hierro</option>
              <option>Aluminio</option>
              <option>Madera</option>
              <option>Plástico</option>
              <option>Otro</option>
            </select>
            {formData.tipoAbertura === 'Otro' && (
              <input type="text" className="form-control mt-2" id="otraAbertura" placeholder="Especifique otro tipo de abertura" onChange={handleChange} />
            )}
          </div>

          <div className="mb-3">
            <label className="form-label">Superficie afectada (m²)</label>
            <input type="number" className="form-control" id="superficie" onChange={handleChange} />
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
            <input type="checkbox" className="form-check-input" id="fallecio" onChange={(e) => setFormData(prev => ({ ...prev, fallecio: e.target.checked }))} />
            <label className="form-check-label" htmlFor="fallecio">¿Falleció?</label>
          </div>

          <button type="submit" className="btn btn-danger w-100 mt-3">Finalizar carga</button>
          <button type="button" className="btn btn-secondary w-100 mt-2" onClick={() => navigate('/')}>Volver al menú</button>
        </form>
      </div>
    </div>
  )
}

export default IncendioEstructural
