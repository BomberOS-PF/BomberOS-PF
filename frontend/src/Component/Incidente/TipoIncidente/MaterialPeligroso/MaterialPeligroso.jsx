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

  const [formData, setFormData] = useState(() =>
    safeRead(storageKey, {
      categoria: '',
      cantidadMateriales: '',
      otraAccionMaterial: '',
      otraAccionPersona: '',
      detalleAccionesPersona: '',
      superficieEvacuada: '',
      detalle: '',
      damnificados: []
    })
  )

  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const toastRef = useRef(null)

  const [categorias, setCategorias] = useState([])
  const [tiposMaterial, setTiposMaterial] = useState([])
  const [accionesMaterial, setAccionesMaterial] = useState([])
  const [accionesPersona, setAccionesPersona] = useState([])

  const incidenteBasico = datosPrevios.idIncidente || datosPrevios.id
    ? {
        id: datosPrevios.idIncidente || datosPrevios.id,
        tipo: datosPrevios.tipoSiniestro,
        fecha: datosPrevios.fechaHora || datosPrevios.fecha,
        localizacion: datosPrevios.localizacion,
        lugar: datosPrevios.lugar
      }
    : null

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

  const isValid = () => {
    if (!formData.categoria) return false
    if (!formData.cantidadMateriales || Number(formData.cantidadMateriales) < 1) return false
    const tieneTipos = Object.keys(formData).some(k => k.startsWith('material') && formData[k] === true)
    return tieneTipos
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

  const handleFinalizar = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSuccessMsg('')
    setErrorMsg('')

    try {
      localStorage.setItem(storageKey, JSON.stringify(formData))
      if (!isValid()) throw new Error('Revisá categoría, cantidad y al menos un tipo de material')

      const payload = buildDto()
      const url =
        API_URLS.materialesPeligrosos?.create ||
        API_URLS.incidentes?.createMaterialPeligroso

      const resp = await apiRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!resp?.success) {
        throw new Error(resp?.message || 'Error al registrar material peligroso')
      }

      const esActualizacion = !!(datosPrevios.idIncidente || datosPrevios.id)
      setSuccessMsg(esActualizacion
        ? 'Material peligroso actualizado con éxito'
        : '✅ Material peligroso registrado correctamente'
      )
      setErrorMsg('')
      localStorage.removeItem(storageKey)
      onFinalizar?.({ idIncidente: incidenteId })
    } catch (error) {
      setErrorMsg(`❌ Error al registrar material peligroso: ${error.message}`)
      setSuccessMsg('')
    } finally {
      setLoading(false)
      toastRef.current?.focus()
    }
  }

  return (
    <div className="container-fluid py-5">
      <div className="text-center mb-4">
        <div className='d-flex justify-content-center align-items-center gap-3 mb-3'>
          <div className='bg-danger p-3 rounded-circle'>
            <Flame size={32} color="white" />
          </div>
          <h1 className="fw-bold text-white fs-3 mb-0">Material Peligroso</h1>
        </div>
        <span className="badge bg-danger-subtle text-danger">
          <AlertTriangle className="me-2" /> Sistema de Emergencias - Cuartel de Bomberos
        </span>
      </div>

      <div className="card shadow-sm border-0 bg-white bg-opacity-1 backdrop-blur-sm">
        <div className="card-header bg-danger text-white d-flex align-items-center gap-2 py-4">
          <FileText />
          <strong>Datos del incidente</strong>
        </div>

        <div className="card-body">
          {/* Información del incidente */}
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

          <form onSubmit={handleFinalizar}>
            {/* Categoría y cantidad*/}
            <div className="row mb-3">
              <div className="col-md-6 py-4">
                <label className="form-label text-dark d-flex align-items-center gap-2">
                  <User className="text-danger" />
                  Categoría
                </label>
                <select
                  className="text-dark form-select"
                  id="categoria"
                  onChange={handleChange}
                  value={formData.categoria || ''}
                >
                  <option disabled value="">Seleccione categoria</option>
                  {categorias.map(cat => (
                    <option key={cat.idCategoria} value={cat.idCategoria}>
                      {cat.descripcion}
                    </option>
                  ))}
                </select>
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
                  const icons = ['🔥', '⚗️', '💥', '☢️', '🛢️', '🧪']
                  const selected = formData[`material${tipo.idTipoMatInvolucrado}`]
                  return (
                    <button
                      key={tipo.idTipoMatInvolucrado}
                      type='button'
                      className={`btn btn-lg toggle-btn me-2 mb-2 ${selected ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        [`material${tipo.idTipoMatInvolucrado}`]: !selected
                      }))}
                    >
                      <span className="me-2" aria-hidden="true">{icons[index % icons.length]}</span>
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
                      className={`btn btn-lg toggle-btn me-2 mb-2 ${selected ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        [`accion${accion.idAccionMaterial}`]: !selected
                      }))}
                    >
                      <span className="me-2" aria-hidden="true">{icons[index % icons.length]}</span>
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
                      className={`btn btn-lg toggle-btn me-2 mb-2 ${selected ? 'selected' : ''}`}
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        [`personaAccion${accion.idAccionPersona}`]: !selected
                      }))}
                    >
                      <span className="me-2" aria-hidden="true">{icons[index % icons.length]}</span>
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
              />
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
              />
            </div>

            <hr className="border-1 border-black mb-2" />

            {/* Damnificados */}
            <h5 className="text-black mt-4">Personas damnificadas</h5>
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
                <div className="mb-2">
                  <label className="text-black form-label">Domicilio</label>
                  <input
                    type="text"
                    className="form-control"
                    value={d.domicilio}
                    onChange={(e) => handleDamnificadoChange(index, 'domicilio', e.target.value)}
                  />
                </div>
                <div className="row mb-2">
                  <div className="col">
                    <label className="text-black form-label">Teléfono</label>
                    <input
                      type="tel"
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

            <button type="submit" className="btn btn-danger w-100 mt-3" disabled={loading}>
              {loading ? 'Cargando...' : 'Finalizar carga'}
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
    </div>
  )
}

export default MaterialPeligroso
