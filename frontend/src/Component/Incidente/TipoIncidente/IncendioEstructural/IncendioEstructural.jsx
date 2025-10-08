import { useState, useEffect, useRef } from 'react'
import Select from 'react-select'
import DamnificadosForm from '../../../Common/Damnificado.jsx'
import { API_URLS, apiRequest, buildApiUrl } from '../../../../config/api'

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
  const [notificando, setNotificando] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [errors, setErrors] = useState({})
  const [damnificadosErrors, setDamnificadosErrors] = useState([])
  const [opcionesTipoTecho, setOpcionesTipoTecho] = useState([])
  const [opcionesTipoAbertura, setOpcionesTipoAbertura] = useState([])
  const toastRef = useRef(null)

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

  // Cargar catálogos desde el backend
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [tiposTecho, tiposAbertura] = await Promise.all([
          apiRequest('/api/tipos-techo'),
          apiRequest('/api/tipos-abertura')
        ])
        setOpcionesTipoTecho(tiposTecho.data || [])
        setOpcionesTipoAbertura(tiposAbertura.data || [])
      } catch (error) {
        console.error('Error al cargar catálogos:', error)
        setErrorMsg('Error al cargar opciones de formulario')
      }
    }
    cargarCatalogos()
  }, [])

  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg('')
        setErrorMsg('')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [successMsg, errorMsg])

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

  const notificarBomberos = async () => {
    const idIncidente = datosPrevios.idIncidente || datosPrevios.id
    if (!idIncidente) {
      alert('❌ No se puede notificar: el incidente aún no ha sido guardado')
      return
    }

    const confirmar = window.confirm(
      `¿Deseas notificar a los bomberos sobre el Incidente #${idIncidente}?\n\n` +
      `Se enviará una alerta por WhatsApp a todos los bomberos activos.`
    )

    if (!confirmar) return

    setNotificando(true)

    try {
      const resp = await fetch(buildApiUrl(`/api/incidentes/${idIncidente}/notificar`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      })

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}))
        throw new Error(errorData.message || `Error ${resp.status}: ${resp.statusText}`)
      }

      const resultado = await resp.json()

      if (resultado.success) {
        const { totalBomberos, notificacionesExitosas, notificacionesFallidas } = resultado.data
        alert(`🚨 ALERTA ENVIADA POR WHATSAPP ✅
        
📊 Resumen:
• Total bomberos: ${totalBomberos}
• Notificaciones exitosas: ${notificacionesExitosas}
• Notificaciones fallidas: ${notificacionesFallidas}

Los bomberos pueden responder "SI" o "NO" por WhatsApp para confirmar su asistencia.`)
        setSuccessMsg('✅ Notificación enviada exitosamente a los bomberos')
      } else {
        throw new Error(resultado.message || 'Error al enviar notificación')
      }
    } catch (error) {
      console.error('❌ Error al notificar por WhatsApp:', error)
      alert(`❌ Error al notificar por WhatsApp: ${error.message}`)
      setErrorMsg(`Error al notificar: ${error.message}`)
    } finally {
      setNotificando(false)
    }
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
    <div className="container-fluid py-5">
      <div className="card shadow-sm border-0 bg-white bg-opacity-1 backdrop-blur-sm">
        <div className="card-body">
          <form>
            <div className="mb-3">
              <label htmlFor="nombreLugar" className="form-label text-dark d-flex align-items-center gap-2">Nombre del comercio/casa de familia</label>
              <input type="text" className="form-control" id="nombreLugar" value={formData.nombreLugar || ''} onChange={handleChange} />
            </div>

            <div className="row mb-3">
              <div className="col">
                <label htmlFor="pisos" className="form-label text-dark d-flex align-items-center gap-2">Cantidad de pisos afectados</label>
                <input type="number" min="0" className={`form-control${errors.pisos ? ' is-invalid' : ''}`} id="pisos" value={formData.pisos || ''} onChange={handleChange} aria-describedby="error-pisos" placeholder="Ej: 2" />
                {errors.pisos && <div className="invalid-feedback" id="error-pisos">{errors.pisos}</div>}
              </div>
              <div className="col">
                <label htmlFor="ambientes" className="form-label text-dark d-flex align-items-center gap-2">Cantidad de ambientes afectados</label>
                <input type="number" min="0" className={`form-control${errors.ambientes ? ' is-invalid' : ''}`} id="ambientes" value={formData.ambientes || ''} onChange={handleChange} aria-describedby="error-ambientes" placeholder="Ej: 5" />
                {errors.ambientes && <div className="invalid-feedback" id="error-ambientes">{errors.ambientes}</div>}
              </div>
            </div>

            <div className="row mb-3">
              <div className="col">
                <label htmlFor="tipoTecho" className="form-label text-dark d-flex align-items-center gap-2">Tipo de techo *</label>
                <Select
                  options={opcionesTipoTecho}
                  value={opcionesTipoTecho.find(opt => String(opt.value) === String(formData.tipoTecho)) || null}
                  onChange={(opcion) =>
                    setFormData(prev => ({ ...prev, tipoTecho: opcion ? opcion.value : '' }))
                  }
                  classNamePrefix="rs"
                  placeholder="Seleccione tipo de techo"
                  isClearable
                />
                {errors.tipoTecho && <div className="invalid-feedback" id="error-tipoTecho">{errors.tipoTecho}</div>}
              </div>
              <div className="col">
                <label htmlFor="tipoAbertura" className="form-label text-dark d-flex align-items-center gap-2">Tipo de abertura *</label>
                <Select
                  options={opcionesTipoAbertura}
                  value={opcionesTipoAbertura.find(o => String(o.value) === String(formData.tipoAbertura)) || null}
                  onChange={(opt) =>
                    setFormData(prev => ({ ...prev, tipoAbertura: opt ? opt.value : '' }))
                  }
                  classNamePrefix="rs"
                  placeholder="Seleccione tipo abertura"
                  isClearable
                />
                {errors.tipoAbertura && <div className="invalid-feedback" id="error-tipoAbertura">{errors.tipoAbertura}</div>}
              </div>
              <div className="col">
                <label htmlFor="superficie" className="form-label text-dark d-flex align-items-center gap-2">Superficie afectada (m²)</label>
                <input type="number" min="0" step="0.01" className={`form-control${errors.superficie ? ' is-invalid' : ''}`} id="superficie" value={formData.superficie || ''} onChange={handleChange} aria-describedby="error-superficie" placeholder="Ej: 150.5" />
                {errors.superficie && <div className="invalid-feedback" id="error-superficie">{errors.superficie}</div>}
                <div className="form-text text-muted small">Área en metros cuadrados (no puede ser negativa)</div>
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="descripcion" className="form-label text-dark d-flex align-items-center gap-2">Detalle de lo sucedido *</label>
              <textarea className={`form-control${errors.descripcion ? ' is-invalid' : ''}`} rows="3" id="descripcion" value={formData.descripcion || ''} onChange={handleChange} aria-describedby="error-descripcion"></textarea>
              {errors.descripcion && <div className="invalid-feedback" id="error-descripcion">{errors.descripcion}</div>}
            </div>

            <DamnificadosForm
              value={formData.damnificados}
              onChange={(nuevoArray) => setFormData(prev => ({ ...prev, damnificados: nuevoArray }))}
              title="Personas damnificadas"
            />

            <div className='d-flex justify-content-center align-items-center gap-3 mb-3'>
              <button type="button" className="btn btn-back btn-medium" onClick={guardarLocalmente} disabled={loading || notificando}>
                Continuar después
              </button>

              <button
                type="button"
                className="btn btn-warning btn-medium d-flex align-items-center justify-content-center gap-2"
                onClick={notificarBomberos}
                disabled={loading || notificando}
              >
                {notificando ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Notificando...
                  </>
                ) : (
                  <>
                    <i className='bi bi-megaphone'></i> Notificar Bomberos
                  </>
                )}
              </button>
              <button type="button" className="btn btn-accept btn-medium" disabled={loading || notificando} onClick={() => handleFinalizar()}>
                {loading ? 'Enviando...' : (datosPrevios.idIncidente || datosPrevios.id ? 'Finalizar carga' : 'Finalizar carga')}
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

export default IncendioEstructural
