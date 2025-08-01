import { useState, useEffect, useRef } from 'react'
import './MaterialPeligroso.css'
import '../../../DisenioFormulario/DisenioFormulario.css'

const MaterialPeligroso = ({ datosPrevios = {}, onFinalizar }) => {
  const incidenteId = datosPrevios.idIncidente || datosPrevios.id || 'temp'
  const storageKey = `materialPeligroso-${incidenteId}`

  const [formData, setFormData] = useState(() => {
    const guardado = localStorage.getItem(storageKey)
    return guardado
      ? JSON.parse(guardado)
      : { ...datosPrevios, damnificados: [] }
  })

  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const toastRef = useRef(null)

  const [categorias, setCategorias] = useState([])
  const [tiposMaterial, setTiposMaterial] = useState([])
  const [accionesMaterial, setAccionesMaterial] = useState([])
  const [accionesPersona, setAccionesPersona] = useState([])

  // Datos básicos del incidente
  const incidenteBasico = datosPrevios.idIncidente || datosPrevios.id
    ? {
      id: datosPrevios.idIncidente || datosPrevios.id,
      tipo: datosPrevios.tipoSiniestro,
      fecha: datosPrevios.fechaHora || datosPrevios.fecha,
      localizacion: datosPrevios.localizacion,
      lugar: datosPrevios.lugar
    }
    : null

  // Cargar catálogos
  useEffect(() => {
    const fetchCatalogos = async () => {
      try {
        const [catRes, tipoRes, accMatRes, accPerRes] = await Promise.all([
          fetch('http://localhost:3000/api/categorias-material-peligroso'),
          fetch('http://localhost:3000/api/tipos-materiales-involucrados'),
          fetch('http://localhost:3000/api/acciones-material'),
          fetch('http://localhost:3000/api/acciones-persona')
        ])

        const [catData, tipoData, accMatData, accPerData] = await Promise.all([
          catRes.json(),
          tipoRes.json(),
          accMatRes.json(),
          accPerRes.json()
        ])

        if (catData.success) setCategorias(catData.data)
        if (tipoData.success) setTiposMaterial(tipoData.data)
        if (accMatData.success) setAccionesMaterial(accMatData.data)
        if (accPerData.success) setAccionesPersona(accPerData.data)
      } catch (error) {
        console.error('❌ Error al cargar catálogos:', error)
      }
    }
    fetchCatalogos()
  }, [])

  // Actualizar formData cuando cambian datosPrevios
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...datosPrevios
    }))
  }, [datosPrevios])

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }))
  }

  // --- Damnificados ---
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

  const guardarLocalmente = () => {
    localStorage.setItem(storageKey, JSON.stringify(formData))
    alert('Datos guardados localmente. Podés continuar después.')
  }

  // --- Construir DTO ---
  const buildDto = () => {
    return {
      idIncidente: Number(incidenteBasico?.id), // 🔹 Forzamos número
      categoria: parseInt(formData.categoria) || null,
      cantidadMateriales: parseInt(formData.cantidadMateriales) || 0,
      otraAccionMaterial: formData.otraAccionMaterial || null,
      otraAccionPersona: formData.otraAccionPersona || null,
      detalleOtrasAccionesPersona: formData.detalleAccionesPersona || null,
      cantidadSuperficieEvacuada: formData.superficieEvacuada || null,
      detalle: formData.detalle || null,

      tiposMateriales: Object.keys(formData)
        .filter((key) => key.startsWith('material') && formData[key] === true)
        .map((key, i) => i + 1),

      accionesMaterial: Object.keys(formData)
        .filter((key) => key.startsWith('accion') && formData[key] === true)
        .map((key, i) => i + 1),

      accionesPersona: Object.keys(formData)
        .filter((key) => key.startsWith('personaAccion') && formData[key] === true)
        .map((key, i) => i + 1),

      damnificados: (formData.damnificados || []).map(d => ({
        nombre: d.nombre || null,
        apellido: d.apellido || null,
        domicilio: d.domicilio || null,
        telefono: d.telefono || null,
        dni: d.dni || null,
        fallecio: !!d.fallecio
      }))
    }
  }

  // --- Enviar al backend ---
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSuccessMsg('')
    setErrorMsg('')

    try {
      const dto = buildDto()
      console.log('📤 Enviando DTO:', dto)

      const res = await fetch('http://localhost:3000/api/materiales-peligrosos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto)
      })

      // 🔹 Aseguramos que data exista
      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error en el servidor')
      }

      setSuccessMsg('✅ Material peligroso registrado correctamente')
      localStorage.removeItem(storageKey)

      if (onFinalizar) onFinalizar()
    } catch (error) {
      console.error(error)
      setErrorMsg(error.message)
    } finally {
      setLoading(false)
      if (toastRef.current) toastRef.current.focus()
    }
  }

  return (
    <div className="container d-flex justify-content-center align-items-center">
      <div className="formulario-consistente p-4 shadow rounded">
        <h2 className="text-black text-center mb-4">Material Peligroso</h2>

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
        <form onSubmit={handleSubmit}>
          {/* Categoría */}
          <div className="row mb-3">
            <div className="col">
              <label className="text-black form-label">Categoría</label>
              <select
                className="form-select"
                id="categoria"
                onChange={handleChange}
                value={formData.categoria || ''}
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
              <label className="text-black form-label">Cantidad de materiales involucrados</label>
              <input
                type="number"
                className="form-control"
                id="cantidadMateriales"
                value={formData.cantidadMateriales || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Tipos de material */}
          <div className="row mb-3">
            <div className="col">
              <fieldset>
                <legend className="text-black fs-6">Tipos de materiales involucrados</legend>
                {tiposMaterial.map(tipo => (
                  <div className="form-check" key={tipo.idTipoMatInvolucrado}>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`material${tipo.idTipoMatInvolucrado}`}
                      checked={formData[`material${tipo.idTipoMatInvolucrado}`] || false}
                      onChange={handleChange}
                    />
                    <label
                      className="text-black form-check-label"
                      htmlFor={`material${tipo.idTipoMatInvolucrado}`}
                    >
                      {tipo.nombre}
                    </label>
                  </div>
                ))}
              </fieldset>
            </div>

            {/* Acciones sobre el material */}
            <div className="col">
              <fieldset>
                <legend className="text-black fs-6">Acciones sobre el material</legend>
                {accionesMaterial.map(accion => (
                  <div className="form-check" key={accion.idAccionMaterial}>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`accion${accion.idAccionMaterial}`}
                      checked={formData[`accion${accion.idAccionMaterial}`] || false}
                      onChange={handleChange}
                    />
                    <label
                      className="text-black form-check-label"
                      htmlFor={`accion${accion.idAccionMaterial}`}
                    >
                      {accion.nombre}
                    </label>
                  </div>
                ))}
                <div className="form-check mt-2">
                  <label className="text-black form-label">Otra acción</label>
                  <input
                    type="text"
                    className="form-control"
                    id="otraAccionMaterial"
                    value={formData.otraAccionMaterial || ''}
                    onChange={handleChange}
                  />
                </div>
              </fieldset>
            </div>
          </div>

          {/* Acciones sobre personas */}
          <fieldset className="mb-3">
            <legend className="text-black fs-6">Acciones sobre las personas</legend>
            {accionesPersona.map(accion => (
              <div className="form-check" key={accion.idAccionPersona}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`personaAccion${accion.idAccionPersona}`}
                  checked={formData[`personaAccion${accion.idAccionPersona}`] || false}
                  onChange={handleChange}
                />
                <label
                  className="text-black form-check-label"
                  htmlFor={`personaAccion${accion.idAccionPersona}`}
                >
                  {accion.nombre}
                </label>
              </div>
            ))}
            <div className="form-check mt-2">
              <label className="text-black form-label">Otra acción</label>
              <input
                type="text"
                className="form-control"
                id="otraAccionPersona"
                value={formData.otraAccionPersona || ''}
                onChange={handleChange}
              />
            </div>
          </fieldset>

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
                  checked={d.fallecio}
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
  )
}

export default MaterialPeligroso
