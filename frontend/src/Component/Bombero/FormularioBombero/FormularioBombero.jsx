import { useState, useEffect } from 'react'
import './FormularioBombero.css'
import '../../../Component/DisenioFormulario/DisenioFormulario.css'
import { User, Phone, Mail, Shield, UserPlus, AlertTriangle, Home, CreditCard, TriangleAlert, Bone, PillIcon, FileText } from 'lucide-react'

const FormularioBombero = ({ modo = 'alta', datosIniciales = {}, onSubmit, onVolver, loading = false, ocultarTitulo = false }) => {
  const [rangosDisponibles, setRangosDisponibles] = useState([])

  const [formData, setFormData] = useState({
    dni: '',
    nombre: '',
    apellido: '',
    correo: '',
    telefono: '',
    domicilio: '',
    legajo: '',
    antiguedad: 0,
    rango: '',
    esDelPlan: false,
    aptoPsicologico: true,
    grupoSanguineo: '',
    fichaMedica: null,
    fichaMedicaArchivo: null,
    fechaFichaMedica: new Date().toISOString().split('T')[0],
    idUsuario: null
  })

  useEffect(() => {

    if (modo !== 'alta' && datosIniciales && rangosDisponibles.length > 0) {
      const idRango = datosIniciales.idRango || datosIniciales.id_rango
      const descripcionRango = rangosDisponibles.find(
        r => r.idRango === (datosIniciales.idRango || datosIniciales.id_rango)
      )?.descripcion || ''

      const datosFormateados = {
        dni: datosIniciales.dni || '',
        nombre: datosIniciales.nombre || '',
        apellido: datosIniciales.apellido || '',
        correo: datosIniciales.correo || datosIniciales.email || '',
        telefono: datosIniciales.telefono || datosIniciales.phone || '',
        domicilio: datosIniciales.domicilio || datosIniciales.direccion || '',
        legajo: datosIniciales.legajo || '',
        antiguedad: datosIniciales.antiguedad || 0,
        rango: idRango,
        esDelPlan: datosIniciales.esDelPlan || datosIniciales.es_del_plan || false,
        aptoPsicologico: datosIniciales.aptoPsicologico !== undefined ? datosIniciales.aptoPsicologico : true,
        grupoSanguineo: datosIniciales.grupoSanguineo || datosIniciales.grupo_sanguineo || '',
        fichaMedica: datosIniciales.fichaMedicaArchivo || datosIniciales.ficha_medica_archivo || null,
        fichaMedicaArchivo: datosIniciales.fichaMedicaArchivo || datosIniciales.ficha_medica_archivo || null,
        fechaFichaMedica: datosIniciales.fechaFichaMedica || datosIniciales.fecha_ficha_medica || new Date().toISOString().split('T')[0],
        idUsuario: datosIniciales.idUsuario || datosIniciales.id_usuario || null
      }

      setFormData(datosFormateados)
    }
  }, [datosIniciales, modo, rangosDisponibles])


  const handleChange = (e) => {
    const { id, value, type, checked, files } = e.target
    const newValue = type === 'checkbox' ? checked : type === 'file' ? files[0] : value

    setFormData(prev => ({
      ...prev,
      [id]: newValue
    }))
  }
  useEffect(() => {
    const fetchRangos = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/rangos')
        const data = await res.json()
        if (res.ok && data.success) {
          setRangosDisponibles(data.data)
        } else {
          console.error('Error al obtener rangos:', data)
        }
      } catch (error) {
        console.error('Error de conexión al obtener rangos:', error)
      }
    }

    fetchRangos()
  }, [])


  const handleSubmit = (e) => {
    e.preventDefault()

    // Preparar datos para enviar al backend
    const dataToSend = {
      dni: formData.dni,
      nombre: formData.nombre,
      apellido: formData.apellido,
      correo: formData.correo,
      telefono: formData.telefono,
      domicilio: formData.domicilio,
      legajo: formData.legajo || null,
      antiguedad: parseInt(formData.antiguedad) || 0,
      idRango: formData.rango,
      esDelPlan: formData.esDelPlan,
      aptoPsicologico: formData.aptoPsicologico,
      grupoSanguineo: formData.grupoSanguineo,
      fichaMedica: formData.fichaMedica ? 1 : null,
      fichaMedicaArchivo: formData.fichaMedica ? (typeof formData.fichaMedica === 'string' ? formData.fichaMedica : formData.fichaMedica.name) : null, // Nombre del archivo
      fechaFichaMedica: formData.fechaFichaMedica || null,
      idUsuario: formData.idUsuario || null
    }
    onSubmit(dataToSend)
  }

  const soloLectura = modo === 'consulta'

  return (
    <div className="container">
      <div className="card bg-dark text-white border-0 shadow-lg p-4">
        {!ocultarTitulo && (
          <h4 className="mb-4 text-danger">
            {modo === 'alta' ? 'Alta de Bombero' : modo === 'edicion' ? 'Editar Bombero' : 'Consulta de Bombero'}
          </h4>
        )}

        <form onSubmit={handleSubmit}>

          {modo === 'edicion' && formData.idUsuario && (
            <input
              type="hidden"
              id="idUsuario"
              value={formData.idUsuario}
              onChange={handleChange}
            />
          )}

          {/* dni - Nombre Completo */}
          <div className="row mb-3">
            <div className="col-md-4">
              <label htmlFor="nombre" className="form-label text-white d-flex align-items-center gap-2">
                <User className="text-primary" />
                Nombre
              </label>
              <input
                type="text"
                className="form-control bg-secondary text-white border-0"
                id="nombre"
                value={formData.nombre || ''}
                required={!soloLectura}
                onChange={handleChange}
                disabled={soloLectura || loading}
              />
            </div>

            <div className="col-md-4">
              <label htmlFor="apellido" className="form-label text-white d-flex align-items-center gap-2">
                <User className="text-primary" />
                Apellido
              </label>
              <input
                type="text"
                className="form-control bg-secondary text-white border-0"
                id="apellido"
                value={formData.apellido || ''}
                required={!soloLectura}
                onChange={handleChange}
                disabled={soloLectura || loading}
              />
            </div>

            <div className="col-md-4">
              <label htmlFor="dni" className="form-label text-white d-flex align-items-center gap-2"><CreditCard className="text-primary" />
                DNI
              </label>
              <input
                type="text"
                className="form-control bg-secondary text-white border-0"
                id="dni"
                value={formData.dni || ''}
                required={!soloLectura}
                onChange={handleChange}
                disabled={soloLectura || loading || modo === 'edicion'}
                pattern="[0-9]{7,8}"
                title="Ingrese un dni válido (7-8 dígitos)"
              />
            </div>
          </div>

          {/* Contacto */}
          <div className="row mb-3 py-4">
            <div className="col-md-4">
              <label htmlFor="domicilio" className="form-label text-white d-flex align-items-center gap-2">
                <Home className="text-purple" />
                Domicilio
              </label>
              <input
                type="text"
                className="form-control bg-secondary text-white border-0"
                id="domicilio"
                value={formData.domicilio || ''}
                onChange={handleChange}
                disabled={soloLectura || loading}
                required={!soloLectura}
              />
            </div>

            <div className="col-md-4">
              <label htmlFor="telefono" className="form-label text-white fw-semibold d-flex align-items-center gap-2">
                <Phone size={16} className="text-primary" />
                Telefono
              </label>
              <input
                type="tel"
                className="form-control bg-secondary text-white border-0"
                id="telefono"
                value={formData.telefono || ''}
                onChange={handleChange}
                disabled={soloLectura || loading}
                required={!soloLectura}
                pattern="[0-9+\-\s\(\)]{8,15}"
                title="Ingrese un teléfono válido (8-15 dígitos)"
              />
            </div>

            <div className="col-md-4">
              <label htmlFor="email" className="form-label text-white fw-semibold d-flex align-items-center gap-2">
                <Mail className="text-primary" />
                Correo electrónico
              </label>
              <input
                type="email"
                className="form-control bg-secondary text-white border-0"
                id="correo"
                value={formData.correo || ''}
                onChange={handleChange}
                disabled={soloLectura || loading}
                required={!soloLectura}
              />
            </div>
          </div>

          {/* Información Profesional */}
          <div className="row mb-3">
            <div className="col-md-4">
              <label htmlFor="legajo" className="form-label text-white fw-semibold d-flex align-items-center gap-2
                ">
                <Mail className="text-primary" />
                Legajo
                <span className="badge bg-secondary text-white text-uppercase">opcional</span>
              </label>
              <input
                type="text"
                className="form-control bg-secondary text-white border-0"
                id="legajo"
                value={formData.legajo || ''}
                onChange={handleChange}
                disabled={soloLectura || loading}
              />
            </div>

            <div className="col-md-4">
              <label htmlFor="antiguedad" className="form-label text-white fw-semibold d-flex align-items-center gap-2">
                <Mail className="text-primary" />
                Antigüedad (años)
              </label>
              <input
                type="number"
                className="form-control bg-secondary text-white border-0"
                id="antiguedad"
                value={formData.antiguedad || 0}
                onChange={handleChange}
                disabled={soloLectura || loading}
                min="0"
                max="50"
              />
            </div>

            <div className="col-md-4">
              <label htmlFor="rango" className="form-label text-white fw-semibold d-flex align-items-center gap-2">
                <Shield className="text-primary" />
                Rango
              </label>
              <select
                className="form-select form-control bg-secondary text-dark border-0"
                id="rango"
                value={formData.rango}
                required={!soloLectura}
                disabled={soloLectura || loading}
                onChange={handleChange}
              >
                <option value="">Seleccione un rango</option>
                {rangosDisponibles.map(r => (
                  <option key={r.idRango} value={r.idRango}>
                    {r.descripcion}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Información Médica */}
          <div className="row mb-3 py-4">
            <div className="col-md-4">
              <label htmlFor="fichaMedica" className="form-label text-white fw-semibold d-flex align-items-center gap-2">Ficha médica (PDF)</label>

              {/* Mostrar archivo cargado con botón ❌ */}
              {formData.fichaMedicaArchivo && typeof formData.fichaMedicaArchivo === 'string' ? (
                <div className="d-flex align-items-center justify-content-between border rounded p-2 bg-light">
                  <small className="text-muted me-2" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {formData.fichaMedicaArchivo}
                  </small>
                  {!soloLectura && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => {
                        const confirmar = window.confirm('¿Eliminar la ficha médica actual? Podrás subir una nueva.')
                        if (confirmar) {
                          setFormData(prev => ({
                            ...prev,
                            fichaMedica: null,
                            fichaMedicaArchivo: null
                          }))
                        }
                      }}
                      title="Eliminar archivo"
                    >
                      ❌
                    </button>
                  )}
                </div>
              ) : (
                // Input de carga solo si no hay archivo
                <input
                  type="file"
                  className="form-control"
                  id="fichaMedica"
                  onChange={handleChange}
                  accept="application/pdf"
                  disabled={soloLectura || loading}
                />
              )}
            </div>

            <div className="col-md-4">
              <label htmlFor="fechaFicha" className="form-label text-white fw-semibold d-flex align-items-center gap-2">Fecha de carga</label>
              <input
                type="date"
                className="form-control"
                id="fechaFichaMedica"
                value={formData.fechaFichaMedica ? formData.fechaFichaMedica.split('T')[0] : ''}
                onChange={handleChange}
                disabled={soloLectura || loading}
              />
            </div>

            <div className="col-md-4">
              <label htmlFor="grupoSanguineo" className="form-label text-white fw-semibold d-flex align-items-center gap-2">
                <PillIcon className="text-warning" />
                Grupo Sanguíneo</label>
              <select
                className="form-select form-control bg-secondary text-dark border-0"
                id="grupoSanguineo"
                value={formData.grupoSanguineo || ''}
                onChange={handleChange}
                disabled={soloLectura || loading}
                required={!soloLectura}
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

          {/* Checkboxes */}
          <div className="row mb-3 py-4">
            <div className="col-md-6">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="aptoPsicologico"
                  checked={formData.aptoPsicologico || false}
                  onChange={handleChange}
                  disabled={soloLectura || loading}
                />
                <label className="form-label text-white d-flex align-items-center gap-2" htmlFor="aptoPsico">
                  Apto psicológico
                </label>
              </div>
            </div>

            <div className="col-md-6">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="esDelPlan"
                  checked={formData.esDelPlan || false}
                  onChange={handleChange}
                  disabled={soloLectura || loading}
                />
                <label className="form-label text-white d-flex align-items-center gap-2" htmlFor="esPlan">
                  Es del plan (guardias pagas)
                </label>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="d-grid gap-3">
            {!soloLectura && (
              <button type="submit" className="btn btn-danger 
              btn-lg" disabled={loading}>
                {loading ? 'Procesando...' : modo === 'alta' ? 'Registrar Bombero' : 'Guardar Cambios'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default FormularioBombero
