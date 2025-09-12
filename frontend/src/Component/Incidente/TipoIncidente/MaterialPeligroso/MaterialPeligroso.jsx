import { useState, useEffect, useRef } from 'react'
import Select from 'react-select'
import { API_URLS, apiRequest } from '../../../../config/api'
import DamnificadosForm from '../../../Common/Damnificado.jsx'

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
  const [setErrors] = useState({})
  const [setDamnificadosErrors] = useState([])
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    await handleFinalizar()
  }

  return (
    <div className="container-fluid py-5">
      <div className="card shadow-sm border-0 bg-white bg-opacity-1 backdrop-blur-sm">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Categoría y cantidad*/}
            <div className="row mb-3">
              <div className="col-md-6 py-4">
                <label className="form-label text-dark d-flex align-items-center gap-2">
                  <User className="text-danger" />
                  Categoría
                </label>
                <Select
                  options={categorias.map(cat => ({
                    value: String(cat.idCategoria),
                    label: cat.descripcion
                  }))}
                  value={
                    categorias
                      .map(cat => ({ value: String(cat.idCategoria), label: cat.descripcion }))
                      .find(opt => opt.value === String(formData.categoria)) || null
                  }
                  onChange={(opt) =>
                    setFormData(prev => ({ ...prev, categoria: opt ? opt.value : '' }))
                  }
                  classNamePrefix="rs"
                  placeholder="Seleccione categoría"
                  isClearable
                />
              </div>

              <div className="col-md-6 py-4">
                <label className="text-dark form-label">Cantidad de materiales involucrados</label>
                <input
                  type="number"
                  className="form-control"
                  id="cantidadMateriales"
                  value={formData.cantidadMateriales || ''}
                  onChange={handleChange}
                />
              </div>
            </div>

            <hr className="border-1 border-black mb-2" />

            {/* Tipos de materiales involucrados */}
            <h5 className="fw-bold text-dark mb-3 my-3">
              Tipos de materiales involucrados
            </h5>
            <div className="d-flex flex-wrap gap-3">
              <div>
                {tiposMaterial.map((tipo, index) => {
                  const key = `material${tipo.idTipoMatInvolucrado}`
                  const icons = ['🔥', '⚗️', '💥', '☢️', '🛢️', '🧪']
                  const selected = !!formData[key]

                  return (
                    <button
                      key={tipo.idTipoMatInvolucrado}
                      type="button"
                      className={`btn btn-lg toggle-btn me-2 mb-2 ${selected ? 'selected' : ''}`}
                      onClick={() =>
                        setFormData(prev => ({
                          ...prev,
                          [key]: !prev[key]   // ← toggle basado en el estado previo
                        }))
                      }
                    >
                      <span className="me-2">{icons[index % icons.length]}</span>
                      {tipo.nombre}
                    </button>
                  )
                })}
              </div>
            </div>


            <hr className="border-1 border-black mb-2" />

            {/* Acciones sobre el material */}
            <h5 className="fw-bold text-dark mb-3 my-3">
              Acciones sobre el material
            </h5>
            <div className="d-flex flex-wrap gap-3">
              <div>
                {accionesMaterial.map((accion, index) => {
                  const icons = ['🔥', '💨', '💧', '⚖️', '🚛']
                  const selected = formData[`accion${accion.idAccionMaterial}`]
                  return (
                    <button
                      key={accion.idAccionMaterial}
                      type="button"
                      className={`btn bnt-lg toggle-btn me-2 mb-2 ${selected ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        [`accion${accion.idAccionMaterial}`]: !selected
                      }))}
                    >
                      <span className="me-2">{icons[index % icons.length]}</span>
                      {accion.nombre}
                    </button>
                  )
                })}
              </div>

              <div className="col-md-8">
                <label className="form-label text-dark d-flex align-items-center gap-2">Otra acción sobre el material</label>
                <input
                  type="text"
                  className="form-control"
                  id="otraAccionMaterial"
                  value={formData.otraAccionMaterial || ''}
                  onChange={handleChange}
                />
              </div>
            </div>

            <hr className="border-1 border-black mb-2" />

            {/* Acciones sobre las personas */}
            <h5 className="fw-bold text-dark mb-3 my-3">
              Acciones sobre las personas
            </h5>
            <div className="d-flex flex-wrap gap-3">
              <div>
                {accionesPersona.map((accion, index) => {
                  const icons = ['🚨', '🧼', '🏠']
                  const selected = formData[`personaAccion${accion.idAccionPersona}`]
                  return (
                    <button
                      key={accion.idAccionPersona}
                      type="button"
                      className={`btn bnt-lg toggle-btn me-2 mb-2 ${selected ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        [`personaAccion${accion.idAccionPersona}`]: !selected
                      }))}
                    >
                      <span className="me-2">{icons[index % icons.length]}</span>
                      {accion.nombre}
                    </button>
                  )
                })}
              </div>

              <div className="col-md-8">
                <label className="form-label text-dark d-flex align-items-center gap-2">Otra acción sobre las personas</label>
                <input
                  type="text"
                  className="form-control"
                  id="otraAccionPersona"
                  value={formData.otraAccionPersona || ''}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Detalles */}
            <div className="mb-3">
              <label className="text-black form-label">Detalle sobre otras acciones sobre personas</label>
              <textarea
                className="form-control"
                rows="2"
                id="detalleAccionesPersona"
                value={formData.detalleAccionesPersona || ''}
                onChange={handleChange}
              ></textarea>
            </div>

            <div className="mb-3">
              <label className="text-black form-label">Cantidad de superficie evacuada</label>
              <input
                type="text"
                className="form-control"
                id="superficieEvacuada"
                value={formData.superficieEvacuada || ''}
                onChange={handleChange}
              />
            </div>

            <div className="mb-3">
              <label className="text-black form-label">Detalle de lo sucedido</label>
              <textarea
                className="form-control"
                rows="3"
                id="detalle"
                value={formData.detalle || ''}
                onChange={handleChange}
              ></textarea>
            </div>

            <hr className="border-1 border-black mb-2" />

            <DamnificadosForm
              value={formData.damnificados}
              onChange={(nuevoArray) => setFormData(prev => ({ ...prev, damnificados: nuevoArray }))}
              title="Personas damnificadas"
            />

            <div className='d-flex justify-content-center align-items-center gap-3 mb-3'>
              <button type="submit" className="btn btn-accept btn-medium btn-lg btn-sm-custom" disabled={loading}>
                {loading ? 'Cargando...' : 'Finalizar carga'}
              </button>

              <button
                type="button"
                className="btn btn-back btn-medium btn-lg btn-sm-custom"
                onClick={guardarLocalmente}
                disabled={loading}
              >
                Guardar y continuar después
              </button>
            </div>

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
    </div>
  )
}

export default MaterialPeligroso
