import { useState, useEffect, useRef } from 'react'
import './MaterialPeligroso.css'
import '../../../DisenioFormulario/DisenioFormulario.css'
import { API_URLS, apiRequest } from '../../../../config/api'
import { Flame, AlertTriangle, FileText, User } from 'lucide-react'

const safeRead = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const MaterialPeligroso = ({ datosPrevios = {}, onFinalizar }) => {
  const incidenteId = datosPrevios.idIncidente || datosPrevios.id || 'temp'
  const storageKey = `materialPeligroso-${incidenteId}`

  const [formData, setFormData] = useState(() => {
    const savedData = safeRead(storageKey, {
      categoria: '',
      cantidadMateriales: '',
      otraAccionMaterial: '',
      otraAccionPersona: '',
      detalleAccionesPersona: '',
      superficieEvacuada: '',
      detalle: '',
      damnificados: []
    })
    
    // Mapear los nombres de campos del backend a los nombres que usa el frontend
    const datosPreviosMapeados = {
      ...datosPrevios,
      // Mapear campos específicos del material peligroso
      categoria: datosPrevios.categoria,
      cantidadMateriales: datosPrevios.cantidadMateriales || datosPrevios.cantidadMatInvolucrado,
      otraAccionMaterial: datosPrevios.otraAccionMaterial,
      otraAccionPersona: datosPrevios.otraAccionPersona,
      detalleAccionesPersona: datosPrevios.detalleAccionesPersona || datosPrevios.detalleOtrasAccionesPersona,
      superficieEvacuada: datosPrevios.superficieEvacuada || datosPrevios.cantidadSuperficieEvacuada,
      detalle: datosPrevios.detalle,
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
  const [categorias, setCategorias] = useState([])
  const [tiposMaterial, setTiposMaterial] = useState([])
  const [accionesMaterial, setAccionesMaterial] = useState([])
  const [accionesPersona, setAccionesPersona] = useState([])
  const toastRef = useRef(null)

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
        // Mapear campos específicos del material peligroso
        categoria: datosPrevios.categoria,
        cantidadMateriales: datosPrevios.cantidadMateriales || datosPrevios.cantidadMatInvolucrado,
        otraAccionMaterial: datosPrevios.otraAccionMaterial,
        otraAccionPersona: datosPrevios.otraAccionPersona,
        detalleAccionesPersona: datosPrevios.detalleAccionesPersona || datosPrevios.detalleOtrasAccionesPersona,
        superficieEvacuada: datosPrevios.superficieEvacuada || datosPrevios.cantidadSuperficieEvacuada,
        detalle: datosPrevios.detalle,
        damnificados: datosPrevios.damnificados || []
      }
      
      setFormData(prev => ({ ...prev, ...datosMapeados }))
    }
  }, [datosPrevios])

  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        const [cat, tipo, accMat, accPer] = await Promise.all([
          apiRequest(API_URLS.categoriasMaterialPeligroso),
          apiRequest(API_URLS.tiposMaterialesInvolucrados),
          apiRequest(API_URLS.accionesMaterial),
          apiRequest(API_URLS.accionesPersona)
        ])
        
        if (cat?.success) setCategorias(cat.data || [])
        if (tipo?.success) setTiposMaterial(tipo.data || [])
        if (accMat?.success) setAccionesMaterial(accMat.data || [])
        if (accPer?.success) setAccionesPersona(accPer.data || [])
      } catch (err) {
        console.error('❌ Error al cargar catálogos:', err)
      }
    }
    fetchCatalogos()
  }, [])

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      damnificados: Array.isArray(prev.damnificados) ? prev.damnificados : []
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datosPrevios?.idIncidente, datosPrevios?.id])

  useEffect(() => {
    const t = setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify(formData))
    }, 300)
    return () => clearTimeout(t)
  }, [formData, storageKey])

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [id]: type === 'checkbox' ? checked : value }))
  }

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

  const toIntOrNull = (v) => {
    const n = parseInt(v, 10)
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
    
    // Validar categoría (obligatorio)
    if (!formData.categoria || formData.categoria === "") {
      newErrors.categoria = 'Campo obligatorio'
    }
    
    // Validar cantidad de materiales (obligatorio y ≥ 1)
    if (!formData.cantidadMateriales || formData.cantidadMateriales === "") {
      newErrors.cantidadMateriales = 'Campo obligatorio'
    } else if (Number(formData.cantidadMateriales) < 1) {
      newErrors.cantidadMateriales = 'Debe ser al menos 1'
    }
    
    // Validar que haya al menos un tipo de material seleccionado
    const tieneTipos = Object.keys(formData).some(k => k.startsWith('material') && formData[k] === true)
    if (!tieneTipos) {
      newErrors.tiposMateriales = 'Debe seleccionar al menos un tipo de material'
    }
    
    // Validar detalle (obligatorio)
    if (!formData.detalle || formData.detalle.trim() === '') {
      newErrors.detalle = 'Campo obligatorio'
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

  const buildDto = () => ({
    idIncidente: Number(incidenteBasico?.id) || Number(incidenteId),
    categoria: toIntOrNull(formData.categoria),
    cantidadMateriales: toIntOrNull(formData.cantidadMateriales) ?? 0,
    otraAccionMaterial: formData.otraAccionMaterial?.trim() || null,
    otraAccionPersona: formData.otraAccionPersona?.trim() || null,
    detalleOtrasAccionesPersona: formData.detalleAccionesPersona?.trim() || null,
    cantidadSuperficieEvacuada: formData.superficieEvacuada?.toString().trim() || null,
    detalle: formData.detalle?.trim() || null,
    tiposMateriales: Object.keys(formData)
      .filter((k) => k.startsWith('material') && formData[k] === true)
      .map((k) => parseInt(k.replace('material', ''), 10)),
    accionesMaterial: Object.keys(formData)
      .filter((k) => k.startsWith('accion') && formData[k] === true)
      .map((k) => parseInt(k.replace('accion', ''), 10)),
    accionesPersona: Object.keys(formData)
      .filter((k) => k.startsWith('personaAccion') && formData[k] === true)
      .map((k) => parseInt(k.replace('personaAccion', ''), 10)),
    damnificados: (formData.damnificados || []).map(d => ({
      nombre: d.nombre?.trim() || null,
      apellido: d.apellido?.trim() || null,
      domicilio: d.domicilio?.trim() || null,
      telefono: d.telefono?.trim() || null,
      dni: d.dni?.trim() || null,
      fallecio: !!d.fallecio
    }))
  })

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
      localStorage.setItem(storageKey, JSON.stringify(formData))

      const payload = buildDto()
      
      const esActualizacion = !!(datosPrevios.idIncidente || datosPrevios.id)
      const method = esActualizacion ? 'PUT' : 'POST'
      const url = esActualizacion ? 
        API_URLS.incidentes.updateMaterialPeligroso : 
        (API_URLS.materialesPeligrosos?.create || API_URLS.incidentes?.createMaterialPeligroso)

      const resp = await apiRequest(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!resp?.success) {
        throw new Error(resp?.message || 'Error al registrar material peligroso')
      }

      const mensajeExito = esActualizacion
        ? 'Material peligroso actualizado con éxito'
        : '✅ Material peligroso registrado correctamente'
      
      setSuccessMsg(mensajeExito)
      setErrorMsg('')
      
      // Solo limpiar localStorage en creaciones, no en actualizaciones
      if (!esActualizacion) {
        localStorage.removeItem(storageKey)
      }
      
      // Actualizar el estado local con los datos guardados para evitar problemas de timing
      if (esActualizacion) {
        setFormData(prev => ({
          ...prev,
          categoria: formData.categoria,
          cantidadMateriales: formData.cantidadMateriales,
          otraAccionMaterial: formData.otraAccionMaterial,
          otraAccionPersona: formData.otraAccionPersona,
          detalleAccionesPersona: formData.detalleAccionesPersona,
          superficieEvacuada: formData.superficieEvacuada,
          detalle: formData.detalle,
          damnificados: formData.damnificados
        }))
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
      const mensajeError = `❌ Error al registrar material peligroso: ${error.message}`
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
      <div className="formulario-consistente">
        <h2 className="text-black text-center mb-4">Material Peligroso</h2>
        
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
          {/* Categoría y cantidad - en una sola fila como AccidenteTransito */}
          <div className="row mb-3">
            <div className="col-md-6">
              <label htmlFor="categoria" className="text-black form-label">Categoría *</label>
              <select
                className={`form-select${errors.categoria ? ' is-invalid' : ''}`}
                id="categoria"
                onChange={handleChange}
                value={formData.categoria || ''}
                aria-describedby="error-categoria"
              >
                <option disabled value="">Seleccione categoría</option>
                {categorias.map(cat => (
                  <option key={cat.idCategoria} value={cat.idCategoria}>
                    {cat.descripcion}
                  </option>
                ))}
              </select>
              {errors.categoria && <div className="invalid-feedback" id="error-categoria">{errors.categoria}</div>}
            </div>
            
            <div className="col-md-6">
              <label htmlFor="cantidadMateriales" className="text-black form-label">Cantidad de materiales involucrados *</label>
              <input
                type="number"
                min="1"
                className={`form-control${errors.cantidadMateriales ? ' is-invalid' : ''}`}
                id="cantidadMateriales"
                value={formData.cantidadMateriales || ''}
                onChange={handleChange}
                aria-describedby="error-cantidadMateriales"
                placeholder="Ej: 3"
              />
              {errors.cantidadMateriales && <div className="invalid-feedback" id="error-cantidadMateriales">{errors.cantidadMateriales}</div>}
              <div className="form-text text-muted small">Debe ser al menos 1</div>
            </div>
          </div>

          {/* Tipos de materiales involucrados */}
          <div className="mb-3">
            <label className="text-black form-label">Tipos de materiales involucrados</label>
            {errors.tiposMateriales && (
              <div className="alert alert-danger" role="alert">
                {errors.tiposMateriales}
              </div>
            )}
            <div className="row">
              {tiposMaterial.map((tipo) => (
                <div key={tipo.idTipoMatInvolucrado} className="col-md-6 mb-2">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`material${tipo.idTipoMatInvolucrado}`}
                      checked={!!formData[`material${tipo.idTipoMatInvolucrado}`]}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        [`material${tipo.idTipoMatInvolucrado}`]: e.target.checked
                      }))}
                    />
                    <label className="form-check-label text-black" htmlFor={`material${tipo.idTipoMatInvolucrado}`}>
                      {tipo.nombre}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Acciones sobre el material */}
          <div className="mb-3">
            <label className="text-black form-label">Acciones sobre el material</label>
            <div className="row">
              {accionesMaterial.map((accion) => (
                <div key={accion.idAccionMaterial} className="col-md-6 mb-2">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`accion${accion.idAccionMaterial}`}
                      checked={!!formData[`accion${accion.idAccionMaterial}`]}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        [`accion${accion.idAccionMaterial}`]: e.target.checked
                      }))}
                    />
                    <label className="form-check-label text-black" htmlFor={`accion${accion.idAccionMaterial}`}>
                      {accion.nombre}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mb-3">
            <label className="text-black form-label">Otra acción sobre el material</label>
            <input
              type="text"
              className="form-control"
              id="otraAccionMaterial"
              value={formData.otraAccionMaterial || ''}
              onChange={handleChange}
              placeholder="Especifique otra acción realizada..."
            />
          </div>

          {/* Acciones sobre las personas */}
          <div className="mb-3">
            <label className="text-black form-label">Acciones sobre las personas</label>
            <div className="row">
              {accionesPersona.map((accion) => (
                <div key={accion.idAccionPersona} className="col-md-6 mb-2">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`personaAccion${accion.idAccionPersona}`}
                      checked={!!formData[`personaAccion${accion.idAccionPersona}`]}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        [`personaAccion${accion.idAccionPersona}`]: e.target.checked
                      }))}
                    />
                    <label className="form-check-label text-black" htmlFor={`personaAccion${accion.idAccionPersona}`}>
                      {accion.nombre}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="text-black form-label">Otra acción sobre las personas</label>
              <input
                type="text"
                className="form-control"
                id="otraAccionPersona"
                value={formData.otraAccionPersona || ''}
                onChange={handleChange}
                placeholder="Especifique otra acción..."
              />
            </div>
            
            <div className="col-md-6">
              <label className="text-black form-label">Cantidad de superficie evacuada</label>
              <input
                type="text"
                className="form-control"
                id="superficieEvacuada"
                value={formData.superficieEvacuada || ''}
                onChange={handleChange}
                placeholder="Ej: 500 m²"
              />
            </div>
          </div>
          
          <div className="mb-3">
            <label className="text-black form-label">Detalle sobre otras acciones sobre personas</label>
            <textarea
              className="form-control"
              rows="2"
              id="detalleAccionesPersona"
              value={formData.detalleAccionesPersona || ''}
              onChange={handleChange}
              placeholder="Describa en detalle las acciones realizadas sobre las personas..."
            />
          </div>

          <div className="mb-3">
            <label className="text-black form-label">Detalle de lo sucedido *</label>
            <textarea
              className={`form-control${errors.detalle ? ' is-invalid' : ''}`}
              rows="3"
              id="detalle"
              value={formData.detalle || ''}
              onChange={handleChange}
              aria-describedby="error-detalle"
              placeholder="Describa detalladamente lo sucedido con el material peligroso..."
            />
            {errors.detalle && <div className="invalid-feedback" id="error-detalle">{errors.detalle}</div>}
          </div>

          <h5 className="text-black mt-4">Personas damnificadas</h5>
          {formData.damnificados.map((d, index) => (
            <div key={index} className="border rounded p-3 mb-3">
              <div className="row mb-2">
                <div className="col">
                  <label className="text-black form-label">Nombre</label>
                  <input
                    type="text"
                    className="form-control"
                    value={d.nombre || ''}
                    onChange={(e) => handleDamnificadoChange(index, 'nombre', e.target.value)}
                  />
                </div>
                <div className="col">
                  <label className="text-black form-label">Apellido</label>
                  <input
                    type="text"
                    className="form-control"
                    value={d.apellido || ''}
                    onChange={(e) => handleDamnificadoChange(index, 'apellido', e.target.value)}
                  />
                </div>
              </div>
              <div className="mb-2">
                <label className="text-black form-label">Domicilio</label>
                <input
                  type="text"
                  className="form-control"
                  value={d.domicilio || ''}
                  onChange={(e) => handleDamnificadoChange(index, 'domicilio', e.target.value)}
                />
              </div>
              <div className="row mb-2">
                <div className="col">
                  <label className="text-black form-label">Teléfono</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={d.telefono || ''}
                    onChange={(e) => handleDamnificadoChange(index, 'telefono', e.target.value)}
                  />
                </div>
                <div className="col">
                  <label className="text-black form-label">DNI</label>
                  <input
                    type="text"
                    className="form-control"
                    value={d.dni || ''}
                    onChange={(e) => handleDamnificadoChange(index, 'dni', e.target.value)}
                  />
                </div>
              </div>
              <div className="form-check mb-2">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={!!d.fallecio}
                  onChange={(e) => handleDamnificadoChange(index, 'fallecio', e.target.checked)}
                />
                <label className="form-check-label text-black">¿Falleció?</label>
              </div>
              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                onClick={() => eliminarDamnificado(index)}
              >
                ❌ Eliminar damnificado
              </button>
            </div>
          ))}

          <div className="d-flex justify-content-end mb-3">
            <button type="button" className="btn btn-sm btn-success" onClick={agregarDamnificado}>
              + Agregar damnificado
            </button>
          </div>

          <button type="button" className="btn btn-danger w-100 mt-3" disabled={loading} onClick={() => handleFinalizar()}>
            {loading ? 'Cargando...' : (datosPrevios.idIncidente || datosPrevios.id ? 'Actualizar material peligroso' : 'Finalizar carga')}
          </button>

          <button
            type="button"
            className="btn btn-secondary w-100 mt-2"
            onClick={guardarLocalmente}
            disabled={loading}
          >
            Guardar y continuar después
          </button>
        </form>

        {errorMsg && (
          <div ref={toastRef} tabIndex={-1} className="alert alert-danger mt-3" role="alert">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div ref={toastRef} tabIndex={-1} className="alert alert-success mt-3" role="alert">
            {successMsg}
          </div>
        )}
      </div>
    </div>
  )
}

export default MaterialPeligroso
