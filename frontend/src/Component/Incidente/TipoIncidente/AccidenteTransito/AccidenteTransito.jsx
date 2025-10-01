import { useState, useEffect, useRef } from 'react'
import Select from 'react-select'
import DamnificadosForm from '../../../Common/Damnificado.jsx'
import VehiculosFormList from '../../../Common/VehiculoFormList.jsx'
import { API_URLS, apiRequest } from '../../../../config/api'

const AccidenteTransito = ({ datosPrevios = {}, onFinalizar }) => {
  const incidenteId = datosPrevios.idIncidente || datosPrevios.id || 'temp'
  const storageKey = `accidente-${incidenteId}`

  const [formData, setFormData] = useState(() => {
    const guardado = localStorage.getItem(storageKey)
    const savedData = guardado ? JSON.parse(guardado) : { vehiculos: [], damnificados: [] }

    // Mapear los nombres de campos del backend a los nombres que usa el frontend
    const datosPreviosMapeados = {
      ...datosPrevios,
      // Mapear campos específicos del accidente de tránsito
      detalle: datosPrevios.detalle || datosPrevios.descripcion, // Mapear descripcion del backend a detalle del frontend
      causaAccidente: datosPrevios.causaAccidente || datosPrevios.idCausaAccidente,
      vehiculos: datosPrevios.vehiculos || [],
      damnificados: datosPrevios.damnificados || []
    }

    // Combinar datos guardados con datos previos mapeados, dando prioridad a los datos previos
    const combined = { ...savedData, ...datosPreviosMapeados }

    return combined
  })

  const [causasAccidente, setCausasAccidente] = useState([])
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [errors, setErrors] = useState({})
  const [damnificadosErrors, setDamnificadosErrors] = useState([])
  const toastRef = useRef(null)


  useEffect(() => {
    // Solo actualizar si hay nuevos datosPrevios y son diferentes
    if (datosPrevios && Object.keys(datosPrevios).length > 0) {
      // Mapear los nombres de campos del backend a los nombres que usa el frontend
      const datosMapeados = {
        ...datosPrevios,
        // Mapear campos específicos del accidente de tránsito
        detalle: datosPrevios.detalle || datosPrevios.descripcion, // Mapear descripcion del backend a detalle del frontend
        causaAccidente: datosPrevios.causaAccidente || datosPrevios.idCausaAccidente,
        vehiculos: datosPrevios.vehiculos || [],
        damnificados: datosPrevios.damnificados || []
      }

      setFormData(prev => ({ ...prev, ...datosMapeados }))
    }
  }, [datosPrevios])

  useEffect(() => {
    const fetchCausas = async () => {
      try {
        const data = await apiRequest(`${API_URLS.causasAccidente}`, { method: 'GET' })
        if (data && (data.success !== false)) {
          setCausasAccidente(data.data || data || [])
        } else {
          console.error('Error en la respuesta:', data?.error || data)
        }
      } catch (err) {
        console.error('Error al conectar con backend:', err)
      }
    }

    fetchCausas()
  }, [])

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
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

    // Validar causa del accidente (obligatorio)
    if (!formData.idCausaAccidente || formData.idCausaAccidente === "") {
      newErrors.idCausaAccidente = 'Campo obligatorio'
    }

    // Validar que haya al menos un vehículo
    if (!formData.vehiculos || formData.vehiculos.length === 0) {
      newErrors.vehiculos = 'Debe agregar al menos un vehículo involucrado'
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
      setErrorMsg('Por favor complete los campos obligatorios.');
      if (toastRef.current) toastRef.current.focus();
      return;
    }

    setLoading(true)

    const payload = {
      idIncidente: datosPrevios.idIncidente || datosPrevios.id,
      descripcion: formData.detalle,
      idCausaAccidente: parseInt(formData.idCausaAccidente),
      vehiculos: formData.vehiculos,
      damnificados: formData.damnificados
    }

    try {
      const esActualizacion = datosPrevios.idIncidente || datosPrevios.id
      const url = esActualizacion ?
        API_URLS.incidentes.updateAccidenteTransito :
        API_URLS.incidentes.createAccidenteTransito

      const data = await apiRequest(url, {
        method: esActualizacion ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      })

      if (data && (data.success !== false)) {
        const mensajeExito = esActualizacion ?
          'Accidente de tránsito actualizado con éxito' :
          'Accidente de tránsito registrado exitosamente'

        setSuccessMsg(mensajeExito)
        setErrorMsg('')
        localStorage.removeItem(storageKey)

        // Pasar el resultado completo al callback
        if (onFinalizar) {
          onFinalizar({
            success: true,
            message: mensajeExito,
            data: data,
            esActualizacion
          })
        }
      } else {
        const mensajeError = 'Error al ' + (esActualizacion ? 'actualizar' : 'registrar') + ': ' + (data?.message || data?.error || 'Error desconocido')
        setErrorMsg(mensajeError)
        setSuccessMsg('')
        console.error(data)

        // También pasar el error al callback
        if (onFinalizar) {
          onFinalizar({
            success: false,
            message: mensajeError,
            error: data
          })
        }
      }
    } catch (error) {
      const mensajeError = 'Error al conectar con el backend'
      setErrorMsg(mensajeError)
      setSuccessMsg('')
      console.error('Error al enviar:', error)

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
    <div className="container-fluid py-5">
      <div className="card shadow-sm border-0 bg-white bg-opacity-1 backdrop-blur-sm">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="idCausaAccidente" className="form-label text-dark d-flex align-items-center gap-2">Causa del accidente *</label>
              <Select
                options={causasAccidente.map(c => ({
                  value: c.idCausaAccidente,
                  label: c.descripcion
                }))}
                value={
                  causasAccidente
                    .map(c => ({ value: c.idCausaAccidente, label: c.descripcion }))
                    .find(opt => opt.value === formData.idCausaAccidente) || null
                }
                onChange={(opcion) =>
                  setFormData(prev => ({ ...prev, idCausaAccidente: opcion ? opcion.value : '' }))
                }
                classNamePrefix="rs"
                placeholder="Seleccionar causa del accidente"
                isClearable
              />
              {errors.idCausaAccidente && <div className="invalid-feedback" id="error-idCausaAccidente">{errors.idCausaAccidente}</div>}
            </div>

            <hr className="border-1 border-black mb-2" />

            <VehiculosFormList
              value={formData.vehiculos}
              onChange={(nuevoArr) => setFormData(prev => ({ ...prev, vehiculos: nuevoArr }))}
              title="Vehículos involucrados"
            />
            {errors.vehiculos && (
              <div className="alert alert-danger" role="alert">
                {errors.vehiculos}
              </div>
            )}

            <hr className="border-1 border-black mb-2" />
            
            <div className="mb-3">
              <label className="form-label text-dark d-flex align-items-center gap-2">Detalle de lo sucedido *</label>
              <textarea className={`form-control${errors.detalle ? ' is-invalid' : ''}`} rows="3" id="detalle" value={formData.detalle || ''} onChange={handleChange} aria-describedby="error-detalle"></textarea>
              {errors.detalle && <div className="invalid-feedback" id="error-detalle">{errors.detalle}</div>}
            </div>

            <hr className="border-1 border-black mb-2" />

            <DamnificadosForm
              value={formData.damnificados}
              onChange={(nuevoArray) => setFormData(prev => ({ ...prev, damnificados: nuevoArray }))}
              title="Personas damnificadas"
            />

            <div className='d-flex justify-content-center align-items-center gap-3 mb-3'>
              <button type="button" className="btn btn-accept btn-medium btn-lg btn-sm-custom" disabled={loading} onClick={() => handleSubmit()}>
                {loading ? 'Cargando...' : (datosPrevios.idIncidente || datosPrevios.id ? 'Finalizar carga' : 'Finalizar carga')}
              </button>

              <button type="button" className="btn btn-back btn-medium btn-lg btn-sm-custom" onClick={guardarLocalmente} disabled={loading}>
                Guardar y continuar después
              </button>
            </div>

          </form>
        </div>



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

export default AccidenteTransito
