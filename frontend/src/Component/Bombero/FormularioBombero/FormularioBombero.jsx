import { useState, useEffect } from 'react'
import './FormularioBombero.css'
import { User, Phone, Mail, Shield, CreditCard, PillIcon } from 'lucide-react'
import { API_URLS, apiRequest } from '../../../config/api'
import Select from 'react-select'

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

  // Cargar rangos desde backend (apiRequest ya devuelve JSON parseado)
  useEffect(() => {
    const fetchRangos = async () => {
      try {
        const resp = await apiRequest(API_URLS.rangos.getAll)
        if (resp?.success) {
          setRangosDisponibles(resp.data || [])
        } else {
          console.error('Error al obtener rangos:', resp)
        }
      } catch (error) {
        console.error('Error de conexión al obtener rangos:', error)
      }
    }
    fetchRangos()
  }, [])

  // Cargar datos iniciales cuando hay modo distinto de alta y ya tenemos rangos
  useEffect(() => {
    if (modo !== 'alta' && datosIniciales) {
      const idRango = datosIniciales.idRango || datosIniciales.id_rango || ''
      setFormData(prev => ({
        ...prev,
        dni: datosIniciales.dni ?? prev.dni,
        nombre: datosIniciales.nombre ?? prev.nombre,
        apellido: datosIniciales.apellido ?? prev.apellido,
        correo: datosIniciales.correo ?? datosIniciales.email ?? prev.correo,
        telefono: datosIniciales.telefono ?? datosIniciales.phone ?? prev.telefono,
        domicilio: datosIniciales.domicilio ?? datosIniciales.direccion ?? prev.domicilio,
        legajo: datosIniciales.legajo ?? prev.legajo,
        antiguedad: datosIniciales.antiguedad ?? prev.antiguedad ?? 0,
        rango: idRango,
        esDelPlan: datosIniciales.esDelPlan ?? datosIniciales.es_del_plan ?? prev.esDelPlan ?? false,
        aptoPsicologico: datosIniciales.aptoPsicologico ?? prev.aptoPsicologico ?? true,
        grupoSanguineo: datosIniciales.grupoSanguineo ?? datosIniciales.grupo_sanguineo ?? prev.grupoSanguineo,
        fichaMedica: datosIniciales.fichaMedicaArchivo ?? datosIniciales.ficha_medica_archivo ?? prev.fichaMedica,
        fichaMedicaArchivo: datosIniciales.fichaMedicaArchivo ?? datosIniciales.ficha_medica_archivo ?? prev.fichaMedicaArchivo,
        fechaFichaMedica: datosIniciales.fechaFichaMedica ?? datosIniciales.fecha_ficha_medica ?? prev.fechaFichaMedica,
        idUsuario: datosIniciales.idUsuario ?? datosIniciales.id_usuario ?? prev.idUsuario
      }))
    }
  }, [modo, datosIniciales])

  const handleChange = (e) => {
    const { id, value, type, checked, files } = e.target
    const newValue = type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    setFormData(prev => ({
      ...prev,
      [id]: newValue
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

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
      fichaMedicaArchivo: formData.fichaMedica
        ? (typeof formData.fichaMedica === 'string' ? formData.fichaMedica : formData.fichaMedica.name)
        : null,
      fechaFichaMedica: formData.fechaFichaMedica || null,
      idUsuario: formData.idUsuario || null
    }

    onSubmit(dataToSend)
  }

  const soloLectura = modo === 'consulta'

  const esConsulta = modo === 'consulta'
  // Tema light mejorado con mejor presentación
  const cardClasses = "card bg-white text-dark border-0 shadow-sm p-4"
  const labelClasses = "form-label text-dark d-flex align-items-center gap-2 fw-semibold"
  const inputClasses = esConsulta
    ? "form-control border-secondary bg-light"
    : "form-control border-secondary focus-ring focus-ring-primary"

  return (
    <div className="container">
      <div className={cardClasses}>
        {!ocultarTitulo && (
          <h4 className="mb-4 text-danger">
            {modo === 'alta' ? 'Alta de Bombero' : modo === 'edicion' ? 'Editar Bombero' : 'Consulta de Bombero'}
          </h4>
        )}

        <form onSubmit={handleSubmit}>
          {modo === 'edicion' && formData.idUsuario && (
            <input type="hidden" id="idUsuario" value={formData.idUsuario} onChange={handleChange} />
          )}

          {/* Información Personal */}
          {esConsulta && (
            <div className="mb-4">
              <div className="d-flex align-items-center mb-3 pb-2 border-bottom border-danger border-2">
                <div className="bg-danger p-2 rounded-circle me-3">
                  <i className="bi bi-person-circle text-white fs-5"></i>
                </div>
                <h5 className="text-danger mb-0 fw-bold">
                  Información Personal
                </h5>
              </div>
            </div>
          )}

          {/* Nombre, Apellido, DNI */}
          <div className="row mb-3">
            <div className="col-md-4">
              <label htmlFor="nombre" className={labelClasses}>
                <User className="text-primary" />
                Nombre
              </label>
              <input
                type="text"
                className={inputClasses}
                id="nombre"
                value={formData.nombre || ''}
                required={!soloLectura}
                onChange={handleChange}
                disabled={soloLectura || loading}
              />
            </div>

            <div className="col-md-4">
              <label htmlFor="apellido" className={labelClasses}>
                <User className="text-primary" />
                Apellido
              </label>
              <input
                type="text"
                className={inputClasses}
                id="apellido"
                value={formData.apellido || ''}
                required={!soloLectura}
                onChange={handleChange}
                disabled={soloLectura || loading}
              />
            </div>

            <div className="col-md-4">
              <label htmlFor="dni" className={labelClasses}>
                <CreditCard className="text-primary" />
                DNI
              </label>
              <input
                type="text"
                className={inputClasses}
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

          {/* Información de Contacto */}
          {esConsulta && (
            <div className="mb-4 mt-5">
              <div className="d-flex align-items-center mb-3 pb-2 border-bottom border-danger border-2">
                <div className="bg-danger p-2 rounded-circle me-3">
                  <i className="bi bi-telephone text-white fs-5"></i>
                </div>
                <h5 className="text-danger mb-0 fw-bold">
                  Información de Contacto
                </h5>
              </div>
            </div>
          )}

          {/* Contacto */}
          <div className="row mb-3 py-4">
            <div className="col-md-4">
              <label htmlFor="domicilio" className={labelClasses}>
                Domicilio
              </label>
              <input
                type="text"
                className={inputClasses}
                id="domicilio"
                value={formData.domicilio || ''}
                onChange={handleChange}
                disabled={soloLectura || loading}
                required={!soloLectura}
              />
            </div>

            <div className="col-md-4">
              <label htmlFor="telefono" className={labelClasses}>
                <Phone size={16} className="text-primary" />
                Teléfono
              </label>
              <input
                type="tel"
                className={inputClasses}
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
              <label htmlFor="correo" className={labelClasses}>
                <Mail className="text-primary" />
                Correo electrónico
              </label>
              <input
                type="email"
                className={inputClasses}
                id="correo"
                value={formData.correo || ''}
                onChange={handleChange}
                disabled={soloLectura || loading}
                required={!soloLectura}
              />
            </div>
          </div>

          {/* Información Profesional */}
          {esConsulta && (
            <div className="mb-4 mt-5">
              <div className="d-flex align-items-center mb-3 pb-2 border-bottom border-danger border-2">
                <div className="bg-danger p-2 rounded-circle me-3">
                  <i className="bi bi-shield-check text-white fs-5"></i>
                </div>
                <h5 className="text-danger mb-0 fw-bold">
                  Información Profesional
                </h5>
              </div>
            </div>
          )}

          <div className="row mb-3">
            <div className="col-md-4">
              <label htmlFor="legajo" className={labelClasses}>
                Legajo <span className="badge bg-secondary text-white text-uppercase ms-2">opcional</span>
              </label>
              <input
                type="text"
                className={inputClasses}
                id="legajo"
                value={formData.legajo || ''}
                onChange={handleChange}
                disabled={soloLectura || loading}
              />
            </div>

            <div className="col-md-4">
              <label htmlFor="antiguedad" className={labelClasses}>
                Antigüedad (años)
              </label>
              <input
                type="number"
                className={inputClasses}
                id="antiguedad"
                value={formData.antiguedad || 0}
                onChange={handleChange}
                disabled={soloLectura || loading}
                min="0"
                max="50"
              />
            </div>

            <div className="col-md-4">
              <label htmlFor="rango" className={labelClasses}>
                <Shield className="text-primary" />
                Rango
              </label>
              <Select
                classNamePrefix="rs"
                inputId="rango"
                placeholder="Seleccione un rango"
                isClearable
                isDisabled={soloLectura || loading}
                options={rangosDisponibles.map(r => ({ value: String(r.idRango), label: r.descripcion }))}
                value={
                  formData.rango
                    ? {
                      value: String(formData.rango),
                      label: rangosDisponibles.find(x => String(x.idRango) === String(formData.rango))?.descripcion || ''
                    }
                    : null
                }
                onChange={(opt) =>
                  setFormData(prev => ({ ...prev, rango: opt ? opt.value : '' }))
                }
              />
            </div>
          </div>

          {/* Información Médica */}
          {esConsulta && (
            <div className="mb-4 mt-5">
              <div className="d-flex align-items-center mb-3 pb-2 border-bottom border-danger border-2">
                <div className="bg-danger p-2 rounded-circle me-3">
                  <i className="bi bi-heart-pulse text-white fs-5"></i>
                </div>
                <h5 className="text-danger mb-0 fw-bold">
                  Información Médica
                </h5>
              </div>
            </div>
          )}

          <div className="row mb-3 py-4">
            <div className="col-md-4">
              <label htmlFor="fichaMedica" className={labelClasses}>
                Ficha médica (PDF)
              </label>

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
              <label htmlFor="fechaFichaMedica" className={labelClasses}>
                Fecha de carga
              </label>
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
              <label htmlFor="grupoSanguineo" className={labelClasses}>
                <PillIcon className="text-warning" />
                Grupo Sanguíneo
              </label>
              <Select
                classNamePrefix="rs"
                inputId="grupoSanguineo"
                placeholder="Seleccione"
                isClearable
                isDisabled={soloLectura || loading}
                options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(gs => ({ value: gs, label: gs }))}
                value={formData.grupoSanguineo ? { value: formData.grupoSanguineo, label: formData.grupoSanguineo } : null}
                onChange={(opt) =>
                  setFormData(prev => ({ ...prev, grupoSanguineo: opt ? opt.value : '' }))
                }
              />
            </div>
          </div>

          {/* Switches */}
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
                <label className={labelClasses} htmlFor="aptoPsicologico">
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
                <label className={labelClasses} htmlFor="esDelPlan">
                  Es del plan (guardias pagas)
                </label>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="d-grid gap-3">
            {!soloLectura && (
              <button type="submit" className="btn btn-danger btn-lg" disabled={loading}>
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
