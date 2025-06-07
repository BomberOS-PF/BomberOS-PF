import { useState, useEffect } from 'react'

const FormularioBombero = ({ modo = 'alta', datosIniciales = {}, onSubmit, onVolver }) => {
  const [formData, setFormData] = useState({
    dni: '',
    nombre: '',
    apellido: '',
    domicilio: '',
    email: '',
    telefono: '',
    legajo: '',
    antiguedad: '',
    rango: '',
    esPlan: false,
    fichaMedica: null,
    fechaFicha: '',
    aptoPsico: false,
    grupoSanguineo: ''
  })

  useEffect(() => {
    if (modo !== 'alta' && datosIniciales) {
      setFormData({
        ...formData,
        ...datosIniciales
      })
    }
  }, [datosIniciales])

  const handleChange = (e) => {
    const { id, value, type, checked, files } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const soloLectura = modo === 'consulta'

  return (
    <div className="container d-flex justify-content-center align-items-center">
      <div className="form-incidente p-4 shadow rounded">
        <h2 className="text-white text-center mb-4">
          {modo === 'alta' ? 'Alta de Bombero' : modo === 'edicion' ? 'Editar Bombero' : 'Consulta de Bombero'}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Nombre - Apellido - DNI */}
          <div className="row mb-3">
            <div className="col-md-4">
              <label className="form-label">Nombre</label>
              <input type="text" className="form-control" id="nombre" value={formData.nombre} required={!soloLectura}
                onChange={handleChange} disabled={soloLectura} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Apellido</label>
              <input type="text" className="form-control" id="apellido" value={formData.apellido} required={!soloLectura}
                onChange={handleChange} disabled={soloLectura} />
            </div>
            <div className="col-md-4">
              <label className="form-label">DNI</label>
              <input type="text" className="form-control" id="dni" value={formData.dni} required={!soloLectura}
                onChange={handleChange} disabled={soloLectura} />
            </div>
          </div>

          {/* Domicilio - Teléfono - Email */}
          <div className="row mb-3">
            <div className="col-md-4">
              <label className="form-label">Domicilio</label>
              <input type="text" className="form-control" id="domicilio" value={formData.domicilio}
                onChange={handleChange} disabled={soloLectura} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Teléfono</label>
              <input type="tel" className="form-control" id="telefono" value={formData.telefono}
                onChange={handleChange} disabled={soloLectura} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Correo electrónico</label>
              <input type="email" className="form-control" id="email" value={formData.email}
                onChange={handleChange} disabled={soloLectura} />
            </div>
          </div>

          {/* Legajo - Antigüedad - Rango */}
          <div className="row mb-3">
            <div className="col-md-4">
              <label className="form-label">Legajo</label>
              <input type="text" className="form-control" id="legajo" value={formData.legajo}
                onChange={handleChange} disabled={soloLectura} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Antigüedad</label>
              <input type="number" className="form-control" id="antiguedad" value={formData.antiguedad}
                onChange={handleChange} disabled={soloLectura} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Rango</label>
              <select className="form-select" id="rango" value={formData.rango} onChange={handleChange} disabled={soloLectura}>
                <option value="">Seleccione un rango</option>
                <option value="Bombero">Bombero</option>
                <option value="Cabo">Cabo</option>
                <option value="Sargento">Sargento</option>
                <option value="Subteniente">Subteniente</option>
                <option value="Teniente">Teniente</option>
                <option value="Oficial">Oficial</option>
              </select>
            </div>
          </div>

          <div className="form-check form-switch mb-3">
            <input className="form-check-input" type="checkbox" id="esPlan" checked={formData.esPlan}
              onChange={handleChange} disabled={soloLectura} />
            <label className="form-check-label" htmlFor="esPlan">Es del plan (guardias pagas)</label>
          </div>

          {/* Ficha médica - Fecha - Grupo Sanguíneo */}
          <div className="row mb-3">
            <div className="col-md-4">
              <label className="form-label">Ficha médica</label>
              <input type="file" className="form-control" id="fichaMedica" onChange={handleChange}
                accept="application/pdf" disabled={soloLectura} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Fecha de carga</label>
              <input type="date" className="form-control" id="fechaFicha" value={formData.fechaFicha}
                onChange={handleChange} disabled={soloLectura} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Grupo sanguíneo</label>
              <select className="form-select" id="grupoSanguineo" value={formData.grupoSanguineo}
                onChange={handleChange} disabled={soloLectura}>
                <option value="">Seleccione</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>

          <div className="form-check form-switch mb-3">
            <input className="form-check-input" type="checkbox" id="aptoPsico" checked={formData.aptoPsico}
              onChange={handleChange} disabled={soloLectura} />
            <label className="form-check-label" htmlFor="aptoPsico">Apto psicológico</label>
          </div>

          {!soloLectura && (
            <button type="submit" className="btn btn-danger w-100">
              {modo === 'alta' ? 'Registrar Bombero' : 'Guardar Cambios'}
            </button>
          )}

          {onVolver && (
            <button type="button" className="btn btn-secondary w-100 mt-2" onClick={onVolver}>
              Volver
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

export default FormularioBombero
