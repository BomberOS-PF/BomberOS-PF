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

  const [formData, setFormData] = useState(() =>
    safeRead(storageKey, {
      nombreLugar: '',
      pisos: '',
      ambientes: '',
      tipoTecho: '',
      tipoAbertura: '',
      superficie: '',
      descripcion: '',
      damnificados: []
    })
  )

  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const toastRef = useRef(null)

  // Info del incidente base (solo display)
  const incidenteBasico = datosPrevios.idIncidente || datosPrevios.id
    ? {
        id: datosPrevios.idIncidente || datosPrevios.id,
        tipo: datosPrevios.tipoSiniestro,
        fecha: datosPrevios.fechaHora || datosPrevios.fecha,
        localizacion: datosPrevios.localizacion,
        lugar: datosPrevios.lugar
      }
    : null

  // Sincronizar cambios de id del incidente sin pisar lo ya tipeado
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      // mantené lo escrito por el usuario, solo aseguramos el array
      damnificados: Array.isArray(prev.damnificados) ? prev.damnificados : []
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datosPrevios?.idIncidente, datosPrevios?.id])

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

  const isValid = () => {
    // Ajustá reglas si necesitás obligatorios
    return true
  }

  const handleFinalizar = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSuccessMsg('')
    setErrorMsg('')

    try {
      // Snapshot local por las dudas
      localStorage.setItem(storageKey, JSON.stringify(formData))

      const payload = {
        idIncidente: incidenteId,
        tipoTecho: formData.tipoTecho,
        tipoAbertura: formData.tipoAbertura,
        descripcion: formData.descripcion?.trim() || null,
        superficie: toNumberOrNull(formData.superficie),
        cantPisos: toNumberOrNull(formData.pisos),
        cantAmbientes: toNumberOrNull(formData.ambientes),
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

      if (!isValid()) {
        throw new Error('Revisá los campos obligatorios y formatos')
      }

      const resp = await apiRequest(API_URLS.incidentes.createIncendioEstructural, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      // apiRequest devuelve JSON parseado
      if (!resp?.success) {
        throw new Error(resp?.message || 'Error al registrar incendio estructural')
      }

      const esActualizacion = !!(datosPrevios.idIncidente || datosPrevios.id)
      setSuccessMsg(esActualizacion
        ? 'Incendio estructural actualizado con éxito'
        : '✅ Incendio estructural registrado correctamente'
      )
      setErrorMsg('')
      localStorage.removeItem(storageKey)
      onFinalizar?.({ idIncidente: incidenteId })
    } catch (error) {
      setErrorMsg(`❌ Error al registrar incendio estructural: ${error.message}`)
      setSuccessMsg('')
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

        <form onSubmit={handleFinalizar}>
          <div className="mb-3">
            <label htmlFor="nombreLugar" className="text-black form-label">Nombre del comercio/casa de familia</label>
            <input type="text" className="form-control" id="nombreLugar" value={formData.nombreLugar || ''} onChange={handleChange} />
          </div>

          <div className="row mb-3">
            <div className="col">
              <label htmlFor="pisos" className="text-black form-label">Cantidad de pisos afectados</label>
              <input type="number" className="form-control" id="pisos" value={formData.pisos || ''} onChange={handleChange} />
            </div>
            <div className="col">
              <label htmlFor="ambientes" className="text-black form-label">Cantidad de ambientes afectados</label>
              <input type="number" className="form-control" id="ambientes" value={formData.ambientes || ''} onChange={handleChange} />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col">
              <label htmlFor="tipoTecho" className="text-black form-label">Tipo de techo</label>
              <select className="form-select" id="tipoTecho" value={formData.tipoTecho || ''} onChange={handleSelectChange}>
                <option disabled value="">Seleccione</option>
                <option value="1">Chapa aislada</option>
                <option value="2">Chapa metálica</option>
                <option value="3">Madera/paja</option>
                <option value="4">Teja</option>
                <option value="5">Yeso</option>
              </select>
            </div>
            <div className="col">
              <label htmlFor="tipoAbertura" className="text-black form-label">Tipo de abertura</label>
              <select className="form-select" id="tipoAbertura" value={formData.tipoAbertura || ''} onChange={handleSelectChange}>
                <option disabled value="">Seleccione</option>
                <option value="1">Acero/Hierro</option>
                <option value="2">Aluminio</option>
                <option value="3">Madera</option>
                <option value="4">Plástico</option>
              </select>
            </div>
            <div className="col">
              <label htmlFor="superficie" className="text-black form-label">Superficie afectada (m²)</label>
              <input type="number" className="form-control" id="superficie" value={formData.superficie || ''} onChange={handleChange} />
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="descripcion" className="text-black form-label">Detalle de lo sucedido</label>
            <textarea className="form-control" rows="3" id="descripcion" value={formData.descripcion || ''} onChange={handleChange}></textarea>
          </div>

          <h5 className="text-white mt-4">Personas damnificadas</h5>
          {formData.damnificados.map((d, index) => {
            const base = `dam-${index}`
            return (
              <div key={index} className="border rounded p-3 mb-3">
                <div className="row mb-2">
                  <div className="col">
                    <label htmlFor={`${base}-nombre`} className="text-black form-label">Nombre</label>
                    <input id={`${base}-nombre`} type="text" className="form-control" value={d.nombre} onChange={(e) => handleDamnificadoChange(index, 'nombre', e.target.value)} />
                  </div>
                  <div className="col">
                    <label htmlFor={`${base}-apellido`} className="text-black form-label">Apellido</label>
                    <input id={`${base}-apellido`} type="text" className="form-control" value={d.apellido} onChange={(e) => handleDamnificadoChange(index, 'apellido', e.target.value)} />
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

          <button type="submit" className="btn btn-danger w-100 mt-3" disabled={loading}>
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
