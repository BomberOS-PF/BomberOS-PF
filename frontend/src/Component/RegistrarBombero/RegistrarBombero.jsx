import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../DisenioFormulario/DisenioFormulario.css'
import './RegistrarBombero.css'

const RegistrarBombero = () => {
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
  const [messageType, setMessageType] = useState('') // 'success' or 'error'
  
  const navigate = useNavigate()

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
      // Preparar datos para enviar a la API con todos los campos requeridos
      const dataToSend = {
        DNI: formData.dni, // Campo requerido por el backend
        nombreCompleto: `${formData.nombre} ${formData.apellido}`.trim(),
        correo: formData.email,
        telefono: formData.telefono,
        domicilio: formData.domicilio,
        legajo: formData.legajo || null,
        antiguedad: formData.antiguedad ? parseInt(formData.antiguedad) : 0,
        idRango: 1, // Por ahora usamos idRango = 1 (Bombero básico)
        esDelPlan: formData.esPlan,
        aptoPsicologico: formData.aptoPsico,
        grupoSanguineo: formData.grupoSanguineo,
        // Campos de ficha médica (por ahora como texto)
        fichaMedica: formData.fichaMedica ? formData.fichaMedica.name : null,
        fechaFichaMedica: formData.fechaFicha || null
      }

      console.log('Enviando datos:', dataToSend)

      const response = await fetch('http://localhost:3000/api/bomberos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      })

      const result = await response.json()

      if (response.ok) {
        setMessage('¡Bombero registrado exitosamente!')
        setMessageType('success')
        console.log('Bombero creado:', result)
        
        // Limpiar formulario
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
        
        // Opcional: redirigir después de 2 segundos
        setTimeout(() => {
          navigate('/')
        }, 2000)
        
      } else {
        setMessage(result.error || 'Error al registrar bombero')
        setMessageType('error')
        console.error('Error del servidor:', result)
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
    <div className="registrar-bombero-wrapper d-flex justify-content-center align-items-start min-vh-100 py-5">
      <div className="form-abm w-100 shadow rounded p-4">
        <div className="form-header">
          <img src="/img/logo-formularios.png" alt="Logo" />
          <h2>Alta de Bombero</h2>
        </div>

        {/* Mostrar mensajes de éxito o error */}
        {message && (
          <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-danger'} mt-3`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="dni" className="form-label text-black">DNI</label>
            <input 
              type="text" 
              className="form-control" 
              id="dni" 
              value={formData.dni}
              required 
              placeholder="Ej: 12345678"
              onChange={handleChange} 
            />
          </div>

          <div className="row mb-3">
            <div className="col">
              <label htmlFor="nombre" className="form-label text-black">Nombre</label>
              <input 
                type="text" 
                className="form-control" 
                id="nombre" 
                value={formData.nombre}
                required 
                onChange={handleChange} 
              />
            </div>
            <div className="col">
              <label htmlFor="apellido" className="form-label text-black">Apellido</label>
              <input 
                type="text" 
                className="form-control" 
                id="apellido" 
                value={formData.apellido}
                required 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="domicilio" className="form-label text-black">Domicilio</label>
            <input 
              type="text" 
              className="form-control" 
              id="domicilio" 
              value={formData.domicilio}
              required 
              onChange={handleChange} 
            />
          </div>

          <div className="mb-3">
            <label htmlFor="email" className="form-label text-black">Correo electrónico</label>
            <input 
              type="email" 
              className="form-control" 
              id="email" 
              value={formData.email}
              required 
              onChange={handleChange} 
            />
          </div>

          <div className="mb-3">
            <label htmlFor="telefono" className="form-label text-black">Número de teléfono</label>
            <input 
              type="tel" 
              className="form-control" 
              id="telefono" 
              value={formData.telefono}
              required 
              onChange={handleChange} 
            />
          </div>

          <div className="mb-3">
            <label htmlFor="legajo" className="form-label text-black">Legajo (opcional)</label>
            <input 
              type="text" 
              className="form-control" 
              id="legajo" 
              value={formData.legajo}
              onChange={handleChange} 
            />
          </div>

          <div className="mb-3">
            <label htmlFor="antiguedad" className="form-label text-black">Antigüedad (años)</label>
            <input 
              type="number" 
              className="form-control" 
              id="antiguedad" 
              value={formData.antiguedad}
              min="0" 
              onChange={handleChange} 
            />
          </div>

          <div className="mb-3">
            <label htmlFor="rango" className="form-label text-black">Rango</label>
            <select 
              className="form-select" 
              id="rango" 
              value={formData.rango}
              required 
              onChange={handleChange}
            >
              <option value="">Seleccione un rango</option>
              <option value="Bombero">Bombero</option>
              <option value="Cabo">Cabo</option>
              <option value="Sargento">Sargento</option>
              <option value="Subteniente">Subteniente</option>
              <option value="Teniente">Teniente</option>
              <option value="Oficial">Oficial</option>
            </select>
          </div>

          <div className="form-check form-switch mb-3">
            <input 
              className="form-check-input" 
              type="checkbox" 
              id="esPlan" 
              checked={formData.esPlan}
              onChange={handleChange} 
            />
            <label className="form-check-label" htmlFor="esPlan">Es del plan (guardias pagas)</label>
          </div>

          <div className="mb-3">
            <label htmlFor="fichaMedica" className="form-label text-black">Ficha médica (PDF)</label>
            <input 
              className="form-control" 
              type="file" 
              id="fichaMedica" 
              accept="application/pdf" 
              onChange={handleChange} 
            />
          </div>

          <div className="mb-3">
            <label htmlFor="fechaFicha" className="form-label text-black">Fecha de carga de ficha médica</label>
            <input 
              className="form-control" 
              type="date" 
              id="fechaFicha" 
              value={formData.fechaFicha}
              onChange={handleChange} 
            />
          </div>

          <div className="form-check form-switch mb-3">
            <input 
              className="form-check-input" 
              type="checkbox" 
              id="aptoPsico" 
              checked={formData.aptoPsico}
              onChange={handleChange} 
            />
            <label className="form-check-label" htmlFor="aptoPsico">Apto psicológico</label>
          </div>

          <div className="mb-4">
            <label htmlFor="grupoSanguineo" className="form-label text-black">Grupo sanguíneo</label>
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

          <button 
            type="submit" 
            className="btn btn-danger w-100" 
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Registrar bombero'}
          </button>
          <button 
            type="button" 
            className="btn btn-secondary w-100 mt-2" 
            onClick={() => navigate('/')}
            disabled={loading}
          >
            Volver
          </button>
        </form>
      </div>
    </div>
  )
}

export default RegistrarBombero
