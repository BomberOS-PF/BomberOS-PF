import { useState, useEffect, useRef } from 'react'
import Select from 'react-select'
import DamnificadosForm from '../../../Common/Damnificado.jsx'
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
    <div className="container-fluid py-5">
      <div className="card shadow-sm border-0 bg-white bg-opacity-1 backdrop-blur-sm">
        <div className="card-body">
          <form>
            <div className="mb-3">
              <label className="form-label text-dark d-flex align-items-center gap-2" htmlFor="caracteristicaLugar">Características del lugar *</label>
              <Select
                options={caracteristicasLugarOptions.map(opt => ({
                  value: String(opt.idCaractLugar),
                  label: opt.descripcion
                }))}
                value={
                  caracteristicasLugarOptions
                    .map(opt => ({ value: String(opt.idCaractLugar), label: opt.descripcion }))
                    .find(o => o.value === String(formData.caracteristicaLugar)) || null
                }
                onChange={(opt) =>
                  setFormData(prev => ({
                    ...prev,
                    caracteristicaLugar: opt ? opt.value : ''
                  }))
                }
                classNamePrefix="rs"
                placeholder="Seleccione característica del lugar"
                isClearable
              />
              {errors.caracteristicaLugar && <div className="invalid-feedback" id="error-caracteristicaLugar">{errors.caracteristicaLugar}</div>}
            </div>

            <div className="row mb-3">
              <div className="col">
                <label className="form-label text-dark d-flex align-items-center gap-2" htmlFor="unidadAfectada">Área afectada *</label>
                <Select
                  options={areaAfectadaOptions.map(opt => ({
                    value: String(opt.idAreaAfectada),
                    label: opt.descripcion
                  }))}
                  value={
                    areaAfectadaOptions
                      .map(opt => ({ value: String(opt.idAreaAfectada), label: opt.descripcion }))
                      .find(o => o.value === String(formData.unidadAfectada)) || null
                  }
                  onChange={(opt) =>
                    setFormData(prev => ({
                      ...prev,
                      unidadAfectada: opt ? opt.value : ''
                    }))
                  }
                  classNamePrefix="rs"
                  placeholder="Seleccione unidad afectada"
                  isClearable
                />
                {errors.unidadAfectada && <div className="invalid-feedback" id="error-unidadAfectada">{errors.unidadAfectada}</div>}
              </div>
              <div className="col">
                <label className="form-label text-dark d-flex align-items-center gap-2" htmlFor="cantidadAfectada">Cantidad (hectáreas) *</label>
                <input type="number" min="0" step="0.01" className={`form-control${errors.cantidadAfectada ? ' is-invalid' : ''}`} id="cantidadAfectada" value={formData.cantidadAfectada || ''} onChange={handleChange} aria-describedby="error-cantidadAfectada" placeholder="Ej: 15.5" />
                {errors.cantidadAfectada && <div className="invalid-feedback" id="error-cantidadAfectada">{errors.cantidadAfectada}</div>}
                <div className="form-text text-muted small">Superficie afectada (no puede ser negativa)</div>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label text-dark d-flex align-items-center gap-2">Causa probable</label>
              <Select
                options={causasProbablesOptions.map(opt => ({
                  value: String(opt.idCausaProbable),
                  label: opt.descripcion
                }))}
                value={
                  causasProbablesOptions
                    .map(opt => ({ value: String(opt.idCausaProbable), label: opt.descripcion }))
                    .find(o => o.value === String(formData.causaProbable)) || null
                }
                onChange={(opt) =>
                  setFormData(prev => ({
                    ...prev,
                    causaProbable: opt ? opt.value : ''
                  }))
                }
                classNamePrefix="rs"
                placeholder="Seleccione causa probable"
                isClearable
              />
            </div>

            <div className="mb-3">
              <label className="form-label text-dark d-flex align-items-center gap-2" htmlFor="detalle">Detalle de lo sucedido *</label>
              <textarea className={`form-control${errors.detalle ? ' is-invalid' : ''}`} id="detalle" rows="3" value={formData.detalle || ''} onChange={handleChange} aria-describedby="error-detalle"></textarea>
              {errors.detalle && <div className="invalid-feedback" id="error-detalle">{errors.detalle}</div>}
            </div>

            <hr className="border-1 border-black mb-2" />

            <DamnificadosForm
              value={formData.damnificados}
              onChange={(nuevoArray) => setFormData(prev => ({ ...prev, damnificados: nuevoArray }))}
              title="Personas damnificadas"
            />

            <div className='d-flex justify-content-center align-items-center gap-3 mb-3'>
              <button
                type="button"
                className="btn btn-accept btn-medium btn-lg btn-sm-custom"
                disabled={loading}
                onClick={() => handleSubmit()}
              >
                {loading ? 'Cargando...' : (datosPrevios.idIncidente || datosPrevios.id ? 'Finalizar carga' : 'Finalizar carga')}
              </button>
              <button type="button" className="btn btn-back btn-medium btn-lg btn-sm-custom" onClick={guardarLocalmente} disabled={loading}>
                Guardar y continuar después
              </button>
            </div>

          </form>
        </div>

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
