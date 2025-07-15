import { useState, useEffect } from 'react'
import { API_URLS, apiRequest } from '../../../config/api'
import '../../DisenioFormulario/DisenioFormulario.css'

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
    rango: 'Bombero',
    esPlan: false,
    fichaMedica: null,
    fechaFicha: new Date().toISOString().split('T')[0],
    aptoPsico: true,
    grupoSanguineo: '',
    username: '',
    password: '',
    emailUsuario: '',
    rolUsuario: '2'
  })

  const [rolesDisponibles, setRolesDisponibles] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  const handleChange = (e) => {
    const { id, value, type, checked, files } = e.target
    setFormData(prev => {
      const newData = {
        ...prev,
        [id]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
      }

      if (id === 'nombre' || id === 'apellido') {
        const nombre = id === 'nombre' ? value : prev.nombre
        const apellido = id === 'apellido' ? value : prev.apellido
        if (nombre && apellido) {
          newData.username = `${nombre.toLowerCase()}.${apellido.toLowerCase()}`.replace(/\s+/g, '')
        }
      }

      if (id === 'email') {
        // Siempre sincronizar el email del usuario con el del bombero
        newData.emailUsuario = value
      }

      if (id === 'dni') {
        if (!prev.legajo && value) {
          newData.legajo = `LEG-${value}`
        }
      }

      return newData
    })
  }

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await apiRequest(API_URLS.roles.getAll)
        if (response.success) {
          setRolesDisponibles(response.data)
        } else {
          console.error('❌ Error al obtener roles:', response.message)
        }
      } catch (error) {
        console.error('💥 Error al cargar roles:', error)
      }
    }

    fetchRoles()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (!formData.dni || !formData.nombre || !formData.apellido || !formData.email || !formData.telefono || !formData.domicilio || !formData.rango || !formData.grupoSanguineo) {
        setMessage('Por favor, complete todos los campos obligatorios')
        setMessageType('error')
        setLoading(false)
        return
      }

      const dataToSend = {
        usuario: {
          username: formData.username,
          password: formData.password,
          email: formData.emailUsuario,
          idRol: parseInt(formData.rolUsuario, 10)
        },
        bombero: {
          dni: formData.dni,
          nombre: formData.nombre,
          apellido: formData.apellido,
          correo: formData.email,
          telefono: formData.telefono,
          domicilio: formData.domicilio,
          legajo: formData.legajo || null,
          antiguedad: formData.antiguedad ? parseInt(formData.antiguedad) : 0,
          idRango: getRangoId(formData.rango),
          esDelPlan: formData.esPlan,
          aptoPsicologico: formData.aptoPsico,
          grupoSanguineo: formData.grupoSanguineo,
          fichaMedica: formData.fichaMedica ? 1 : null,
          fichaMedicaArchivo: formData.fichaMedica ? formData.fichaMedica.name : null,
          fechaFichaMedica: formData.fechaFicha || null
        }
      }

      console.log('🚀 Enviando datos al backend:', dataToSend)
      console.log('📡 URL de la API:', API_URLS.bomberos.createFull)
      
      const response = await fetch(API_URLS.bomberos.createFull, {
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
          rango: 'Bombero',
          esPlan: false,
          fichaMedica: null,
          fechaFicha: new Date().toISOString().split('T')[0],
          aptoPsico: true,
          grupoSanguineo: '',
          username: '',
          password: '',
          emailUsuario: '',
          rolUsuario: '2'
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
      <div className="formulario-consistente">
        <h2 className="text-black text-center mb-4">Alta de Bombero</h2>

        {message && (
          <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-danger'} mt-3`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row mb-3">
            <div className="col-md-4">
              <label htmlFor="nombre" className="text-black form-label">Nombre</label>
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
              <label htmlFor="apellido" className="text-black form-label">Apellido</label>
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
              <label htmlFor="dni" className="text-black form-label">dni</label>
              <input 
                type="text" 
                className="form-control" 
                id="dni" 
                value={formData.dni} 
                required 
                disabled={loading}
                pattern="[0-9]{7,8}"
                title="Ingrese un dni válido (7-8 dígitos)"
                onChange={handleChange} 
              />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-4">
              <label htmlFor="domicilio" className="text-black form-label">Domicilio</label>
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
              <label htmlFor="telefono" className="text-black form-label">Teléfono</label>
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
              <label htmlFor="email" className="text-black form-label">Correo electrónico</label>
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

          <div className="row mb-3">
            <div className="col-md-4">
              <label htmlFor="legajo" className="text-black form-label">Legajo (opcional)</label>
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
              <label htmlFor="antiguedad" className="text-black form-label">Antigüedad (años)</label>
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
              <label htmlFor="rango" className="text-black form-label">Rango</label>
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

          <div className="form-check form-switch mb-3">
            <input 
              className="form-check-input" 
              type="checkbox" 
              id="esPlan" 
              checked={formData.esPlan} 
              disabled={loading}
              onChange={handleChange} 
            />
            <label className="text-black form-check-label" htmlFor="esPlan">
              Es del plan (guardias pagas)
            </label>
          </div>

          <div className="row mb-3">
            <div className="col-md-4">
              <label htmlFor="fichaMedica" className="text-black form-label">Ficha médica (PDF)</label>
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
              <label htmlFor="fechaFicha" className="text-black form-label">Fecha de carga</label>
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
              <label htmlFor="grupoSanguineo" className="text-black form-label">Grupo sanguíneo</label>
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

          <div className="form-check form-switch mb-3">
            <input 
              className="form-check-input" 
              type="checkbox" 
              id="aptoPsico" 
              checked={formData.aptoPsico} 
              disabled={loading}
              onChange={handleChange} 
            />
            <label className="text-black form-check-label" htmlFor="aptoPsico">
              Apto psicológico
            </label>
          </div>

          <h5 className="text-black mb-3">Credenciales de Usuario</h5>
          <div className="row mb-3">
            <div className="col-md-3">
              <label htmlFor="username" className="text-black form-label">Username</label>
              <input type="text" id="username" className="form-control" value={formData.username} required disabled={loading} onChange={handleChange} />
            </div>
            <div className="col-md-3">
              <label htmlFor="password" className="text-black form-label">Contraseña</label>
              <input type="password" id="password" className="form-control" value={formData.password} required disabled={loading} onChange={handleChange} />
            </div>
            <div className="col-md-3">
              <label htmlFor="emailUsuario" className="text-black form-label">Email usuario</label>
              <input type="email" id="emailUsuario" className="form-control" value={formData.emailUsuario} disabled={loading} onChange={handleChange} />
            </div>
            <div className="col-md-3">
              <label htmlFor="rolUsuario" className="text-black form-label">Rol usuario</label>
              <select
                id="rolUsuario"
                className="form-select"
                value={formData.rolUsuario}
                disabled={loading}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione un rol</option>
                {rolesDisponibles.map(rol => (
                  <option key={rol.idRol} value={rol.idRol}>
                    {rol.nombreRol}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="botones-accion">
            <button type="submit" className="btn btn-danger" disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar bombero'}
            </button>

            {onVolver && (
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onVolver} 
                disabled={loading}
              >
                Volver
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default RegistrarBombero
