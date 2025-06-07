import { useState } from 'react'
import './RegistrarBombero.css'

const RegistrarBombero = ({ onVolver }) => {
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

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  const handleChange = (e) => {
    const { id, value, type, checked, files } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const dataToSend = {
        DNI: formData.dni,
        nombreCompleto: `${formData.nombre} ${formData.apellido}`.trim(),
        correo: formData.email,
        telefono: formData.telefono,
        domicilio: formData.domicilio,
        legajo: formData.legajo || null,
        antiguedad: formData.antiguedad ? parseInt(formData.antiguedad) : 0,
        idRango: 1,
        esDelPlan: formData.esPlan,
        aptoPsicologico: formData.aptoPsico,
        grupoSanguineo: formData.grupoSanguineo,
        fichaMedica: formData.fichaMedica ? formData.fichaMedica.name : null,
        fechaFichaMedica: formData.fechaFicha || null
      }

      const response = await fetch('http://localhost:3000/api/bomberos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })

      const result = await response.json()

      if (response.ok) {
        setMessage('¡Bombero registrado exitosamente!')
        setMessageType('success')
        setFormData({
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

        setTimeout(() => {
          if (onVolver) onVolver()
        }, 2000)
      } else {
        setMessage(result.error || 'Error al registrar bombero')
        setMessageType('error')
      }
    } catch (error) {
      console.error('Error al enviar datos:', error)
      setMessage('Error de conexión. Verifique que el servidor esté funcionando.')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container d-flex justify-content-center align-items-center">
      <div className="form-incidente p-4 shadow rounded">
        <h2 className="text-white text-center mb-4">Alta de Bombero</h2>

        {message && (
          <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-danger'} mt-3`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Nombre - Apellido - DNI */}
          <div className="row mb-3">
            <div className="col-md-4">
              <label htmlFor="nombre" className="form-label">Nombre</label>
              <input type="text" className="form-control" id="nombre" value={formData.nombre} required onChange={handleChange} />
            </div>
            <div className="col-md-4">
              <label htmlFor="apellido" className="form-label">Apellido</label>
              <input type="text" className="form-control" id="apellido" value={formData.apellido} required onChange={handleChange} />
            </div>
            <div className="col-md-4">
              <label htmlFor="dni" className="form-label">DNI</label>
              <input type="text" className="form-control" id="dni" value={formData.dni} required onChange={handleChange} />
            </div>
          </div>

          {/* Domicilio - Teléfono - Email */}
          <div className="row mb-3">
            <div className="col-md-4">
              <label htmlFor="domicilio" className="form-label">Domicilio</label>
              <input type="text" className="form-control" id="domicilio" value={formData.domicilio} required onChange={handleChange} />
            </div>
            <div className="col-md-4">
              <label htmlFor="telefono" className="form-label">Teléfono</label>
              <input type="tel" className="form-control" id="telefono" value={formData.telefono} required onChange={handleChange} />
            </div>
            <div className="col-md-4">
              <label htmlFor="email" className="form-label">Correo electrónico</label>
              <input type="email" className="form-control" id="email" value={formData.email} required onChange={handleChange} />
            </div>
          </div>

          {/* Legajo - Antigüedad */}
          <div className="row mb-3">
            <div className="col-md-4">
              <label htmlFor="legajo" className="form-label">Legajo (opcional)</label>
              <input type="text" className="form-control" id="legajo" value={formData.legajo} onChange={handleChange} />
            </div>
            <div className="col-md-4">
              <label htmlFor="antiguedad" className="form-label">Antigüedad (años)</label>
              <input type="number" className="form-control" id="antiguedad" value={formData.antiguedad} min="0" onChange={handleChange} />
            </div>
            <div className="col-md-4">
              <label htmlFor="rango" className="form-label">Rango</label>
              <select className="form-select" id="rango" value={formData.rango} required onChange={handleChange}>
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
            <input className="form-check-input" type="checkbox" id="esPlan" checked={formData.esPlan} onChange={handleChange} />
            <label className="form-check-label" htmlFor="esPlan">Es del plan (guardias pagas)</label>
          </div>

          <div className="row mb-3">
            <div className="col-md-4">
              <label htmlFor="fichaMedica" className="form-label">Ficha médica (PDF)</label>
              <input
                className="form-control"
                type="file"
                id="fichaMedica"
                accept="application/pdf"
                onChange={handleChange}
              />
            </div>

            <div className="col-md-4">
              <label htmlFor="fechaFicha" className="form-label">Fecha de carga</label>
              <input
                className="form-control"
                type="date"
                id="fechaFicha"
                value={formData.fechaFicha}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-4">
              <label htmlFor="grupoSanguineo" className="form-label">Grupo sanguíneo</label>
              <select
                className="form-select"
                id="grupoSanguineo"
                value={formData.grupoSanguineo}
                required
                onChange={handleChange}
              >
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
            <input className="form-check-input" type="checkbox" id="aptoPsico" checked={formData.aptoPsico} onChange={handleChange} />
            <label className="form-check-label" htmlFor="aptoPsico">Apto psicológico</label>
          </div>

          <button type="submit" className="btn btn-danger w-100" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar bombero'}
          </button>

          {onVolver && (
            <button type="button" className="btn btn-secondary w-100 mt-2" onClick={onVolver} disabled={loading}>
              Volver
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

export default RegistrarBombero
