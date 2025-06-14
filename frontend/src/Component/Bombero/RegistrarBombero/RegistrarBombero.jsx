import { useState } from 'react'
import { API_URLS } from '../../../config/api'
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
      // Validaciones adicionales
      if (!formData.dni || !formData.nombre || !formData.apellido || !formData.email || !formData.telefono || !formData.domicilio || !formData.rango || !formData.grupoSanguineo) {
        setMessage('Por favor, complete todos los campos obligatorios')
        setMessageType('error')
        setLoading(false)
        return
      }

      const dataToSend = {
        DNI: formData.dni,
        nombreCompleto: `${formData.nombre} ${formData.apellido}`.trim(),
        correo: formData.email,
        telefono: formData.telefono,
        domicilio: formData.domicilio,
        legajo: formData.legajo || null,
        antiguedad: formData.antiguedad ? parseInt(formData.antiguedad) : 0,
        idRango: getRangoId(formData.rango),
        esDelPlan: formData.esPlan,
        aptoPsicologico: formData.aptoPsico,
        grupoSanguineo: formData.grupoSanguineo,
        fichaMedica: formData.fichaMedica ? 1 : null, // Campo booleano/entero
        fichaMedicaArchivo: formData.fichaMedica ? formData.fichaMedica.name : null, // Nombre del archivo
        fechaFichaMedica: formData.fechaFicha || null
      }

      console.log('🚀 Enviando datos al backend:', dataToSend)
              console.log('📡 URL de la API:', API_URLS.bomberos.create)
        
        const response = await fetch(API_URLS.bomberos.create, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })

      console.log('📥 Respuesta del servidor:', response.status, response.statusText)

      const result = await response.json()
      console.log('📋 Datos de respuesta:', result)

      if (response.ok && result.success) {
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
        const errorMessage = result.message || result.error || 'Error al registrar bombero'
        console.error('❌ Error del servidor:', errorMessage)
        setMessage(errorMessage)
        setMessageType('error')
      }
    } catch (error) {
      console.error('💥 Error al enviar datos:', error)
      console.error('🔍 Detalles del error:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
      setMessage(`Error de conexión: ${error.message}. Verifique que el servidor esté funcionando en http://localhost:3000`)
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const getRangoId = (rangoNombre) => {
    const rangos = {
      'Bombero': 1,
      'Cabo': 2,
      'Sargento': 3,
      'Sargento Primero': 4,
      'Suboficial': 5,
      'Suboficial Principal': 6,
      'Suboficial Mayor': 7,
      'Oficial': 8,
      'Teniente': 9,
      'Capitán': 10,
      'Mayor': 11,
      'Teniente Coronel': 12,
      'Coronel': 13,
      'Jefe': 14
    }
    return rangos[rangoNombre] || 1
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
              <input 
                type="text" 
                className="form-control" 
                id="nombre" 
                value={formData.nombre} 
                required 
                disabled={loading}
                onChange={handleChange} 
              />
            </div>
            <div className="col-md-4">
              <label htmlFor="apellido" className="form-label">Apellido</label>
              <input 
                type="text" 
                className="form-control" 
                id="apellido" 
                value={formData.apellido} 
                required 
                disabled={loading}
                onChange={handleChange} 
              />
            </div>
            <div className="col-md-4">
              <label htmlFor="dni" className="form-label">DNI</label>
              <input 
                type="text" 
                className="form-control" 
                id="dni" 
                value={formData.dni} 
                required 
                disabled={loading}
                pattern="[0-9]{7,8}"
                title="Ingrese un DNI válido (7-8 dígitos)"
                onChange={handleChange} 
              />
            </div>
          </div>

          {/* Domicilio - Teléfono - Email */}
          <div className="row mb-3">
            <div className="col-md-4">
              <label htmlFor="domicilio" className="form-label">Domicilio</label>
              <input 
                type="text" 
                className="form-control" 
                id="domicilio" 
                value={formData.domicilio} 
                required 
                disabled={loading}
                onChange={handleChange} 
              />
            </div>
            <div className="col-md-4">
              <label htmlFor="telefono" className="form-label">Teléfono</label>
              <input 
                type="tel" 
                className="form-control" 
                id="telefono" 
                value={formData.telefono} 
                required 
                disabled={loading}
                pattern="[0-9+\-\s\(\)]{8,15}"
                title="Ingrese un teléfono válido (8-15 dígitos)"
                onChange={handleChange} 
              />
            </div>
            <div className="col-md-4">
              <label htmlFor="email" className="form-label">Correo electrónico</label>
              <input 
                type="email" 
                className="form-control" 
                id="email" 
                value={formData.email} 
                required 
                disabled={loading}
                onChange={handleChange} 
              />
            </div>
          </div>

          {/* Legajo - Antigüedad - Rango */}
          <div className="row mb-3">
            <div className="col-md-4">
              <label htmlFor="legajo" className="form-label">Legajo (opcional)</label>
              <input 
                type="text" 
                className="form-control" 
                id="legajo" 
                value={formData.legajo} 
                disabled={loading}
                onChange={handleChange} 
              />
            </div>
            <div className="col-md-4">
              <label htmlFor="antiguedad" className="form-label">Antigüedad (años)</label>
              <input 
                type="number" 
                className="form-control" 
                id="antiguedad" 
                value={formData.antiguedad} 
                min="0" 
                max="50"
                disabled={loading}
                onChange={handleChange} 
              />
            </div>
            <div className="col-md-4">
              <label htmlFor="rango" className="form-label">Rango</label>
              <select 
                className="form-select" 
                id="rango" 
                value={formData.rango} 
                required 
                disabled={loading}
                onChange={handleChange}
              >
                <option value="">Seleccione un rango</option>
                <option value="Bombero">Bombero</option>
                <option value="Cabo">Cabo</option>
                <option value="Sargento">Sargento</option>
                <option value="Sargento Primero">Sargento Primero</option>
                <option value="Suboficial">Suboficial</option>
                <option value="Suboficial Principal">Suboficial Principal</option>
                <option value="Suboficial Mayor">Suboficial Mayor</option>
                <option value="Oficial">Oficial</option>
                <option value="Teniente">Teniente</option>
                <option value="Capitán">Capitán</option>
                <option value="Mayor">Mayor</option>
                <option value="Teniente Coronel">Teniente Coronel</option>
                <option value="Coronel">Coronel</option>
                <option value="Jefe">Jefe</option>
              </select>
            </div>
          </div>

          {/* Es del Plan */}
          <div className="form-check form-switch mb-3">
            <input 
              className="form-check-input" 
              type="checkbox" 
              id="esPlan" 
              checked={formData.esPlan} 
              disabled={loading}
              onChange={handleChange} 
            />
            <label className="form-check-label" htmlFor="esPlan">
              Es del plan (guardias pagas)
            </label>
          </div>

          {/* Ficha Médica - Fecha - Grupo Sanguíneo */}
          <div className="row mb-3">
            <div className="col-md-4">
              <label htmlFor="fichaMedica" className="form-label">Ficha médica (PDF)</label>
              <input
                className="form-control"
                type="file"
                id="fichaMedica"
                accept="application/pdf"
                disabled={loading}
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
                disabled={loading}
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
                disabled={loading}
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

          {/* Apto Psicológico */}
          <div className="form-check form-switch mb-3">
            <input 
              className="form-check-input" 
              type="checkbox" 
              id="aptoPsico" 
              checked={formData.aptoPsico} 
              disabled={loading}
              onChange={handleChange} 
            />
            <label className="form-check-label" htmlFor="aptoPsico">
              Apto psicológico
            </label>
          </div>

          <button type="submit" className="btn btn-danger w-100" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar bombero'}
          </button>

          {onVolver && (
            <button 
              type="button" 
              className="btn btn-secondary w-100 mt-2" 
              onClick={onVolver} 
              disabled={loading}
            >
              Volver
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

export default RegistrarBombero
