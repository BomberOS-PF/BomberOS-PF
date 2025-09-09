import { useState, useEffect, useRef } from 'react'
import './FactorClimatico.css'
import '../../../DisenioFormulario/DisenioFormulario.css'
import { API_URLS, apiRequest } from '../../../../config/api'

const FactorClimatico = ({ datosPrevios = {}, onFinalizar }) => {
  const incidenteId = datosPrevios.idIncidente || datosPrevios.id || 'temp'
  const storageKey = `factorClimatico-${incidenteId}`

  const [formData, setFormData] = useState(() => {
    const guardado = localStorage.getItem(storageKey)
    const savedData = guardado
      ? JSON.parse(guardado)
      : {
          superficie: '',
          personasEvacuadas: '',
          detalle: '',
          damnificados: []
        }
    
    // Mapear los nombres de campos del backend a los nombres que usa el frontend
    const datosPreviosMapeados = {
      ...datosPrevios,
      // Mapear campos específicos del factor climático
      superficie: datosPrevios.superficie,
      personasEvacuadas: datosPrevios.personasEvacuadas || datosPrevios.cantidadPersonasAfectadas,
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
        // Mapear campos específicos del factor climático
        superficie: datosPrevios.superficie,
        personasEvacuadas: datosPrevios.personasEvacuadas || datosPrevios.cantidadPersonasAfectadas,
        detalle: datosPrevios.detalle,
        damnificados: datosPrevios.damnificados || []
      }
      
      setFormData(prev => ({ ...prev, ...datosMapeados }))
    }
  }, [datosPrevios])

  // Campos normales
  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
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
    
    // Validar superficie evacuada (obligatorio)
    if (!formData.superficie || formData.superficie === "") {
      newErrors.superficie = 'Campo obligatorio'
    }
    
    // Validar personas evacuadas (obligatorio y no negativo)
    if (!formData.personasEvacuadas && formData.personasEvacuadas !== 0) {
      newErrors.personasEvacuadas = 'Campo obligatorio'
    } else if (formData.personasEvacuadas < 0) {
      newErrors.personasEvacuadas = 'La cantidad no puede ser negativa'
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

  const handleFinalizar = async () => {
    setSuccessMsg('')
    setErrorMsg('')
    
    if (!validate()) {
      setErrorMsg('Por favor complete los campos obligatorios.');
      if (toastRef.current) toastRef.current.focus();
      return;
    }
    
    setLoading(true)

    try {
      localStorage.setItem(storageKey, JSON.stringify(formData))

      const payload = {
        idIncidente: incidenteId,
        superficie: formData.superficie,
        personasEvacuadas: formData.personasEvacuadas,
        detalle: formData.detalle,
        damnificados: formData.damnificados
      }


      const esActualizacion = !!(datosPrevios.idIncidente || datosPrevios.id)
      const method = esActualizacion ? 'PUT' : 'POST'
      const url = esActualizacion ? 
        API_URLS.incidentes.updateFactorClimatico : 
        API_URLS.incidentes.createFactorClimatico

      const resp = await apiRequest(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

    if (!resp?.success) {
      throw new Error(resp?.message || 'Error al registrar factor climático')
    }

    const mensajeExito = esActualizacion
      ? 'Factor climático actualizado con éxito'
      : '✅ Factor climático registrado correctamente'
    
    setSuccessMsg(mensajeExito)
    
    // Solo limpiar localStorage en creaciones, no en actualizaciones
    if (!esActualizacion) {
      localStorage.removeItem(storageKey)
    }
    
    // Actualizar el estado local con los datos guardados para evitar problemas de timing
    if (esActualizacion) {
      setFormData(prev => ({
        ...prev,
        superficie: formData.superficie,
        personasEvacuadas: formData.personasEvacuadas,
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
      const mensajeError = `❌ Error al registrar factor climático: ${error.message}`
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
      if (toastRef.current) toastRef.current.focus()
    }
  }

  return (
    <div className="container d-flex justify-content-center align-items-center">
      <div className="formulario-consistente p-4 shadow rounded">
        <h2 className="text-black text-center mb-4">Factores Climáticos</h2>

        {/* Información del incidente básico */}
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
          {/* Superficie y personas evacuadas */}
          <div className="row mb-3">
            <div className="col">
              <label htmlFor="superficie" className="text-black form-label">
                Superficie evacuada *
              </label>
              <select
                className={`form-select${errors.superficie ? ' is-invalid' : ''}`}
                id="superficie"
                value={formData.superficie || ''}
                onChange={handleChange}
                aria-describedby="error-superficie"
              >
                <option disabled value="">Seleccione</option>
                <option>Menos de 100 m²</option>
                <option>100 - 500 m²</option>
                <option>500 - 1000 m²</option>
                <option>Más de 1000 m²</option>
              </select>
              {errors.superficie && <div className="invalid-feedback" id="error-superficie">{errors.superficie}</div>}
            </div>
            <div className="col">
              <label htmlFor="personasEvacuadas" className="text-black form-label">
                Cantidad de personas evacuadas *
              </label>
              <input
                type="number"
                min="0"
                className={`form-control${errors.personasEvacuadas ? ' is-invalid' : ''}`}
                id="personasEvacuadas"
                value={formData.personasEvacuadas || ''}
                onChange={handleChange}
                aria-describedby="error-personasEvacuadas"
                placeholder="Ej: 25"
              />
              {errors.personasEvacuadas && <div className="invalid-feedback" id="error-personasEvacuadas">{errors.personasEvacuadas}</div>}
              <div className="form-text text-muted small">Número de personas (no puede ser negativo)</div>
            </div>
          </div>

          {/* Detalle */}
          <div className="mb-3">
            <label htmlFor="detalle" className="text-black form-label">
              Detalle de lo sucedido *
            </label>
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

          {/* ---------- DAMNIFICADOS DINÁMICOS ---------- */}
          <h5 className="text-white mt-4">Personas damnificadas</h5>
          {formData.damnificados.map((d, index) => (
            <div key={index} className="border rounded p-3 mb-3">
              <div className="row mb-2">
                <div className="col">
                  <label className="text-black form-label">Nombre</label>
                  <input
                    type="text"
                    className="form-control"
                    value={d.nombre}
                    onChange={(e) => handleDamnificadoChange(index, 'nombre', e.target.value)}
                  />
                </div>
                <div className="col">
                  <label className="text-black form-label">Apellido</label>
                  <input
                    type="text"
                    className="form-control"
                    value={d.apellido}
                    onChange={(e) => handleDamnificadoChange(index, 'apellido', e.target.value)}
                  />
                </div>
              </div>

              <div className="row mb-2">
                <div className="col">
                  <label className="text-black form-label">Domicilio</label>
                  <input
                    type="text"
                    className="form-control"
                    value={d.domicilio}
                    onChange={(e) => handleDamnificadoChange(index, 'domicilio', e.target.value)}
                  />
                </div>
                <div className="col">
                  <label className="text-black form-label">Teléfono</label>
                  <input
                    type="text"
                    className="form-control"
                    value={d.telefono}
                    onChange={(e) => handleDamnificadoChange(index, 'telefono', e.target.value)}
                  />
                </div>
                <div className="col">
                  <label className="text-black form-label">DNI</label>
                  <input
                    type="text"
                    className="form-control"
                    value={d.dni}
                    onChange={(e) => handleDamnificadoChange(index, 'dni', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={d.fallecio}
                  onChange={(e) => handleDamnificadoChange(index, 'fallecio', e.target.checked)}
                />
                <label className="text-black form-check-label">¿Falleció?</label>
              </div>

              <button
                type="button"
                className="btn btn-outline-danger btn-sm mt-2"
                onClick={() => eliminarDamnificado(index)}
              >
                ❌ Eliminar damnificado
              </button>
            </div>
          ))}

          <button
            type="button"
            className="btn btn-outline-primary w-100 mb-3"
            onClick={agregarDamnificado}
          >
            ➕ Agregar damnificado
          </button>

          {/* BOTONES */}
          <button
            type="button"
            className="btn btn-danger w-100 mt-3"
            disabled={loading}
            onClick={() => handleFinalizar()}
          >
            {loading
              ? 'Enviando...'
              : datosPrevios.idIncidente || datosPrevios.id
              ? 'Actualizar factor climático'
              : 'Finalizar carga'}
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

export default FactorClimatico
