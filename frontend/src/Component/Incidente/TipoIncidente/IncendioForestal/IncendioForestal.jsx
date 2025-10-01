import { useState, useEffect, useRef } from 'react'
import './IncendioForestal.css'
import '../../../DisenioFormulario/DisenioFormulario.css'
import { API_URLS, apiRequest } from '../../../../config/api'

function toMySQLDatetime(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function validarTelefono(telefono) {
  if (!telefono) return true;
  const cleaned = telefono.replace(/[^0-9+]/g, '');
  const numbersOnly = cleaned.replace(/\+/g, '');
  return /^[0-9+]+$/.test(cleaned) && numbersOnly.length >= 8 && numbersOnly.length <= 15;
}
function validarDNI(dni) {
  if (!dni) return true;
  return /^\d{7,10}$/.test(dni);
}
function damnificadoVacio(d) {
  return !d.nombre && !d.apellido && !d.domicilio && !d.telefono && !d.dni && !d.fallecio;
}

const IncendioForestal = ({ datosPrevios = {}, onFinalizar }) => {
  
  const incidenteId = datosPrevios.idIncidente || datosPrevios.id || 'temp'
  const storageKey = `incendioForestal-${incidenteId}`

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem(storageKey)
    const savedData = saved ? JSON.parse(saved) : { damnificados: [] }
    
    // Mapear los nombres de campos del backend a los nombres que usa el frontend
    const datosPreviosMapeados = {
      ...datosPrevios,
      // Mapear campos específicos del incendio forestal
      caracteristicaLugar: datosPrevios.caracteristicasLugar || datosPrevios.caracteristicaLugar,
      unidadAfectada: datosPrevios.areaAfectada || datosPrevios.unidadAfectada,
      cantidadAfectada: datosPrevios.cantidadAfectada || datosPrevios.cantidad, // ¡El campo en BD es "cantidad"!
      causaProbable: datosPrevios.causaProbable || datosPrevios.idCausaProbable,
      detalle: datosPrevios.detalle,
      damnificados: datosPrevios.damnificados || []
    }
    
    // Combinar datos guardados con datos previos mapeados, dando prioridad a los datos previos
    const combined = { ...savedData, ...datosPreviosMapeados }
    
    // Asegurar que siempre haya al menos un damnificado vacío si no hay datos
    if (!combined.damnificados || combined.damnificados.length === 0) {
      combined.damnificados = [{ nombre: '', apellido: '', domicilio: '', telefono: '', dni: '', fallecio: false }]
    }
    
    return combined
  })

  // Mostrar información del incidente básico si existe
  const incidenteBasico = datosPrevios.idIncidente || datosPrevios.id ? {
    id: datosPrevios.idIncidente || datosPrevios.id,
    tipo: datosPrevios.tipoDescripcion,
    fecha: datosPrevios.fechaHora || datosPrevios.fecha,
    localizacion: datosPrevios.localizacion,
    lugar: datosPrevios.lugar || 'No especificado'
  } : null

  useEffect(() => {
    // Solo actualizar si hay nuevos datosPrevios y son diferentes
    if (datosPrevios && Object.keys(datosPrevios).length > 0) {
      // Mapear los nombres de campos del backend a los nombres que usa el frontend
      const datosMapeados = {
        ...datosPrevios,
        // Mapear campos específicos del incendio forestal
        caracteristicaLugar: datosPrevios.caracteristicasLugar || datosPrevios.caracteristicaLugar,
        unidadAfectada: datosPrevios.areaAfectada || datosPrevios.unidadAfectada,
        cantidadAfectada: datosPrevios.cantidadAfectada || datosPrevios.cantidad, // ¡El campo en BD es "cantidad"!
        causaProbable: datosPrevios.causaProbable || datosPrevios.idCausaProbable,
        detalle: datosPrevios.detalle,
        damnificados: datosPrevios.damnificados || []
      }
      
      setFormData(prev => ({ ...prev, ...datosMapeados }))
    }
  }, [datosPrevios])

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [id]: type === 'checkbox' ? checked : value }))
  }

  const guardarLocalmente = () => {
    localStorage.setItem(storageKey, JSON.stringify(formData))
    alert('Datos guardados localmente. Podés continuar después.')
  }

  // Los damnificados ahora se manejan dentro de formData, igual que en AccidenteTransito


  const handleDamnificadoChange = (index, field, value) => {
    const nuevos = [...formData.damnificados]
    nuevos[index][field] = value
    setFormData(prev => ({ ...prev, damnificados: nuevos }))
  }

  const agregarDamnificado = () => {
    setFormData(prev => ({
      ...prev,
      damnificados: [
        ...(prev.damnificados || []),
        { nombre: '', apellido: '', domicilio: '', telefono: '', dni: '', fallecio: false }
      ]
    }))
  }

  const eliminarDamnificado = (index) => {
    const nuevos = formData.damnificados.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, damnificados: nuevos }))
  }

  const [errors, setErrors] = useState({})
  const [damnificadosErrors, setDamnificadosErrors] = useState([])
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const toastRef = useRef(null)


  const [caracteristicasLugarOptions, setCaracteristicasLugarOptions] = useState([])
  const [areaAfectadaOptions, setAreaAfectadaOptions] = useState([])
  const [causasProbablesOptions, setCausasProbablesOptions] = useState([])

  useEffect(() => {
    async function fetchOptions() {
      try {
        const [resCaract, resArea, resCausas] = await Promise.all([
          apiRequest(API_URLS.caracteristicasLugar),
          apiRequest(API_URLS.areasAfectadas),
          apiRequest(API_URLS.causasProbables)
        ])
        setCaracteristicasLugarOptions(resCaract.data || [])
        setAreaAfectadaOptions(resArea.data || [])
        setCausasProbablesOptions(resCausas.data || [])
      } catch (e) {
        setErrorMsg('Error al cargar opciones de catálogo. Intente recargar la página.')
      }
    }
    fetchOptions()
  }, [])

  const validate = () => {
    const newErrors = {}
    
    if (!formData.caracteristicaLugar || formData.caracteristicaLugar === "") {
      newErrors.caracteristicaLugar = 'Campo obligatorio'
    }
    if (!formData.unidadAfectada || formData.unidadAfectada === "") {
      newErrors.unidadAfectada = 'Campo obligatorio'
    }
    if (!formData.cantidadAfectada && formData.cantidadAfectada !== 0) {
      newErrors.cantidadAfectada = 'Campo obligatorio'
    } else if (formData.cantidadAfectada < 0) {
      newErrors.cantidadAfectada = 'La cantidad no puede ser negativa'
    }
    if (!formData.detalle || formData.detalle.trim() === '') {
      newErrors.detalle = 'Campo obligatorio'
    }
    // Los damnificados NO son obligatorios, solo validar si hay alguno con datos
    const damErrors = (formData.damnificados || []).map(d => {
      if (damnificadoVacio(d)) return {};
      const e = {}
      if (!d.nombre) e.nombre = 'Campo obligatorio'
      if (!d.apellido) e.apellido = 'Campo obligatorio'
      if (d.telefono && !validarTelefono(d.telefono)) e.telefono = 'Teléfono inválido (8-15 dígitos, solo números)'
      if (d.dni && !validarDNI(d.dni)) e.dni = 'DNI inválido (7-10 dígitos, solo números)'
      return e
    })
    setErrors(newErrors)
    setDamnificadosErrors(damErrors)
    return Object.keys(newErrors).length === 0 && damErrors.every((e, i) => damnificadoVacio(formData.damnificados[i]) || Object.keys(e).length === 0)
  }

  const handleSubmit = async (e) => {
    setSuccessMsg(''); setErrorMsg('');
    
    if (!validate()) {
      setErrorMsg('Por favor complete los campos obligatorios.');
      if (toastRef.current) toastRef.current.focus();
      return;
    }
    setLoading(true);
    localStorage.setItem(storageKey, JSON.stringify(formData));
    const damnificadosFiltrados = formData.damnificados.filter(d => !damnificadoVacio(d));
    // Construir datos para el backend
    const data = {
      // Datos del incidente base (si es actualización, usar los datos previos)
      fecha: datosPrevios?.fecha || toMySQLDatetime(new Date()),
      idLocalizacion: datosPrevios?.idLocalizacion || 1,
      descripcion: datosPrevios?.descripcion || `Incendio Forestal - ${formData.caracteristicaLugar ? 'Característica: ' + caracteristicasLugarOptions.find(opt => opt.idCaractLugar == formData.caracteristicaLugar)?.descripcion : ''} - ${formData.unidadAfectada ? 'Área: ' + areaAfectadaOptions.find(opt => opt.idAreaAfectada == formData.unidadAfectada)?.descripcion : ''}`,
      
      // Datos específicos del incendio forestal (corregir nombres de campos)
      caracteristicasLugar: formData.caracteristicaLugar && formData.caracteristicaLugar !== "" ? Number(formData.caracteristicaLugar) : null,
      areaAfectada: formData.unidadAfectada && formData.unidadAfectada !== "" ? Number(formData.unidadAfectada) : null,
      cantidadAfectada: formData.cantidadAfectada ? Number(formData.cantidadAfectada) : null,
      causaProbable: formData.causaProbable && formData.causaProbable !== "" ? Number(formData.causaProbable) : null,
      detalle: formData.detalle || '',
      damnificados: damnificadosFiltrados
    };

    // Si existe un incidente previo, incluir su ID
    if (datosPrevios.idIncidente || datosPrevios.id) {
      data.idIncidente = datosPrevios.idIncidente || datosPrevios.id
    }
    
    const esActualizacion = datosPrevios.idIncidente || datosPrevios.id
    
    try {
      let response
      
      if (esActualizacion) {
        // Actualizar incidente existente
        response = await apiRequest(API_URLS.incidentes.createIncendioForestal, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
      } else {
        // Crear nuevo incidente
        response = await apiRequest(API_URLS.incidentes.createIncendioForestal, {
          method: 'POST',
          body: JSON.stringify(data)
        });
      }
      
      const mensajeExito = esActualizacion ? 
        'Incidente de incendio forestal actualizado con éxito' : 
        'Incidente de incendio forestal cargado con éxito'
      
      setSuccessMsg(mensajeExito);
      setErrorMsg('');
      
      // Solo limpiar localStorage si es una creación nueva, no en actualizaciones
      if (!esActualizacion) {
        localStorage.removeItem(storageKey);
      }
      
      // Pasar el resultado al callback
      if (onFinalizar) {
        onFinalizar({
          success: true,
          message: mensajeExito,
          data: response,
          esActualizacion
        });
      }
    } catch (error) {
      const mensajeError = 'Error al ' + (esActualizacion ? 'actualizar' : 'cargar') + ' el incidente: ' + (error.message || 'Error desconocido')
      setErrorMsg(mensajeError);
      setSuccessMsg('');
      
      // También pasar el error al callback
      if (onFinalizar) {
        onFinalizar({
          success: false,
          message: mensajeError,
          error
        });
      }
    } finally {
      setLoading(false);
      if (toastRef.current) toastRef.current.focus();
    }
  }

  return (
    <div className="container d-flex justify-content-center align-items-center">
      <div className="formulario-consistente p-4 shadow rounded">
        <h2 className="text-black text-center mb-4">Incendio Forestal</h2>
        
        {/* Información del incidente básico */}
        {incidenteBasico && (
          <div className="alert alert-info mb-4">
            <h6 className="alert-heading">📋 Incidente Base Registrado</h6>
            <div className="row">
              <div className="col-md-6">
                <strong>ID:</strong> {incidenteBasico.id}<br/>
                <strong>Tipo:</strong> {incidenteBasico.tipo}<br/>
                <strong>Fecha:</strong> {incidenteBasico.fecha}
              </div>
              <div className="col-md-6">
                <strong>Localización:</strong> {incidenteBasico.localizacion}<br/>
                <strong>Lugar:</strong> {incidenteBasico.lugar}
              </div>
            </div>
          </div>
        )}
        
        <form>
          <div className="mb-3">
            <label className="text-black form-label" htmlFor="caracteristicaLugar">Características del lugar *</label>
            <select className={`form-select${errors.caracteristicaLugar ? ' is-invalid' : ''}`} id="caracteristicaLugar" value={formData.caracteristicaLugar || ''} onChange={handleChange} aria-describedby="error-caracteristicaLugar">
              <option disabled value="">Seleccione</option>
              {caracteristicasLugarOptions.map(opt => (
                <option key={opt.idCaractLugar} value={opt.idCaractLugar}>{opt.descripcion}</option>
              ))}
            </select>
            {errors.caracteristicaLugar && <div className="invalid-feedback" id="error-caracteristicaLugar">{errors.caracteristicaLugar}</div>}
          </div>

          <div className="row mb-3">
            <div className="col">
              <label className="text-black form-label" htmlFor="unidadAfectada">Área afectada *</label>
              <select className={`form-select${errors.unidadAfectada ? ' is-invalid' : ''}`} id="unidadAfectada" value={formData.unidadAfectada || ''} onChange={handleChange} aria-describedby="error-unidadAfectada">
                <option disabled value="">Seleccione</option>
                {areaAfectadaOptions.map(opt => (
                  <option key={opt.idAreaAfectada} value={opt.idAreaAfectada}>{opt.descripcion}</option>
                ))}
              </select>
              {errors.unidadAfectada && <div className="invalid-feedback" id="error-unidadAfectada">{errors.unidadAfectada}</div>}
            </div>
            <div className="col">
              <label className="text-black form-label" htmlFor="cantidadAfectada">Cantidad (hectáreas) *</label>
              <input type="number" min="0" step="0.01" className={`form-control${errors.cantidadAfectada ? ' is-invalid' : ''}`} id="cantidadAfectada" value={formData.cantidadAfectada || ''} onChange={handleChange} aria-describedby="error-cantidadAfectada" placeholder="Ej: 15.5" />
              {errors.cantidadAfectada && <div className="invalid-feedback" id="error-cantidadAfectada">{errors.cantidadAfectada}</div>}
              <div className="form-text text-muted small">Superficie afectada (no puede ser negativa)</div>
            </div>
          </div>

          <div className="mb-3">
            <label className="text-black form-label">Causa probable</label>
            <select className="form-select" id="causaProbable" value={formData.causaProbable || ''} onChange={handleChange}>
              <option disabled value="">Seleccione</option>
              {causasProbablesOptions.map(opt => (
                <option key={opt.idCausaProbable} value={opt.idCausaProbable}>{opt.descripcion}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="text-black form-label" htmlFor="detalle">Detalle de lo sucedido *</label>
            <textarea className={`form-control${errors.detalle ? ' is-invalid' : ''}`} id="detalle" rows="3" value={formData.detalle || ''} onChange={handleChange} aria-describedby="error-detalle"></textarea>
            {errors.detalle && <div className="invalid-feedback" id="error-detalle">{errors.detalle}</div>}
          </div>

          <h5 className="text-black mt-4">Personas damnificadas</h5>
          {formData.damnificados.map((d, index) => (
            <div key={index} className="border rounded p-3 mb-3">
              <div className="row mb-2">
                <div className="col">
                  <label className="text-black form-label">Nombre {!damnificadoVacio(d) ? '*' : ''}</label>
                  <input type="text" className={`form-control${damnificadosErrors[index]?.nombre ? ' is-invalid' : ''}`} value={d.nombre} onChange={(e) => handleDamnificadoChange(index, 'nombre', e.target.value)} />
                  {damnificadosErrors[index]?.nombre && <div className="invalid-feedback">{damnificadosErrors[index].nombre}</div>}
                </div>
                <div className="col">
                  <label className="text-black form-label">Apellido {!damnificadoVacio(d) ? '*' : ''}</label>
                  <input type="text" className={`form-control${damnificadosErrors[index]?.apellido ? ' is-invalid' : ''}`} value={d.apellido} onChange={(e) => handleDamnificadoChange(index, 'apellido', e.target.value)} />
                  {damnificadosErrors[index]?.apellido && <div className="invalid-feedback">{damnificadosErrors[index].apellido}</div>}
                </div>
              </div>
              <div className="mb-2">
                <label className="text-black form-label">Domicilio</label>
                <input type="text" className="form-control" value={d.domicilio} onChange={(e) => handleDamnificadoChange(index, 'domicilio', e.target.value)} />
              </div>
              <div className="row mb-2">
                <div className="col">
                  <label className="text-black form-label">Teléfono</label>
                  <input type="tel" className={`form-control${damnificadosErrors[index]?.telefono ? ' is-invalid' : ''}`} value={d.telefono} onChange={(e) => handleDamnificadoChange(index, 'telefono', e.target.value)} />
                  {damnificadosErrors[index]?.telefono && <div className="invalid-feedback">{damnificadosErrors[index].telefono}</div>}
                </div>
                <div className="col">
                  <label className="text-black form-label">DNI</label>
                  <input type="text" className={`form-control${damnificadosErrors[index]?.dni ? ' is-invalid' : ''}`} value={d.dni} onChange={(e) => handleDamnificadoChange(index, 'dni', e.target.value)} />
                  {damnificadosErrors[index]?.dni && <div className="invalid-feedback">{damnificadosErrors[index].dni}</div>}
                </div>
              </div>
              <div className="mb-2 form-check">
                <input type="checkbox" className="form-check-input" checked={d.fallecio || false} onChange={(e) => handleDamnificadoChange(index, 'fallecio', e.target.checked)} />
                <label className="text-black form-check-label">¿Falleció?</label>
              </div>
              {formData.damnificados.length > 1 && (
                <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => eliminarDamnificado(index)}>
                  Eliminar damnificado
                </button>
              )}
            </div>
          ))}
          <button type="button" className="btn btn-outline-primary w-100 mb-3" onClick={agregarDamnificado}>
            Agregar damnificado
          </button>

          <button 
            type="button" 
            className="btn btn-danger w-100 mt-3" 
            disabled={loading}
            onClick={() => handleSubmit()}
          >
            {loading ? 'Cargando...' : (datosPrevios.idIncidente || datosPrevios.id ? 'Actualizar incendio forestal' : 'Finalizar carga')}
          </button>
          <button type="button" className="btn btn-secondary w-100 mt-2" onClick={guardarLocalmente} disabled={loading}>
            Guardar y continuar después
          </button>
        </form>
        {errorMsg && (
          <div ref={toastRef} tabIndex={-1} className="alert alert-danger" role="alert">{errorMsg}</div>
        )}
        {successMsg && (
          <div ref={toastRef} tabIndex={-1} className="alert alert-success" role="alert">{successMsg}</div>
        )}
      </div>
    </div>
  )
}

export default IncendioForestal
