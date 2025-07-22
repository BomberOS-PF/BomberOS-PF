import { useState, useEffect } from 'react'
import { API_URLS, apiRequest } from '../../../config/api.js'
import '../../DisenioFormulario/DisenioFormulario.css'

const RegistrarBombero = ({ onVolver }) => {
  const [formData, setFormData] = useState({
    dni: '', nombre: '', apellido: '', domicilio: '', email: '', telefono: '',
    legajo: '', antiguedad: '', rango: '', esPlan: false, fichaMedica: null,
    fechaFicha: new Date().toISOString().split('T')[0], aptoPsico: true,
    grupoSanguineo: '', username: '', password: '', emailUsuario: '', rolUsuario: '2'
  })
  const [rangosDisponibles, setRangosDisponibles] = useState([])
  const [rolesDisponibles, setRolesDisponibles] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  const handleChange = (e) => {
    const { id, value, type, checked, files } = e.target
    setFormData(prev => {
      const newData = { ...prev, [id]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value }
      if (id === 'nombre' || id === 'apellido') {
        const nombre = id === 'nombre' ? value : prev.nombre
        const apellido = id === 'apellido' ? value : prev.apellido
        if (nombre && apellido) {
          newData.username = `${nombre.toLowerCase()}.${apellido.toLowerCase()}`.replace(/\s+/g, '')
        }
      }
      if (id === 'email') newData.emailUsuario = value
      if (id === 'emailUsuario') newData.email = value
      if (id === 'dni' && !prev.legajo && value) newData.legajo = `LEG-${value}`
      return newData
    })
  }

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await apiRequest(API_URLS.roles.getAll)
        if (response.success) setRolesDisponibles(response.data)
      } catch (error) { console.error('Error al cargar roles:', error) }
    }

    const fetchRangos = async () => {
      try {
        const response = await apiRequest(API_URLS.rangos.getAll)
        if (response.success) setRangosDisponibles(response.data)
      } catch (error) { console.error('Error al cargar rangos:', error) }
    }

    fetchRoles()
    fetchRangos()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const resUsuarios = await apiRequest(API_URLS.usuarios.getAll)
      if (resUsuarios.success) {
        const usuarios = resUsuarios.data
        const emailEnUso = usuarios.find(u => u.email?.trim().toLowerCase() === formData.emailUsuario.trim().toLowerCase())
        if (emailEnUso) {
          setMessage('Correo electrónico ya registrado')
          setMessageType('error')
          setLoading(false)
          return
        }
        const usernameEnUso = usuarios.find(u => u.usuario?.toLowerCase().trim() === formData.username.toLowerCase().trim())
        if (usernameEnUso) {
          setMessage('Nombre de usuario no disponible')
          setMessageType('error')
          setLoading(false)
          return
        }
      }
    } catch (error) {
      setMessage(`Error al validar usuario: ${error.message}`)
      setMessageType('error')
      setLoading(false)
      return
    }

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

      const response = await fetch(API_URLS.bomberos.createFull, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setMessage('¡Bombero registrado exitosamente!')
        setMessageType('success')
        setFormData({ dni: '', nombre: '', apellido: '', domicilio: '', email: '', telefono: '', legajo: '', antiguedad: '', rango: 'Bombero', esPlan: false, fichaMedica: null, fechaFicha: new Date().toISOString().split('T')[0], aptoPsico: true, grupoSanguineo: '', username: '', password: '', emailUsuario: '', rolUsuario: '' })
        setTimeout(() => { if (onVolver) onVolver() }, 2000)
      } else {
        const errorMessage = result.message || result.error || 'Error al registrar bombero'
        setMessage(errorMessage)
        setMessageType('error')
      }
    } catch (error) {
      setMessage(`Error de conexión: ${error.message}`)
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const getRangoId = (rangoNombre) => {
    const encontrado = rangosDisponibles.find(r => r.descripcion === rangoNombre)
    return encontrado ? encontrado.idRango : null
  }

  return (
    <div className="container-fluid px-5">
      <div className="formulario-consistente">
        <h2 className="text-black text-center mb-4">Alta de Bombero</h2>

        {message && (
          <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-danger'} mt-3`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row mb-3">
            <div className="col-md-3">
              <label className="text-black form-label">Nombre</label>
              <input type="text" id="nombre" className="form-control" value={formData.nombre} onChange={handleChange} required disabled={loading} />
            </div>
            <div className="col-md-3">
              <label className="text-black form-label">Apellido</label>
              <input type="text" id="apellido" className="form-control" value={formData.apellido} onChange={handleChange} required disabled={loading} />
            </div>
            <div className="col-md-3">
              <label className="text-black form-label">DNI</label>
              <input type="text" id="dni" className="form-control" value={formData.dni} onChange={handleChange} required disabled={loading} />
            </div>
            <div className="col-md-3">
              <label className="text-black form-label">Domicilio</label>
              <input type="text" id="domicilio" className="form-control" value={formData.domicilio} onChange={handleChange} required disabled={loading} />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-3">
              <label className="text-black form-label">Teléfono</label>
              <input type="tel" id="telefono" className="form-control" value={formData.telefono} onChange={handleChange} required disabled={loading} />
            </div>
            <div className="col-md-3">
              <label className="text-black form-label">Email</label>
              <input type="email" id="email" className="form-control" value={formData.email} onChange={handleChange} required disabled={loading} />
            </div>
            <div className="col-md-3">
              <label className="text-black form-label">Rango</label>
              <select id="rango" className="form-select" value={formData.rango} onChange={handleChange} required disabled={loading}>
                <option value="">Seleccione</option>
                {rangosDisponibles.map(r => <option key={r.idRango} value={r.descripcion}>{r.descripcion}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="text-black form-label">Grupo Sanguíneo</label>
              <select id="grupoSanguineo" className="form-select" value={formData.grupoSanguineo} onChange={handleChange} required disabled={loading}>
                <option value="">Seleccione</option>
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(gs => <option key={gs} value={gs}>{gs}</option>)}
              </select>
            </div>
          </div>

          <h5 className="text-black mt-4 mb-2">Credenciales de Usuario</h5>
          <div className="row mb-3">
            <div className="col-md-3">
              <label className="text-black form-label">Username</label>
              <input type="text" id="username" className="form-control" value={formData.username} onChange={handleChange} required disabled={loading} />
            </div>
            <div className="col-md-3">
              <label className="text-black form-label">Contraseña</label>
              <input type="password" id="password" className="form-control" value={formData.password} onChange={handleChange} required disabled={loading} />
            </div>
            <div className="col-md-3">
              <label className="text-black form-label">Email usuario</label>
              <input type="email" id="emailUsuario" className="form-control" value={formData.emailUsuario} onChange={handleChange} required disabled={loading} />
            </div>
            <div className="col-md-3">
              <label className="text-black form-label">Rol</label>
              <select id="rolUsuario" className="form-select" value={formData.rolUsuario} onChange={handleChange} required disabled={loading}>
                <option value="">Seleccione</option>
                {rolesDisponibles.map(r => <option key={r.idRol} value={r.idRol}>{r.nombreRol}</option>)}
              </select>
            </div>
          </div>

          <div className="botones-accion">
            <button type="submit" className="btn btn-danger me-2" disabled={loading}>{loading ? 'Registrando...' : 'Registrar bombero'}</button>
            {onVolver && <button type="button" className="btn btn-secondary" onClick={onVolver} disabled={loading}>Volver</button>}
          </div>
        </form>
      </div>
    </div>
  )
}

export default RegistrarBombero
