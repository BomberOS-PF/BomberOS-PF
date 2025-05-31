import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './IncendioForestal.css'

const IncendioForestal = () => {
  const navigate = useNavigate()

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="form-abm p-4 shadow rounded w-100" style={{ maxWidth: '700px' }}>
        <h2 className="text-white text-center mb-4">Incendio Forestal</h2>
        <form>
          <div className="mb-3">
            <label className="form-label">Características del lugar</label>
            <select className="form-select">
              <option disabled selected>Seleccione</option>
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
              <select className="form-select">
                <option disabled selected>Seleccione</option>
                <option>Hectáreas</option>
                <option>Kilómetros</option>
              </select>
            </div>
            <div className="col">
              <label className="form-label">Cantidad</label>
              <input type="number" className="form-control" />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Causa probable</label>
            <select className="form-select">
              <option disabled selected>Seleccione</option>
              <option>Negligencia</option>
              <option>Natural</option>
              <option>Intencional</option>
              <option>Se desconoce</option>
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Detalle de lo sucedido</label>
            <textarea className="form-control" rows="3"></textarea>
          </div>

          <h5 className="text-white mt-4">Personas damnificadas</h5>
          <div className="row mb-3">
            <div className="col">
              <label className="form-label">Nombre</label>
              <input type="text" className="form-control" />
            </div>
            <div className="col">
              <label className="form-label">Apellido</label>
              <input type="text" className="form-control" />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Domicilio</label>
            <input type="text" className="form-control" />
          </div>

          <div className="row mb-3">
            <div className="col">
              <label className="form-label">Teléfono</label>
              <input type="tel" className="form-control" />
            </div>
            <div className="col">
              <label className="form-label">DNI</label>
              <input type="text" className="form-control" />
            </div>
          </div>

          <div className="mb-3 form-check">
            <input type="checkbox" className="form-check-input" id="fallecio" />
            <label className="form-check-label" htmlFor="fallecio">¿Falleció?</label>
          </div>

          <button type="submit" className="btn btn-danger w-100 mt-3">Finalizar carga</button>
          <button type="button" className="btn btn-secondary w-100 mt-2" onClick={() => navigate('/')}>Volver al menú</button>
        </form>
      </div>
    </div>
  )
}

export default IncendioForestal
