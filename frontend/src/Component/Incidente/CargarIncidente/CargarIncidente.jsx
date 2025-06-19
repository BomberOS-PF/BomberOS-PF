import { useState } from 'react'
import './CargarIncidente.css'

const CargarIncidente = ({ onVolver, onNotificar }) => {
  const now = new Date()
  const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)

  const usuario = JSON.parse(localStorage.getItem('usuario'))
  console.log('🧾 Usuario cargado desde localStorage:', usuario)
  const nombreCompleto = `${usuario?.nombre || ''} ${usuario?.apellido || ''}`.trim()

  const [formData, setFormData] = useState({
    fechaHora: localDateTime
  })

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const tipoMap = {
        'Accidente': 1,
        'Factores Climáticos': 2,
        'Incendio Estructural': 3,
        'Incendio Forestal': 4,
        'Material Peligroso': 5,
        'Rescate': 6
      }

      const localizacionMap = {
        'Despeñaderos': 1,
        'Zona Rural': 2,
        'Zona Urbana': 3,
        'Zona Industrial': 4,
        'Zona Costera': 5,
        'Otros': 6
      }

      const payload = {
        dni: usuario?.dni,
        idTipoIncidente: tipoMap[formData.tipoSiniestro],
        fecha: formData.fechaHora,
        idLocalizacion: localizacionMap[formData.localizacion] || 99,
        descripcion: formData.lugar
      }

      const hayDenunciante =
        formData.nombreDenunciante || formData.apellidoDenunciante ||
        formData.telefonoDenunciante || formData.dniDenunciante

      if (hayDenunciante) {
        payload.denunciante = {
          nombre: formData.nombreDenunciante || null,
          apellido: formData.apellidoDenunciante || null,
          telefono: formData.telefonoDenunciante || null,
          dni: formData.dniDenunciante || null
        }
      }

      const response = await fetch('http://localhost:3000/api/incidentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar el incidente')
      }

      alert('✅ Incidente guardado correctamente')

      if (onNotificar) {
        onNotificar(formData.tipoSiniestro, data)
      }

      if (onVolver) {
        onVolver()
      }

    } catch (error) {
      console.error('❌ Error al guardar incidente:', error)
      alert(`Error: ${error.message}`)
    }
  }

  return (
    <div className="container d-flex justify-content-center align-items-center">
      <div className="form-incidente p-4 shadow rounded">
        <h2 className="text-white text-center mb-4">Cargar Incidente</h2>
        <form onSubmit={handleSubmit}>
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Persona que carga</label>
              <input
                type="text"
                className="form-control"
                value={nombreCompleto || 'Desconocido'}
                disabled
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="tipoSiniestro" className="form-label">Tipo de Siniestro</label>
              <select className="form-select" id="tipoSiniestro" required onChange={handleChange} defaultValue="">
                <option disabled value="">Seleccione tipo</option>
                <option>Accidente</option>
                <option>Factores Climáticos</option>
                <option>Incendio Estructural</option>
                <option>Incendio Forestal</option>
                <option>Material Peligroso</option>
                <option>Rescate</option>
              </select>
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-4">
              <label htmlFor="fechaHora" className="form-label">Fecha y Hora</label>
              <input
                type="datetime-local"
                className="form-control estrecho"
                id="fechaHora"
                value={formData.fechaHora}
                required
                onChange={handleChange}
              />
            </div>
          </div>

          <h5 className="text-white mb-3">Datos del denunciante (opcional)</h5>
          <div className="row mb-3">
            <div className="col">
              <label htmlFor="nombreDenunciante" className="form-label">Nombre</label>
              <input type="text" className="form-control" id="nombreDenunciante" onChange={handleChange} />
            </div>
            <div className="col">
              <label htmlFor="apellidoDenunciante" className="form-label">Apellido</label>
              <input type="text" className="form-control" id="apellidoDenunciante" onChange={handleChange} />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col">
              <label htmlFor="telefonoDenunciante" className="form-label">Teléfono</label>
              <input type="tel" className="form-control" id="telefonoDenunciante" onChange={handleChange} />
            </div>
            <div className="col">
              <label htmlFor="dniDenunciante" className="form-label">DNI</label>
              <input type="text" className="form-control" id="dniDenunciante" onChange={handleChange} />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <label htmlFor="localizacion" className="form-label">Localización</label>
              <select className="form-select" id="localizacion" required onChange={handleChange} defaultValue="">
                <option disabled value="">Seleccione localización</option>
                <option>Despeñaderos</option>
                <option>Zona Rural</option>
                <option>Zona Urbana</option>
                <option>Zona Industrial</option>
                <option>Zona Costera</option>
                <option>Otros</option>
              </select>
            </div>

            <div className="col-md-6">
              <label htmlFor="lugar" className="form-label">Calle y/o Kilometraje o Lugar</label>
              <input
                type="text"
                className="form-control"
                id="lugar"
                placeholder="Ej: Av. Siempre Viva 742, km 12"
                required
                onChange={handleChange}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-danger w-100">Notificar</button>
          <button type="button" className="btn btn-secondary w-100 mt-2" onClick={onVolver}>Volver</button>
        </form>
      </div>
    </div>
  )
}

export default CargarIncidente
