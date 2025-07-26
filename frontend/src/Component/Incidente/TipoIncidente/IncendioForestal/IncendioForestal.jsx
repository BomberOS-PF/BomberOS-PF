import { useState, useEffect, useRef } from 'react'
import './IncendioForestal.css'
import '../../../DisenioFormulario/DisenioFormulario.css'
import { API_URLS, apiRequest } from '../../../../config/api'
import DamnificadoForm from './DamnificadoForm'

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
    return saved ? JSON.parse(saved) : {}
  })

  // Mostrar información del incidente básico si existe
  const incidenteBasico = datosPrevios.idIncidente || datosPrevios.id ? {
    id: datosPrevios.idIncidente || datosPrevios.id,
    tipo: datosPrevios.tipoSiniestro,
    fecha: datosPrevios.fechaHora || datosPrevios.fecha,
    localizacion: datosPrevios.localizacion,
    lugar: datosPrevios.lugar
  } : null

  useEffect(() => {
    setFormData(prev => ({ ...prev, ...datosPrevios }))
  }, [datosPrevios])

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [id]: type === 'checkbox' ? checked : value }))
  }

  const guardarLocalmente = () => {
    localStorage.setItem(storageKey, JSON.stringify(formData))
    alert('Datos guardados localmente. Podés continuar después.')
  }

  const [damnificados, setDamnificados] = useState(() => {
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      const parsed = JSON.parse(saved)
      return parsed.damnificados || [
        { nombre: '', apellido: '', domicilio: '', telefono: '', dni: '', fallecio: false }
      ]
    }
    return [
      { nombre: '', apellido: '', domicilio: '', telefono: '', dni: '', fallecio: false }
    ]
  });

  useEffect(() => {
    if (formData.damnificados) setDamnificados(formData.damnificados)
  }, [formData.damnificados])

  const handleDamnificadoChange = (idx, e) => {
    const { id, value, type, checked } = e.target;
    setDamnificados(prev => prev.map((d, i) => i === idx ? { ...d, [id]: type === 'checkbox' ? checked : value } : d));
  }

  const agregarDamnificado = () => {
    setDamnificados(prev => ([...prev, { nombre: '', apellido: '', domicilio: '', telefono: '', dni: '', fallecio: false }]));
  }

  const eliminarDamnificado = (idx) => {
    setDamnificados(prev => prev.filter((_, i) => i !== idx));
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
    if (!formData.caracteristicaLugar || formData.caracteristicaLugar === "") newErrors.caracteristicaLugar = 'Campo obligatorio'
    if (!formData.unidadAfectada || formData.unidadAfectada === "") newErrors.unidadAfectada = 'Campo obligatorio'
    if (!formData.cantidadAfectada) newErrors.cantidadAfectada = 'Campo obligatorio'
    if (!formData.detalle) newErrors.detalle = 'Campo obligatorio'
    // Los damnificados NO son obligatorios, solo validar si hay alguno con datos
    const damErrors = damnificados.map(d => {
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
    return Object.keys(newErrors).length === 0 && damErrors.every((e, i) => damnificadoVacio(damnificados[i]) || Object.keys(e).length === 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg(''); setErrorMsg('');
    if (!validate()) {
      setErrorMsg('Por favor complete los campos obligatorios.');
      if (toastRef.current) toastRef.current.focus();
      return;
    }
    setLoading(true);
    localStorage.setItem(storageKey, JSON.stringify(formData));
    const damnificadosFiltrados = damnificados.filter(d => !damnificadoVacio(d));
    const data = {
      fecha: toMySQLDatetime(new Date()),
      idLocalizacion: 1,
      descripcion: `Incendio Forestal - ${formData.caracteristicaLugar ? 'Característica: ' + caracteristicasLugarOptions.find(opt => opt.idCaractLugar == formData.caracteristicaLugar)?.descripcion : ''} - ${formData.unidadAfectada ? 'Área: ' + areaAfectadaOptions.find(opt => opt.idAreaAfectada == formData.unidadAfectada)?.descripcion : ''}`,
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
    try {
      await apiRequest(API_URLS.incidentes.createIncendioForestal, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      const esActualizacion = datosPrevios.idIncidente || datosPrevios.id
      setSuccessMsg(esActualizacion ? 
        'Incidente de incendio forestal actualizado con éxito' : 
        'Incidente de incendio forestal cargado con éxito'
      );
      setErrorMsg('');
      localStorage.removeItem(storageKey);
      if (onFinalizar) onFinalizar();
    } catch (error) {
      setErrorMsg('Error al cargar el incidente: ' + (error.message || 'Error desconocido'));
      setSuccessMsg('');
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
        
        <form onSubmit={handleSubmit}>
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
              <label className="text-black form-label" htmlFor="cantidadAfectada">Cantidad *</label>
              <input type="number" className={`form-control${errors.cantidadAfectada ? ' is-invalid' : ''}`} id="cantidadAfectada" value={formData.cantidadAfectada || ''} onChange={handleChange} aria-describedby="error-cantidadAfectada" />
              {errors.cantidadAfectada && <div className="invalid-feedback" id="error-cantidadAfectada">{errors.cantidadAfectada}</div>}
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
          {damnificados.map((d, idx) => (
            <DamnificadoForm
              key={idx}
              damnificado={d}
              idx={idx}
              onChange={handleDamnificadoChange}
              onRemove={eliminarDamnificado}
              showRemove={damnificados.length > 1}
              errors={damnificadosErrors[idx] || {}}
            />
          ))}
          <button type="button" className="btn btn-outline-primary w-100 mb-3" onClick={agregarDamnificado}>
            Agregar damnificado
          </button>

          <button type="submit" className="btn btn-danger w-100 mt-3" disabled={loading}>
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
