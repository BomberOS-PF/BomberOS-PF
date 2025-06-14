import { useState, useEffect } from 'react'
import './FormularioBombero.css'

const FormularioBombero = ({ modo = 'alta', datosIniciales = {}, onSubmit, onVolver, loading = false }) => {
  const [formData, setFormData] = useState({
    DNI: '',
    nombreCompleto: '',
    correo: '',
    telefono: '',
    domicilio: '',
    legajo: '',
    antiguedad: 0,
    idRango: 1,
    esDelPlan: false,
    aptoPsicologico: false,
    grupoSanguineo: '',
    fichaMedica: null,
    fichaMedicaArchivo: null,
    fechaFichaMedica: ''
  })

  useEffect(() => {
    if (modo !== 'alta' && datosIniciales) {
      console.log('🔄 Cargando datos iniciales en FormularioBombero:', datosIniciales)
      console.log('🎯 Modo:', modo)
      
      // Mapear los datos del backend al formato del formulario con flexibilidad
      const nombreCompleto = datosIniciales.nombreCompleto || datosIniciales.nombre_completo || ''
      const [nombre, ...apellidoParts] = nombreCompleto.split(' ')
      const apellido = apellidoParts.join(' ')
      
      const datosFormateados = {
        DNI: datosIniciales.DNI || datosIniciales.dni || '',
        nombreCompleto: nombreCompleto,
        nombre: nombre || '',
        apellido: apellido || '',
        correo: datosIniciales.correo || datosIniciales.email || '',
        telefono: datosIniciales.telefono || datosIniciales.phone || '',
        domicilio: datosIniciales.domicilio || datosIniciales.direccion || '',
        legajo: datosIniciales.legajo || '',
        antiguedad: datosIniciales.antiguedad || 0,
        idRango: datosIniciales.idRango || datosIniciales.id_rango || 1,
        rango: getRangoNombre(datosIniciales.idRango || datosIniciales.id_rango || 1),
        esDelPlan: datosIniciales.esDelPlan || datosIniciales.es_del_plan || false,
        aptoPsicologico: datosIniciales.aptoPsicologico || datosIniciales.apto_psicologico || false,
        grupoSanguineo: datosIniciales.grupoSanguineo || datosIniciales.grupo_sanguineo || '',
        fichaMedica: datosIniciales.fichaMedicaArchivo || datosIniciales.ficha_medica_archivo || null,
        fichaMedicaArchivo: datosIniciales.fichaMedicaArchivo || datosIniciales.ficha_medica_archivo || null,
        fechaFichaMedica: datosIniciales.fechaFichaMedica || datosIniciales.fecha_ficha_medica || ''
      }
      
      console.log('✅ Datos formateados para el formulario:', datosFormateados)
      setFormData(datosFormateados)
    }
  }, [datosIniciales, modo])

  const handleChange = (e) => {
    const { id, value, type, checked, files } = e.target
    let newValue = type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    
    setFormData(prev => {
      const updated = {
        ...prev,
        [id]: newValue
      }
      
      // Si cambia nombre o apellido, actualizar nombreCompleto
      if (id === 'nombre' || id === 'apellido') {
        const nombre = id === 'nombre' ? newValue : prev.nombre || ''
        const apellido = id === 'apellido' ? newValue : prev.apellido || ''
        updated.nombreCompleto = `${nombre} ${apellido}`.trim()
      }
      
      // Si cambia el rango, actualizar idRango
      if (id === 'rango') {
        updated.idRango = getRangoId(newValue)
      }
      
      return updated
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    console.log('📤 Enviando formulario en modo:', modo)
    console.log('📋 Datos del formulario:', formData)
    
    // Preparar datos para enviar al backend
    const dataToSend = {
      DNI: formData.DNI,
      nombreCompleto: formData.nombreCompleto,
      correo: formData.correo,
      telefono: formData.telefono,
      domicilio: formData.domicilio,
      legajo: formData.legajo || null,
      antiguedad: parseInt(formData.antiguedad) || 0,
      idRango: formData.idRango,
      esDelPlan: formData.esDelPlan,
      aptoPsicologico: formData.aptoPsicologico,
      grupoSanguineo: formData.grupoSanguineo,
      fichaMedica: formData.fichaMedica ? 1 : null, // Campo booleano/entero
      fichaMedicaArchivo: formData.fichaMedica ? (typeof formData.fichaMedica === 'string' ? formData.fichaMedica : formData.fichaMedica.name) : null, // Nombre del archivo
      fechaFichaMedica: formData.fechaFichaMedica || null
    }
    
    console.log('🚀 Datos preparados para enviar:', dataToSend)
    onSubmit(dataToSend)
  }

  // Función para mapear IDs de rango a nombres
  const getRangoNombre = (rangoId) => {
    const rangos = {
      1: 'Bombero',
      2: 'Cabo',
      3: 'Sargento',
      4: 'Sargento Primero',
      5: 'Suboficial',
      6: 'Suboficial Principal',
      7: 'Suboficial Mayor',
      8: 'Oficial',
      9: 'Teniente',
      10: 'Capitán',
      11: 'Mayor',
      12: 'Teniente Coronel',
      13: 'Coronel',
      14: 'Jefe'
    }
    return rangos[rangoId] || 'Bombero'
  }

  // Función para mapear nombres de rango a IDs
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

  const soloLectura = modo === 'consulta'

  return (
    <div className="container d-flex justify-content-center align-items-center">
      <div className={`formulario-bombero ${soloLectura ? 'modo-consulta' : ''}`}>
        <h2>
          {modo === 'alta' ? 'Alta de Bombero' : modo === 'edicion' ? 'Editar Bombero' : 'Consulta de Bombero'}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* DNI - Nombre Completo */}
          <div className="row mb-3">
            <div className="col-md-4">
              <label className="form-label">DNI</label>
              <input 
                type="text" 
                className="form-control" 
                id="DNI" 
                value={formData.DNI || ''} 
                required={!soloLectura}
                onChange={handleChange} 
                disabled={soloLectura || loading || modo === 'edicion'} 
                pattern="[0-9]{7,8}"
                title="Ingrese un DNI válido (7-8 dígitos)"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Nombre</label>
              <input 
                type="text" 
                className="form-control" 
                id="nombre" 
                value={formData.nombre || ''} 
                required={!soloLectura}
                onChange={handleChange} 
                disabled={soloLectura || loading} 
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Apellido</label>
              <input 
                type="text" 
                className="form-control" 
                id="apellido" 
                value={formData.apellido || ''} 
                required={!soloLectura}
                onChange={handleChange} 
                disabled={soloLectura || loading} 
              />
            </div>
          </div>

          {/* Contacto */}
          <div className="row mb-3">
            <div className="col-md-4">
              <label className="form-label">Correo electrónico</label>
              <input 
                type="email" 
                className="form-control" 
                id="correo" 
                value={formData.correo || ''}
                onChange={handleChange} 
                disabled={soloLectura || loading} 
                required={!soloLectura}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Teléfono</label>
              <input 
                type="tel" 
                className="form-control" 
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
              <label className="form-label">Domicilio</label>
              <input 
                type="text" 
                className="form-control" 
                id="domicilio" 
                value={formData.domicilio || ''}
                onChange={handleChange} 
                disabled={soloLectura || loading} 
                required={!soloLectura}
              />
            </div>
          </div>

          {/* Información Profesional */}
          <div className="row mb-3">
            <div className="col-md-4">
              <label className="form-label">Legajo (opcional)</label>
              <input 
                type="text" 
                className="form-control" 
                id="legajo" 
                value={formData.legajo || ''}
                onChange={handleChange} 
                disabled={soloLectura || loading} 
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Antigüedad (años)</label>
              <input 
                type="number" 
                className="form-control" 
                id="antiguedad" 
                value={formData.antiguedad || 0}
                onChange={handleChange} 
                disabled={soloLectura || loading} 
                min="0" 
                max="50"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Rango</label>
              <select 
                className="form-select" 
                id="rango" 
                value={formData.rango || ''} 
                onChange={handleChange} 
                disabled={soloLectura || loading}
                required={!soloLectura}
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

          {/* Checkboxes */}
          <div className="row mb-3">
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
                <label className="form-check-label" htmlFor="esDelPlan">
                  Es del plan (guardias pagas)
                </label>
              </div>
            </div>
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
                <label className="form-check-label" htmlFor="aptoPsicologico">
                  Apto psicológico
                </label>
              </div>
            </div>
          </div>

          {/* Información Médica */}
          <div className="row mb-3">
            <div className="col-md-4">
              <label className="form-label">Grupo sanguíneo</label>
              <select 
                className="form-select" 
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
            <div className="col-md-4">
              <label className="form-label">Ficha médica (PDF)</label>
              <input 
                type="file" 
                className="form-control" 
                id="fichaMedica" 
                onChange={handleChange}
                accept="application/pdf" 
                disabled={soloLectura || loading} 
              />
              {formData.fichaMedicaArchivo && typeof formData.fichaMedicaArchivo === 'string' && (
                <small className="text-muted">Archivo actual: {formData.fichaMedicaArchivo}</small>
              )}
            </div>
            <div className="col-md-4">
              <label className="form-label">Fecha de ficha médica</label>
              <input 
                type="date" 
                className="form-control" 
                id="fechaFichaMedica" 
                value={formData.fechaFichaMedica ? formData.fechaFichaMedica.split('T')[0] : ''}
                onChange={handleChange} 
                disabled={soloLectura || loading} 
              />
            </div>
          </div>

          {/* Botones */}
          <div className="row">
            <div className="col-12">
              {!soloLectura && (
                <button type="submit" className="btn btn-danger w-100 mb-2" disabled={loading}>
                  {loading ? 'Procesando...' : modo === 'alta' ? 'Registrar Bombero' : 'Guardar Cambios'}
                </button>
              )}

              {onVolver && (
                <button 
                  type="button" 
                  className="btn btn-secondary w-100" 
                  onClick={onVolver}
                  disabled={loading}
                >
                  Volver
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FormularioBombero
