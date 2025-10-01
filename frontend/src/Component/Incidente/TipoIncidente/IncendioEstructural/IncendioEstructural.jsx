import { useState, useEffect, useRef } from 'react'
import './IncendioEstructural.css'
import '../../../DisenioFormulario/DisenioFormulario.css'
import { API_URLS, apiRequest } from '../../../../config/api'

const safeRead = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const IncendioEstructural = ({ datosPrevios = {}, onFinalizar }) => {
  const incidenteId = datosPrevios.idIncidente || datosPrevios.id || 'temp'
  const storageKey = `incendioEstructural-${incidenteId}`

  const [formData, setFormData] = useState(() => {
    const savedData = safeRead(storageKey, {
      nombreLugar: '',
      pisos: '',
      ambientes: '',
      tipoTecho: '',
      tipoAbertura: '',
      superficie: '',
      descripcion: '',
      damnificados: []
    })
    
    // Mapear los nombres de campos del backend a los nombres que usa el frontend
    const datosPreviosMapeados = {
      ...datosPrevios,
      // Mapear campos específicos del incendio estructural
      nombreLugar: datosPrevios.nombreLugar,
      pisos: datosPrevios.pisos || datosPrevios.cantPisos,
      ambientes: datosPrevios.ambientes || datosPrevios.cantAmbientes,
      tipoTecho: datosPrevios.tipoTecho,
      tipoAbertura: datosPrevios.tipoAbertura,
      superficie: datosPrevios.superficie,
      descripcion: datosPrevios.descripcion, // Campo específico del incendio estructural
      damnificados: datosPrevios.damnificados || []
    }
    
    // Combinar datos guardados con datos previos mapeados, dando prioridad a los datos previos
    const combined = { ...savedData, ...datosPreviosMapeados }
    
    return combined
  })

  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [errors, setErrors] = useState({})
  const [damnificadosErrors, setDamnificadosErrors] = useState([])
  const toastRef = useRef(null)

  // Info del incidente base (solo display)
  const incidenteBasico = datosPrevios.idIncidente || datosPrevios.id
    ? {
        id: datosPrevios.idIncidente || datosPrevios.id,
        tipo: datosPrevios.tipoDescripcion,
        fecha: datosPrevios.fechaHora || datosPrevios.fecha,
        localizacion: datosPrevios.localizacion,
        lugar: datosPrevios.lugar || 'No especificado'
      }
    : null

  useEffect(() => {
    // Solo actualizar si hay nuevos datosPrevios y son diferentes
    if (datosPrevios && Object.keys(datosPrevios).length > 0) {
      // Mapear los nombres de campos del backend a los nombres que usa el frontend
      const datosMapeados = {
        ...datosPrevios,
        // Mapear campos específicos del incendio estructural
        nombreLugar: datosPrevios.nombreLugar,
        pisos: datosPrevios.pisos || datosPrevios.cantPisos,
        ambientes: datosPrevios.ambientes || datosPrevios.cantAmbientes,
        tipoTecho: datosPrevios.tipoTecho,
        tipoAbertura: datosPrevios.tipoAbertura,
        superficie: datosPrevios.superficie,
        descripcion: datosPrevios.descripcion, // Campo específico del incendio estructural
        damnificados: datosPrevios.damnificados || []
      }
      
      setFormData(prev => ({ ...prev, ...datosMapeados }))
    }
  }, [datosPrevios])

  // Autosave con debounce
  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify(formData))
    }, 300)
    return () => clearTimeout(t)
  }, [formData, storageKey])

  // Handlers de inputs
  const handleChange = (e) => {
    const { id, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [id]: type === 'checkbox' ? checked : value }))
  }

  const handleSelectChange = (e) => {
    handleChange(e)
  }

  // ---------- DAMNIFICADOS ----------
  const handleDamnificadoChange = (index, field, value) => {
    setFormData(prev => {
      const nuevos = [...prev.damnificados]
      nuevos[index] = { ...nuevos[index], [field]: value }
      return { ...prev, damnificados: nuevos }
    })
  }

  const agregarDamnificado = () => {
    setFormData(prev => ({
      ...prev,
      damnificados: [
        ...prev.damnificados,
        { nombre: '', apellido: '', domicilio: '', telefono: '', dni: '', fallecio: false }
      ]
    }))
  }

  const eliminarDamnificado = (index) => {
    setFormData(prev => ({
      ...prev,
      damnificados: prev.damnificados.filter((_, i) => i !== index)
    }))
  }

  const guardarLocalmente = () => {
    localStorage.setItem(storageKey, JSON.stringify(formData))
    alert('Datos guardados localmente. Podés continuar después.')
  }

  const toNumberOrNull = v => {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }

  // Funciones de validación
  const validarTelefono = (telefono) => {
    if (!telefono) return true;
    const cleaned = telefono.replace(/[^0-9+]/g, '');
    const numbersOnly = cleaned.replace(/\+/g, '');
    return /^[0-9+]+$/.test(cleaned) && numbersOnly.length >= 8 && numbersOnly.length <= 15;
  }

  const validarDNI = (dni) => {
    if (!dni) return true;
    return /^\d{7,10}$/.test(dni);
  }

  const damnificadoVacio = (d) => {
    return !d.nombre && !d.apellido && !d.domicilio && !d.telefono && !d.dni && !d.fallecio;
  }

  const isValid = () => {
    const newErrors = {}
    
    // Validar tipo de techo (obligatorio)
    if (!formData.tipoTecho || formData.tipoTecho === "") {
      newErrors.tipoTecho = 'Campo obligatorio'
    }
    
    // Validar tipo de abertura (obligatorio)
    if (!formData.tipoAbertura || formData.tipoAbertura === "") {
      newErrors.tipoAbertura = 'Campo obligatorio'
    }
    
    // Validar pisos (no negativo si se proporciona)
    if (formData.pisos && formData.pisos < 0) {
      newErrors.pisos = 'La cantidad no puede ser negativa'
    }
    
    // Validar ambientes (no negativo si se proporciona)
    if (formData.ambientes && formData.ambientes < 0) {
      newErrors.ambientes = 'La cantidad no puede ser negativa'
    }
    
    // Validar superficie (no negativa si se proporciona)
    if (formData.superficie && formData.superficie < 0) {
      newErrors.superficie = 'La superficie no puede ser negativa'
    }
    
    // Validar descripción (obligatorio)
    if (!formData.descripcion || formData.descripcion.trim() === '') {
      newErrors.descripcion = 'Campo obligatorio'
    }
    
    // Validar damnificados (solo si tienen datos)
    const damErrors = (formData.damnificados || []).map(d => {
      if (damnificadoVacio(d)) return {};
      const e = {}
      if (!d.nombre) e.nombre = 'Campo obligatorio'
      if (!d.apellido) e.apellido = 'Campo obligatorio'
      if (d.telefono && !validarTelefono(d.telefono)) e.telefono = 'Teléfono inválido (8-15 dígitos)'
      if (d.dni && !validarDNI(d.dni)) e.dni = 'DNI inválido (7-10 dígitos)'
      return e
    })
    
    setErrors(newErrors)
    setDamnificadosErrors(damErrors)
    return Object.keys(newErrors).length === 0 && damErrors.every((e, i) => damnificadoVacio(formData.damnificados[i]) || Object.keys(e).length === 0)
  }

  const handleFinalizar = async () => {
    setSuccessMsg('')
    setErrorMsg('')
    
    if (!isValid()) {
      setErrorMsg('Por favor complete los campos obligatorios y corrija los errores.');
      if (toastRef.current) toastRef.current.focus();
      return;
    }
    
    setLoading(true)

    try {
      // Snapshot local por las dudas
      localStorage.setItem(storageKey, JSON.stringify(formData))

      const payload = {
        idIncidente: incidenteId,
        tipoTecho: toNumberOrNull(formData.tipoTecho),
        tipoAbertura: toNumberOrNull(formData.tipoAbertura),
        descripcion: formData.descripcion?.trim() || null,
        superficie: toNumberOrNull(formData.superficie),
        cantPisos: toNumberOrNull(formData.pisos),
        cantAmbientes: toNumberOrNull(formData.ambientes),
        nombreLugar: formData.nombreLugar?.trim() || null,
        damnificados: (formData.damnificados || []).map(d => ({
          nombre: d.nombre?.trim() || null,
          apellido: d.apellido?.trim() || null,
          domicilio: d.domicilio?.trim() || null,
          telefono: d.telefono?.trim() || null,
          dni: d.dni?.trim() || null,
          fallecio: !!d.fallecio,
          idIncidente: incidenteId
        }))
      }

      console.log('🔍 FRONTEND - formData completo:', JSON.stringify(formData, null, 2))
      console.log('🔍 FRONTEND - payload a enviar:', JSON.stringify(payload, null, 2))

      if (!isValid()) {
        throw new Error('Revisá los campos obligatorios y formatos')
      }

      const esActualizacion = !!(datosPrevios.idIncidente || datosPrevios.id)
      const method = esActualizacion ? 'PUT' : 'POST'
      const url = esActualizacion ? 
        API_URLS.incidentes.updateIncendioEstructural : 
        API_URLS.incidentes.createIncendioEstructural

      const resp = await apiRequest(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      // apiRequest devuelve JSON parseado
      if (!resp?.success) {
        throw new Error(resp?.message || 'Error al registrar incendio estructural')
      }

      const mensajeExito = esActualizacion
        ? 'Incendio estructural actualizado con éxito'
        : '✅ Incendio estructural registrado correctamente'
      
      setSuccessMsg(mensajeExito)
      setErrorMsg('')
      
      // Solo limpiar localStorage en creaciones, no en actualizaciones
      if (!esActualizacion) {
        localStorage.removeItem(storageKey)
      }
      
      // Pasar el resultado al callback
      if (onFinalizar) {
        onFinalizar({
          success: true,
          message: mensajeExito,
          data: resp,
          esActualizacion
        })
      }
    } catch (error) {
      const mensajeError = `❌ Error al registrar incendio estructural: ${error.message}`
      setErrorMsg(mensajeError)
      setSuccessMsg('')
      
      // También pasar el error al callback
      if (onFinalizar) {
        onFinalizar({
          success: false,
          message: mensajeError,
          error
        })
      }
    } finally {
      setLoading(false)
      toastRef.current?.focus()
    }
  }

  return (
    <div className="container d-flex justify-content-center align-items-center">
      <div className="formulario-consistente p-4 shadow rounded">
        <h2 className="text-black text-center mb-4">Incendio Estructural</h2>

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
            <label htmlFor="nombreLugar" className="text-black form-label">Nombre del comercio/casa de familia</label>
            <input type="text" className="form-control" id="nombreLugar" value={formData.nombreLugar || ''} onChange={handleChange} />
          </div>

          <div className="row mb-3">
            <div className="col">
              <label htmlFor="pisos" className="text-black form-label">Cantidad de pisos afectados</label>
              <input type="number" min="0" className={`form-control${errors.pisos ? ' is-invalid' : ''}`} id="pisos" value={formData.pisos || ''} onChange={handleChange} aria-describedby="error-pisos" placeholder="Ej: 2" />
              {errors.pisos && <div className="invalid-feedback" id="error-pisos">{errors.pisos}</div>}
            </div>
            <div className="col">
              <label htmlFor="ambientes" className="text-black form-label">Cantidad de ambientes afectados</label>
              <input type="number" min="0" className={`form-control${errors.ambientes ? ' is-invalid' : ''}`} id="ambientes" value={formData.ambientes || ''} onChange={handleChange} aria-describedby="error-ambientes" placeholder="Ej: 5" />
              {errors.ambientes && <div className="invalid-feedback" id="error-ambientes">{errors.ambientes}</div>}
            </div>
          </div>

          <div className="row mb-3">
            <div className="col">
              <label htmlFor="tipoTecho" className="text-black form-label">Tipo de techo *</label>
              <select className={`form-select${errors.tipoTecho ? ' is-invalid' : ''}`} id="tipoTecho" value={formData.tipoTecho || ''} onChange={handleSelectChange} aria-describedby="error-tipoTecho">
                <option disabled value="">Seleccione</option>
                <option value="1">Chapa aislada</option>
                <option value="2">Chapa metálica</option>
                <option value="3">Madera/paja</option>
                <option value="4">Teja</option>
                <option value="5">Yeso</option>
              </select>
              {errors.tipoTecho && <div className="invalid-feedback" id="error-tipoTecho">{errors.tipoTecho}</div>}
            </div>
            <div className="col">
              <label htmlFor="tipoAbertura" className="text-black form-label">Tipo de abertura *</label>
              <select className={`form-select${errors.tipoAbertura ? ' is-invalid' : ''}`} id="tipoAbertura" value={formData.tipoAbertura || ''} onChange={handleSelectChange} aria-describedby="error-tipoAbertura">
                <option disabled value="">Seleccione</option>
                <option value="1">Acero/Hierro</option>
                <option value="2">Aluminio</option>
                <option value="3">Madera</option>
                <option value="4">Plástico</option>
              </select>
              {errors.tipoAbertura && <div className="invalid-feedback" id="error-tipoAbertura">{errors.tipoAbertura}</div>}
            </div>
            <div className="col">
              <label htmlFor="superficie" className="text-black form-label">Superficie afectada (m²)</label>
              <input type="number" min="0" step="0.01" className={`form-control${errors.superficie ? ' is-invalid' : ''}`} id="superficie" value={formData.superficie || ''} onChange={handleChange} aria-describedby="error-superficie" placeholder="Ej: 150.5" />
              {errors.superficie && <div className="invalid-feedback" id="error-superficie">{errors.superficie}</div>}
              <div className="form-text text-muted small">Área en metros cuadrados (no puede ser negativa)</div>
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="descripcion" className="text-black form-label">Detalle de lo sucedido *</label>
            <textarea className={`form-control${errors.descripcion ? ' is-invalid' : ''}`} rows="3" id="descripcion" value={formData.descripcion || ''} onChange={handleChange} aria-describedby="error-descripcion"></textarea>
            {errors.descripcion && <div className="invalid-feedback" id="error-descripcion">{errors.descripcion}</div>}
          </div>

          <h5 className="text-white mt-4">Personas damnificadas</h5>
          {formData.damnificados.map((d, index) => {
            const base = `dam-${index}`
            return (
              <div key={index} className="border rounded p-3 mb-3">
                <div className="row mb-2">
                  <div className="col">
                    <label htmlFor={`${base}-nombre`} className="text-black form-label">Nombre {!damnificadoVacio(d) ? '*' : ''}</label>
                    <input id={`${base}-nombre`} type="text" className={`form-control${damnificadosErrors[index]?.nombre ? ' is-invalid' : ''}`} value={d.nombre} onChange={(e) => handleDamnificadoChange(index, 'nombre', e.target.value)} />
                    {damnificadosErrors[index]?.nombre && <div className="invalid-feedback">{damnificadosErrors[index].nombre}</div>}
                  </div>
                  <div className="col">
                    <label htmlFor={`${base}-apellido`} className="text-black form-label">Apellido {!damnificadoVacio(d) ? '*' : ''}</label>
                    <input id={`${base}-apellido`} type="text" className={`form-control${damnificadosErrors[index]?.apellido ? ' is-invalid' : ''}`} value={d.apellido} onChange={(e) => handleDamnificadoChange(index, 'apellido', e.target.value)} />
                    {damnificadosErrors[index]?.apellido && <div className="invalid-feedback">{damnificadosErrors[index].apellido}</div>}
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col">
                    <label htmlFor={`${base}-dom`} className="text-black form-label">Domicilio</label>
                    <input id={`${base}-dom`} type="text" className="form-control" value={d.domicilio} onChange={(e) => handleDamnificadoChange(index, 'domicilio', e.target.value)} />
                  </div>
                  <div className="col">
                    <label htmlFor={`${base}-tel`} className="text-black form-label">Teléfono</label>
                    <input id={`${base}-tel`} type="text" className="form-control" value={d.telefono} onChange={(e) => handleDamnificadoChange(index, 'telefono', e.target.value)} />
                  </div>
                  <div className="col">
                    <label htmlFor={`${base}-dni`} className="text-black form-label">DNI</label>
                    <input id={`${base}-dni`} type="text" className="form-control" value={d.dni} onChange={(e) => handleDamnificadoChange(index, 'dni', e.target.value)} />
                  </div>
                </div>

                <div className="form-check">
                  <input id={`${base}-fall`} type="checkbox" className="form-check-input" checked={d.fallecio} onChange={(e) => handleDamnificadoChange(index, 'fallecio', e.target.checked)} />
                  <label htmlFor={`${base}-fall`} className="text-black form-check-label">¿Falleció?</label>
                </div>

                <button type="button" className="btn btn-outline-danger btn-sm mt-2" onClick={() => eliminarDamnificado(index)}>❌ Eliminar damnificado</button>
              </div>
            )
          })}

          <button type="button" className="btn btn-outline-primary w-100 mb-3" onClick={agregarDamnificado}>
            ➕ Agregar damnificado
          </button>

          <button type="button" className="btn btn-danger w-100 mt-3" disabled={loading} onClick={() => handleFinalizar()}>
            {loading ? 'Enviando...' : (datosPrevios.idIncidente || datosPrevios.id ? 'Actualizar incendio estructural' : 'Finalizar carga')}
          </button>
          <button type="button" className="btn btn-secondary w-100 mt-2" onClick={guardarLocalmente} disabled={loading}>
            Guardar y continuar después
          </button>
        </form>

        {errorMsg && (
          <div ref={toastRef} tabIndex={-1} className="alert alert-danger mt-3" role="alert">{errorMsg}</div>
        )}
        {successMsg && (
          <div ref={toastRef} tabIndex={-1} className="alert alert-success mt-3" role="alert">{successMsg}</div>
        )}
      </div>
    </div>
  )
}

export default IncendioEstructural
