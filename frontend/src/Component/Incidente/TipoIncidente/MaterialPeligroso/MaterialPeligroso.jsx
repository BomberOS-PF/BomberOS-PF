import { useState, useEffect, useRef } from 'react'
import './MaterialPeligroso.css'
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

const MaterialPeligroso = ({ datosPrevios = {}, onFinalizar }) => {
  const incidenteId = datosPrevios.idIncidente || datosPrevios.id || 'temp'
  const storageKey = `materialPeligroso-${incidenteId}`

  const [formData, setFormData] = useState(() =>
    safeRead(storageKey, {
      categoria: '',
      cantidadMateriales: '',
      otraAccionMaterial: '',           // textarea (material)
      otraAccionPersona: '',            // input (personas)
      detalleAccionesPersona: '',       // textarea (personas)
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

  const toggleKey = (key) => {
    setFormData(prev => ({ ...prev, [key]: !prev[key] }))
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

    // material
    otraAccionMaterial: formData.otraAccionMaterial?.trim() || null,

    // personas
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

  const selectedTiposCount = tiposMaterial.filter(t => !!formData[`material${t.idTipoMatInvolucrado}`]).length
  const selectedAccMatCount = accionesMaterial.filter(a => !!formData[`accion${a.idAccionMaterial}`]).length
  const selectedAccPerCount = accionesPersona.filter(a => !!formData[`personaAccion${a.idAccionPersona}`]).length

  return (
    <div className="container d-flex justify-content-center align-items-center">
      <div className="formulario-consistente p-4 shadow rounded">
        <h2 className="text-black text-center mb-4">Material Peligroso</h2>

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
          {/* Categoría y cantidad */}
          <div className="row mb-3">
            <div className="col">
              <label htmlFor="categoria" className="form-label text-black">Categoría</label>
              <select
                className="form-select"
                id="categoria"
                value={formData.categoria || ''}
                onChange={handleChange}
              >
                <option disabled value="">Seleccione</option>
                {categorias.map(cat => (
                  <option key={cat.idCategoria} value={cat.idCategoria}>
                    {cat.descripcion}
                  </option>
                ))}
              </select>
            </div>

            <div className="col">
              <label htmlFor="cantidadMateriales" className="form-label text-black">Cantidad de materiales involucrados</label>
              <input
                type="number"
                className="form-control"
                id="cantidadMateriales"
                value={formData.cantidadMateriales || ''}
                onChange={handleChange}
                min="1"
              />
            </div>
          </div>

          {/* Tipos de materiales (énfasis) */}
          <div className="mb-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h5 className="fw-bold text-dark mb-0 border-start border-4 border-danger ps-2">
                Tipos de materiales involucrados
              </h5>
            </div>
            <div className="d-flex flex-wrap gap-2">
              {tiposMaterial.map((t) => {
                const key = `material${t.idTipoMatInvolucrado}`
                const selected = !!formData[key]
                return (
                  <button
                    key={t.idTipoMatInvolucrado}
                    type="button"
                    className={`btn toggle-btn ${selected ? 'selected' : ''}`}
                    onClick={() => toggleKey(key)}
                  >
                    {t.nombre}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Acciones sobre el material (igual + detalle debajo) */}
          <div className="mb-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h5 className="fw-bold text-dark mb-0 border-start border-4 border-danger ps-2">
                Acciones sobre el material
              </h5>

            </div>
            <div className="d-flex flex-wrap gap-2 mb-2">
              {accionesMaterial.map((a) => {
                const key = `accion${a.idAccionMaterial}`
                const selected = !!formData[key]
                return (
                  <button
                    key={a.idAccionMaterial}
                    type="button"
                    className={`btn toggle-btn ${selected ? 'selected' : ''}`}
                    onClick={() => toggleKey(key)}
                  >
                    {a.nombre}
                  </button>
                )
              })}
            </div>

            {/* Detalle MATERIAL debajo */}
            <label htmlFor="otraAccionMaterial" className="form-label text-black mt-2">
              Detalle sobre otras acciones (material)
            </label>
            <textarea
              id="otraAccionMaterial"
              className="form-control"
              rows="2"
              placeholder="Describí otras acciones realizadas sobre el material…"
              value={formData.otraAccionMaterial || ''}
              onChange={handleChange}
            ></textarea>
          </div>

          {/* Acciones sobre las personas (igual + detalle abajo) */}
          <div className="mb-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h5 className="fw-bold text-dark mb-0 border-start border-4 border-danger ps-2">
                Acciones sobre las personas
              </h5>

            </div>

            <div className="d-flex flex-wrap gap-2 mb-2">
              {accionesPersona.map((a) => {
                const key = `personaAccion${a.idAccionPersona}`
                const selected = !!formData[key]
                return (
                  <button
                    key={a.idAccionPersona}
                    type="button"
                    className={`btn toggle-btn ${selected ? 'selected' : ''}`}
                    onClick={() => toggleKey(key)}
                  >
                    {a.nombre}
                  </button>
                )
              })}
            </div>

            <label htmlFor="otraAccionPersona" className="form-label text-black">Otra acción sobre las personas</label>
            <input
              type="text"
              className="form-control"
              id="otraAccionPersona"
              value={formData.otraAccionPersona || ''}
              onChange={handleChange}
            />

            {/* Detalle PERSONAS debajo */}
            <label htmlFor="detalleAccionesPersona" className="form-label text-black mt-2">
              Detalle sobre otras acciones (personas)
            </label>
            <textarea
              className="form-control"
              rows="2"
              id="detalleAccionesPersona"
              value={formData.detalleAccionesPersona || ''}
              onChange={handleChange}
            ></textarea>
          </div>

          {/* Superficie y detalle general */}
          <div className="row mb-3">
            <div className="col">
              <label htmlFor="superficie" className="text-black form-label">
                Superficie evacuada
              </label>
              <select
                className="form-select"
                id="superficie"
                value={formData.superficie || ''}
                onChange={handleChange}
              >
                <option disabled value="">Seleccione</option>
                <option>Menos de 100 m²</option>
                <option>100 - 500 m²</option>
                <option>500 - 1000 m²</option>
                <option>Más de 1000 m²</option>
              </select>
            </div>
            <div className="col">
              <label htmlFor="detalle" className="form-label text-black">Detalle de lo sucedido</label>
              <textarea
                className="form-control"
                rows="3"
                id="detalle"
                value={formData.detalle || ''}
                onChange={handleChange}
              ></textarea>
            </div>
          </div>

          {/* Damnificados */}
          <h5 className="text-white mt-4">Personas damnificadas</h5>
          {(formData.damnificados || []).map((d, index) => {
            const base = `dam-${index}`
            return (
              <div key={index} className="border rounded p-3 mb-3">
                <div className="row mb-2">
                  <div className="col">
                    <label htmlFor={`${base}-nombre`} className="text-black form-label">Nombre</label>
                    <input
                      id={`${base}-nombre`}
                      type="text"
                      className="form-control"
                      value={d.nombre}
                      onChange={(e) => handleDamnificadoChange(index, 'nombre', e.target.value)}
                    />
                  </div>
                  <div className="col">
                    <label htmlFor={`${base}-apellido`} className="text-black form-label">Apellido</label>
                    <input
                      id={`${base}-apellido`}
                      type="text"
                      className="form-control"
                      value={d.apellido}
                      onChange={(e) => handleDamnificadoChange(index, 'apellido', e.target.value)}
                    />
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col">
                    <label htmlFor={`${base}-dom`} className="text-black form-label">Domicilio</label>
                    <input
                      id={`${base}-dom`}
                      type="text"
                      className="form-control"
                      value={d.domicilio}
                      onChange={(e) => handleDamnificadoChange(index, 'domicilio', e.target.value)}
                    />
                  </div>
                  <div className="col">
                    <label htmlFor={`${base}-tel`} className="text-black form-label">Teléfono</label>
                    <input
                      id={`${base}-tel`}
                      type="text"
                      className="form-control"
                      value={d.telefono}
                      onChange={(e) => handleDamnificadoChange(index, 'telefono', e.target.value)}
                    />
                  </div>
                  <div className="col">
                    <label htmlFor={`${base}-dni`} className="text-black form-label">DNI</label>
                    <input
                      id={`${base}-dni`}
                      type="text"
                      className="form-control"
                      value={d.dni}
                      onChange={(e) => handleDamnificadoChange(index, 'dni', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-check">
                  <input
                    id={`${base}-fall`}
                    type="checkbox"
                    className="form-check-input"
                    checked={!!d.fallecio}
                    onChange={(e) => handleDamnificadoChange(index, 'fallecio', e.target.checked)}
                  />
                  <label htmlFor={`${base}-fall`} className="text-black form-check-label">¿Falleció?</label>
                </div>

                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm mt-2"
                  onClick={() => eliminarDamnificado(index)}
                >
                  ❌ Eliminar damnificado
                </button>
              </div>
            )
          })}

          <button
            type="button"
            className="btn btn-outline-primary w-100 mb-3"
            onClick={agregarDamnificado}
          >
            ➕ Agregar damnificado
          </button>

          {/* BOTONES */}
          <button
            type="submit"
            className="btn btn-danger w-100 mt-3"
            disabled={loading}
          >
            {loading
              ? 'Enviando...'
              : (datosPrevios.idIncidente || datosPrevios.id)
                ? 'Actualizar material peligroso'
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

export default MaterialPeligroso
