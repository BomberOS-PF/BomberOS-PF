import { useState, useEffect, useRef } from 'react'
import Select from 'react-select'
import { API_URLS, apiRequest } from '../../../../config/api'

const Rescate = ({ datosPrevios = {}, onFinalizar }) => {
  const incidenteId = datosPrevios.idIncidente || datosPrevios.id || 'temp'
  const storageKey = `rescate-${incidenteId}`

  const [formData, setFormData] = useState(() => {
    const guardado = localStorage.getItem(storageKey)
    const savedData = guardado
      ? JSON.parse(guardado)
      : {
        lugar: '',
        otroLugar: '',
        detalle: '',
        damnificados: []
      }

    // Mapear los nombres de campos del backend a los nombres que usa el frontend
    const datosPreviosMapeados = {
      ...datosPrevios,
      // Mapear campos específicos del rescate
      lugar: datosPrevios.lugar, // Lugar específico del rescate (dropdown)
      otroLugar: datosPrevios.otroLugar,
      detalle: datosPrevios.detalle || datosPrevios.descripcion, // Mapear descripcion del backend a detalle del frontend
      damnificados: datosPrevios.damnificados || [],
      // Mantener el lugar del incidente base por separado
      lugarIncidente: datosPrevios.descripcion // Lugar del incidente base (solo para mostrar)
    }

    // Combinar datos guardados con datos previos mapeados, dando prioridad a los datos previos
    const combined = { ...savedData, ...datosPreviosMapeados }

    return combined
  })

  const [mostrarOtroLugar, setMostrarOtroLugar] = useState(formData.lugar === 'Otro')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [errors, setErrors] = useState({})
  const [damnificadosErrors, setDamnificadosErrors] = useState([])
  const toastRef = useRef(null)

  // Información del incidente base
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
        // Mapear campos específicos del rescate
        lugar: datosPrevios.lugar,
        otroLugar: datosPrevios.otroLugar,
        detalle: datosPrevios.detalle || datosPrevios.descripcion,
        damnificados: datosPrevios.damnificados || []
      }

      setFormData(prev => ({ ...prev, ...datosMapeados }))
    }
  }, [datosPrevios])

  // Mantener en sync el toggle "Otro"
  useEffect(() => {
    setMostrarOtroLugar((formData.lugar || '') === 'Otro')
  }, [formData.lugar])

  const opcionesLugar = [
    { value: 'Arroyo', label: 'Arroyo' },
    { value: 'Lago', label: 'Lago' },
    { value: 'Bar', label: 'Bar' },
    { value: 'Montaña', label: 'Montaña' },
    { value: 'Río', label: 'Río' },
    { value: 'Restaurant-Comedor', label: 'Restaurant-Comedor' },
    { value: 'Otro', label: 'Otro' }
  ]

  // Handlers
  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleDamnificadoChange = (index, e) => {
    const { id, value, type, checked } = e.target
    const updated = [...(formData.damnificados || [])]
    updated[index] = { ...updated[index], [id]: type === 'checkbox' ? checked : value }
    setFormData(prev => ({ ...prev, damnificados: updated }))
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
    setFormData(prev => ({
      ...prev,
      damnificados: (prev.damnificados || []).filter((_, i) => i !== index)
    }))
  }

  const guardarLocalmente = () => {
    localStorage.setItem(storageKey, JSON.stringify(formData))
    alert('Datos guardados localmente. Podés continuar después.')
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

  const validate = () => {
    const newErrors = {}

    // Validar lugar (obligatorio)
    if (!formData.lugar || formData.lugar === "") {
      newErrors.lugar = 'Campo obligatorio'
    }

    // Validar "otro lugar" si se seleccionó "Otro"
    if (formData.lugar === 'Otro' && (!formData.otroLugar || formData.otroLugar.trim() === '')) {
      newErrors.otroLugar = 'Debe especificar el tipo de lugar'
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

  const handleSubmit = async () => {
    setSuccessMsg('')
    setErrorMsg('')

    if (!validate()) {
      setErrorMsg('Por favor complete los campos obligatorios y corrija los errores.');
      if (toastRef.current) toastRef.current.focus();
      return;
    }

    setLoading(true)

    try {
      // Snapshot local
      localStorage.setItem(storageKey, JSON.stringify(formData))

      const body = {
        idIncidente: incidenteId,
        lugar: formData.lugar === 'Otro' ? formData.otroLugar : formData.lugar,
        detalle: formData.detalle,
        damnificados: formData.damnificados
      }

      const esActualizacion = !!(datosPrevios.idIncidente || datosPrevios.id)
      const method = esActualizacion ? 'PUT' : 'POST'
      const url = esActualizacion ?
        API_URLS.incidentes.updateRescate :
        API_URLS.incidentes.createRescate

      const resp = await apiRequest(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!resp?.success) {
        throw new Error(resp?.message || 'Error al registrar rescate')
      }

      const mensajeExito = esActualizacion
        ? 'Rescate actualizado con éxito'
        : '✅ Rescate registrado correctamente'

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
          lugar: formData.lugar,
          otroLugar: formData.otroLugar,
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
      const mensajeError = `❌ Error al ${esActualizacion ? 'actualizar' : 'registrar'} rescate: ${error.message}`
      setErrorMsg(mensajeError)
      setSuccessMsg('')

      // Pasar el error al callback
      if (onFinalizar) {
        onFinalizar({
          success: false,
          message: mensajeError,
          error: error.message,
          esActualizacion
        })
      }
    } finally {
      setLoading(false)
      if (toastRef.current) toastRef.current.focus()
    }
  }

  return (
    <div className="container d-flex justify-content-center align-items-center">
      <div className="formulario-consistente p-4 shadow rounded">
        <h2 className="text-black text-center mb-4">Rescate</h2>

        {incidenteBasico && (
          <div className="alert alert-info mb-4">
            <h6 className="alert-heading">📋 Incidente Base Registrado</h6>
            <div className="row">
              <div className="col-md-6">
                <strong>ID:</strong> {incidenteBasico.id}<br />
                <strong>Tipo:</strong> {incidenteBasico.tipo}<br />
                <strong>Fecha:</strong> {incidenteBasico.fecha}
              </div>
              <div className="col-md-6">
                <strong>Localización:</strong> {incidenteBasico.localizacion}<br />
                <strong>Lugar:</strong> {incidenteBasico.lugar}
              </div>
            </div>
          </div>
        )}

        <form>
          <div className="mb-3">
            <label htmlFor="lugar" className="text-black form-label">Tipo de lugar específico del rescate *</label>
            <Select
              options={opcionesLugar}
              value={opcionesLugar.find(o => o.value === formData.lugar) || null}
              onChange={(opt) =>
                setFormData(prev => ({ ...prev, lugar: opt ? opt.value : '' }))
              }
              classNamePrefix="rs"
              placeholder="Seleccione lugar"
              isClearable
            />
            {errors.lugar && <div className="invalid-feedback" id="error-lugar">{errors.lugar}</div>}
          </div>

          {mostrarOtroLugar && (
            <div className="mb-3">
              <label htmlFor="otroLugar" className="text-black form-label">Describa el otro tipo de lugar *</label>
              <input
                type="text"
                className={`form-control${errors.otroLugar ? ' is-invalid' : ''}`}
                id="otroLugar"
                value={formData.otroLugar || ''}
                onChange={handleChange}
                aria-describedby="error-otroLugar"
                placeholder="Ej: Cueva, Pozo, etc."
              />
              {errors.otroLugar && <div className="invalid-feedback" id="error-otroLugar">{errors.otroLugar}</div>}
            </div>
          )}

          <div className="mb-3">
            <label htmlFor="detalle" className="text-black form-label">Detalle de lo sucedido *</label>
            <textarea
              className={`form-control${errors.detalle ? ' is-invalid' : ''}`}
              rows="3"
              id="detalle"
              value={formData.detalle || ''}
              onChange={handleChange}
              aria-describedby="error-detalle"
            ></textarea>
            {errors.detalle && <div className="invalid-feedback" id="error-detalle">{errors.detalle}</div>}
          </div>

          <h5 className="text-white mt-4">Personas damnificadas</h5>

          {(formData.damnificados || []).map((dam, index) => {
            const base = `dam-${index}`
            return (
              <div key={index} className="border rounded p-3 mb-3 bg-light-subtle">
                <div className="row mb-2">
                  <div className="col">
                    <label htmlFor={`${base}-nombre`} className="form-label text-black">Nombre</label>
                    <input type="text" className="form-control" id="nombre" value={dam.nombre || ''} onChange={(e) => handleDamnificadoChange(index, e)} />
                  </div>
                  <div className="col">
                    <label htmlFor={`${base}-apellido`} className="form-label text-black">Apellido</label>
                    <input type="text" className="form-control" id="apellido" value={dam.apellido || ''} onChange={(e) => handleDamnificadoChange(index, e)} />
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col">
                    <label htmlFor={`${base}-domicilio`} className="form-label text-black">Domicilio</label>
                    <input type="text" className="form-control" id="domicilio" value={dam.domicilio || ''} onChange={(e) => handleDamnificadoChange(index, e)} />
                  </div>
                  <div className="col">
                    <label htmlFor={`${base}-telefono`} className="form-label text-black">Teléfono</label>
                    <input type="text" className="form-control" id="telefono" value={dam.telefono || ''} onChange={(e) => handleDamnificadoChange(index, e)} />
                  </div>
                  <div className="col">
                    <label htmlFor={`${base}-dni`} className="form-label text-black">DNI</label>
                    <input type="text" className="form-control" id="dni" value={dam.dni || ''} onChange={(e) => handleDamnificadoChange(index, e)} />
                  </div>
                </div>

                <div className="form-check mb-2">
                  <input type="checkbox" className="form-check-input" id="fallecio" checked={dam.fallecio || false} onChange={(e) => handleDamnificadoChange(index, e)} />
                  <label className="form-check-label text-black" htmlFor="fallecio">¿Falleció?</label>
                </div>

                <div className="text-end">
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => eliminarDamnificado(index)}>❌ Eliminar</button>
                </div>
              </div>
            )
          })}

          <button type="button" className="btn btn-sm btn-outline-primary mb-3" onClick={agregarDamnificado}>
            ➕ Agregar damnificado
          </button>

          <button type="button" className="btn btn-danger w-100 mt-3" disabled={loading} onClick={() => handleSubmit()}>
            {loading ? 'Cargando...' : (datosPrevios.idIncidente || datosPrevios.id ? 'Actualizar rescate' : 'Finalizar carga')}
          </button>

          <button type="button" className="btn btn-secondary w-100 mt-2" onClick={guardarLocalmente} disabled={loading}>
            Guardar y continuar después
          </button>
        </form>

        {errorMsg && <div ref={toastRef} tabIndex={-1} className="alert alert-danger mt-3" role="alert">{errorMsg}</div>}
        {successMsg && <div ref={toastRef} tabIndex={-1} className="alert alert-success mt-3" role="alert">{successMsg}</div>}
      </div>
    </div>
  )
}

export default Rescate
