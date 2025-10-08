import { useState, useEffect } from 'react'
import { API_URLS, apiRequest, buildApiUrl } from '../../../config/api.js'
import { User, Phone, Mail, Shield, UserPlus, AlertTriangle, Home, CreditCard, TriangleAlert, Bone, PillIcon, FileText } from 'lucide-react'
import { BackToMenuButton } from '../../Common/Button.jsx'
import Select from 'react-select'

const RegistrarBombero = ({ onVolver }) => {
  const [formData, setFormData] = useState({
    dni: '', nombre: '', apellido: '', domicilio: '', email: '', telefono: '',
    legajo: '', antiguedad: '', rango: '', esPlan: false, fichaMedica: null,
    fechaFicha: new Date().toISOString().split('T')[0], aptoPsico: true,
    grupoSanguineo: '', username: '', password: '', emailUsuario: '', rolUsuario: ''
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
      if (id === 'dni' && value) {
        const legajoEsAutoGenerado = !prev.legajo || prev.legajo.startsWith('LEG-')
        if (legajoEsAutoGenerado) {
          newData.legajo = `LEG-${value}`
        }
      }
      if (id === 'dni' && !value && prev.legajo && prev.legajo.startsWith('LEG-')) {
        newData.legajo = ''
      }
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

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // Validar que si se completa algún campo de usuario, se completen todos
    const camposUsuario = {
      username: formData.username?.trim(),
      password: formData.password?.trim(),
      email: formData.emailUsuario?.trim(),
      rol: formData.rolUsuario
    }

    const camposLlenos = Object.values(camposUsuario).filter(val => val && val !== '').length
    const totalCampos = Object.keys(camposUsuario).length

    if (camposLlenos > 0 && camposLlenos < totalCampos) {
      setMessage('Si completa datos de usuario, debe completar todos los campos: Nombre de usuario, Contraseña, Email y Rol')
      setMessageType('error')
      setLoading(false)
      return
    }

    // Solo validar duplicados si se están completando los campos de usuario
    if (camposLlenos === totalCampos) {
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
    }

    try {
      const dataToSend = {
        usuario: {
          username: formData.username?.trim() || null,
          password: formData.password?.trim() || null,
          email: formData.emailUsuario?.trim() || null,
          idRol: formData.rolUsuario ? parseInt(formData.rolUsuario, 10) : null
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
        // Si hay archivo de ficha médica, subirlo
        if (formData.fichaMedica && formData.fichaMedica instanceof File) {
          try {
            const formDataFile = new FormData()
            formDataFile.append('fichaMedica', formData.fichaMedica)
            const uploadResponse = await fetch(buildApiUrl(`/api/bomberos/${formData.dni}/ficha-medica`), {
              method: 'POST',
              body: formDataFile
            })
            if (!uploadResponse.ok) {
              console.error('Error al subir ficha médica:', await uploadResponse.text())
              setMessage('⚠️ Bombero registrado pero hubo un error al subir la ficha médica')
              setMessageType('warning')
            } else {
              setMessage('¡Bombero registrado exitosamente!')
              setMessageType('success')
            }
          } catch (uploadError) {
            console.error('Error al subir archivo:', uploadError)
            setMessage('⚠️ Bombero registrado pero hubo un error al subir la ficha médica')
            setMessageType('warning')
          }
        } else {
          setMessage('¡Bombero registrado exitosamente!')
          setMessageType('success')
        }
        setFormData({ dni: '', nombre: '', apellido: '', domicilio: '', email: '', telefono: '', legajo: '', antiguedad: '', rango: 'Bombero', esPlan: false, fichaMedica: null, fechaFicha: new Date().toISOString().split('T')[0], aptoPsico: true, grupoSanguineo: '', username: '', password: '', emailUsuario: '', rolUsuario: '' })
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
    <div className="container-fluid py-5">
      <div className="text-center mb-4">
        <div className="d-flex justify-content-center align-items-center gap-3 mb-3">
          <div className='bg-danger p-3 rounded-circle'>
            <UserPlus size={32}
              color="white" />
          </div>
          <h1 className="fw-bold text-white fs-3 mb-0">Alta de Bombero</h1>
        </div>
        <span className="badge bg-danger-subtle text-danger">
          <AlertTriangle className="me-2" />
          Sistema de Gestión de Personal - Cuartel de Bomberos
        </span>
      </div>

      <div className="card edge-to-edge shadow-sm border-0 bg-white bg-opacity-1 backdrop-blur-sm">
        <div className="card-header bg-danger text-white d-flex align-items-center gap-2 py-4">
          <FileText />
          <strong>Registrar Bombero</strong>
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3 d-flex align-items-center gap-2">
              <User className="text-indigo" />
              <h5 className="mb-0 text-dark">Datos Personales</h5>
            </div>


            <div className="row mb-3">
              <div className="col-md-4">
                <label htmlFor="nombre" className="form-label text-dark d-flex align-items-center gap-2">
                  <User className="text-primary" />
                  Nombre
                </label>
                <input
                  type="text"
                  id="nombre"
                  className="form-control"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="col-md-4">
                <label htmlFor="apellido" className="form-label text-dark d-flex align-items-center gap-2">
                  <User className="text-primary" />
                  Apellido
                </label>
                <input
                  type="text"
                  id="apellido"
                  className="form-control"
                  value={formData.apellido}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="col-md-4">
                <label htmlFor="dni" className="form-label text-dark d-flex align-items-center gap-2">
                  <CreditCard className="text-primary" />
                  DNI
                </label>
                <input
                  type="text"
                  id="dni"
                  className="form-control"
                  value={formData.dni}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  maxLength="8"
                  pattern="[0-9]{7,8}"
                  title="Ingrese un DNI válido (7-8 dígitos)"
                />
              </div>

              <div className="col-md-4 py-4">
                <label htmlFor="domicilio" className="form-label text-dark d-flex align-items-center gap-2">
                  <Home className="text-purple" />
                  Domicilio
                </label>
                <input
                  type="text"
                  id="domicilio"
                  className="form-control"
                  value={formData.domicilio}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="col-md-4 py-4">
                <label htmlFor="telefono" className="form-label text-dark fw-semibold d-flex align-items-center gap-2">
                  <Phone size={16} className="text-primary" />
                  Telefono
                </label>
                <input
                  type="tel"
                  id="telefono"
                  className="form-control"
                  value={formData.telefono}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="col-md-4 py-4">
                <label htmlFor="email" className="form-label text-dark fw-semibold d-flex align-items-center gap-2">
                  <Mail size={16} className="text-primary" />
                  Correo electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  className="form-control"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="col-md-4">
                <label htmlFor="legajo" className="form-label text-dark fw-semibold d-flex align-items-center gap-2
                ">
                  <Mail className="text-primary" />
                  Legajo
                  <span className="badge bg-secondary text-white text-uppercase">opcional</span>
                </label>
                <input
                  type="text"
                  id="legajo"
                  className="form-control"
                  value={formData.legajo}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="col-md-4">
                <label htmlFor="antiguedad" className="form-label text-dark fw-semibold d-flex align-items-center gap-2">
                  <Mail className="text-primary" />
                  Antigüedad (años)
                </label>
                <input
                  type="number"
                  id="antiguedad"
                  className="form-control"
                  value={formData.antiguedad}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="col-md-4">
                <label htmlFor="rango" className="form-label text-dark fw-semibold d-flex align-items-center gap-2">
                  <Shield size={16} className="text-primary" />
                  Rango
                </label>
                {/* Campo oculto para validación HTML5 */}
                <input
                  type="text"
                  value={formData.rango || ''}
                  required
                  style={{ position: 'absolute', opacity: 0, height: 0, pointerEvents: 'none' }}
                  tabIndex={-1}
                  onChange={() => { }}
                />
                <Select
                  classNamePrefix="rs"
                  inputId="rango"
                  placeholder="Seleccione rango"
                  isClearable
                  isDisabled={loading}
                  options={rangosDisponibles.map(r => ({ value: r.descripcion, label: r.descripcion }))}
                  value={formData.rango ? { value: formData.rango, label: formData.rango } : null}
                  onChange={(opt) => setFormData(prev => ({ ...prev, rango: opt ? opt.value : '' }))}
                />
              </div>

              <div className="col-md-4 py-4">
                <label htmlFor="fichaMedica" className="form-label text-dark fw-semibold d-flex align-items-center gap-2">Ficha médica (PDF)</label>
                <input
                  className="form-control"
                  type="file"
                  id="fichaMedica"
                  accept="application/pdf"
                  disabled={loading}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-4 py-4">
                <label htmlFor="fechaFicha" className="form-label text-dark fw-semibold d-flex align-items-center gap-2">Fecha de carga</label>
                <input
                  className="form-control"
                  type="date"
                  id="fechaFicha"
                  value={formData.fechaFicha}
                  disabled={loading}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-4 py-4">
                <label htmlFor="grupoSanguineo" className="form-label text-dark fw-semibold d-flex align-items-center gap-2">
                  <PillIcon className="text-warning" />
                  Grupo Sanguíneo</label>
                {/* Campo oculto para validación HTML5 */}
                <input
                  type="text"
                  value={formData.grupoSanguineo || ''}
                  required
                  style={{ position: 'absolute', opacity: 0, height: 0, pointerEvents: 'none' }}
                  tabIndex={-1}
                  onChange={() => { }}
                />
                <Select
                  classNamePrefix="rs"
                  inputId="grupoSanguineo"
                  placeholder="Seleccione grupo"
                  isClearable
                  isDisabled={loading}
                  options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(gs => ({ value: gs, label: gs }))}
                  value={formData.grupoSanguineo ? { value: formData.grupoSanguineo, label: formData.grupoSanguineo } : null}
                  onChange={(opt) => setFormData(prev => ({ ...prev, grupoSanguineo: opt ? opt.value : '' }))}
                />
              </div>

              <div className="form-check form-switch mb-2 only-thumb">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="aptoPsico"
                  checked={formData.aptoPsico}
                  disabled={loading}
                  onChange={handleChange}
                />
                <label id="lbl-aptoPsico" className="form-label text-dark d-flex align-items-center gap-2">
                  Apto psicológico
                </label>
              </div>

              <div className="form-check form-switch mb-4 only-thumb">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="esPlan"
                  checked={formData.esPlan}
                  disabled={loading}
                  onChange={handleChange}
                />
                <label id="lbl-esPlan" className="form-label text-dark d-flex align-items-center gap-2">
                  Es del plan (guardias pagas)
                </label>
              </div>

              <hr className="mb-4" />

              <div className="mb-3 d-flex align-items-center gap-2">
                <Shield className="text-indigo" />
                <h5 className="mb-0 text-dark">Credenciales de Usuario</h5>
              </div>


              <div className="col-md-3">
                <label htmlFor="username" className="form-label text-dark fw-semibold d-flex align-items-center gap-2">
                  <User className="text-primary" />
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  className="form-control"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="col-md-3">
                <label htmlFor="password" className="form-label text-dark fw-semibold d-flex align-items-center gap-2">
                  <Shield className="text-primary" />
                  Contraseña
                </label>
                <input
                  type="password"
                  id="password"
                  className="form-control"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label text-dark fw-semibold d-flex align-items-center gap-2">
                  <Mail className="text-primary" />
                  Email Usuario
                </label>
                <input
                  type="email"
                  id="emailUsuario"
                  className="form-control"
                  value={formData.emailUsuario}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="col-md-3">
                <label htmlFor="rol" className="form-label text-dark fw-semibold d-flex align-items-center gap-2">
                  <Shield className="text-primary" />
                  Rol
                </label>
                <Select
                  classNamePrefix="rs"
                  inputId="rolUsuario"
                  placeholder="Seleccione rol"
                  isClearable
                  isDisabled={loading}
                  options={rolesDisponibles.map(r => ({ value: String(r.idRol), label: r.nombreRol }))}
                  value={
                    formData.rolUsuario
                      ? {
                        value: String(formData.rolUsuario),
                        label: rolesDisponibles.find(x => String(x.idRol) === String(formData.rolUsuario))?.nombreRol || ''
                      }
                      : null
                  }
                  onChange={(opt) => setFormData(prev => ({ ...prev, rolUsuario: opt ? opt.value : '' }))}
                />
              </div>
            </div>

            <hr className="mb-4" />

            <div className="d-flex justify-content-center align-items-center gap-3 mb-3">
              {onVolver && (
                <BackToMenuButton onClick={onVolver} />
              )}
              <button type="submit" className="btn btn-accept btn-lg btn-medium" onClick={handleSubmit} disabled={loading}>
                <UserPlus size={16} className="me-1" />
                {loading ? 'Registrando...' : 'Registrar bombero'}
              </button>
            </div>
          </form>
        </div>

        {message && (
          <div className={`alert ${messageType === 'success' ? 'alert-success' : 'alert-danger'} mt-2`}>
            {message}
          </div>
        )}
      </div>
    </div>
  )
}

export default RegistrarBombero
