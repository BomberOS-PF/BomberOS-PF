import { useState, useEffect, useRef } from 'react'
import './MaterialPeligroso.css'
import '../../../DisenioFormulario/DisenioFormulario.css'

  
const MaterialPeligroso = ({ datosPrevios = {}, onFinalizar }) => {
  const incidenteId = datosPrevios.idIncidente || datosPrevios.id || 'temp'
  const storageKey = `materialPeligroso-${incidenteId}`

  const [formData, setFormData] = useState(() => {
    const guardado = localStorage.getItem(storageKey)
    return guardado ? JSON.parse(guardado) : { ...datosPrevios }
  })

  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const toastRef = useRef(null)
  const [categorias, setCategorias] = useState([])  // <-- Agregar esta línea
  const [tiposMateriales, setTiposMateriales] = useState([])
  const [accionesMaterial, setAccionesMaterial] = useState([])
  const [accionesPersona, setAccionesPersona] = useState([])


  // Mostrar datos básicos del incidente
  const incidenteBasico = datosPrevios.idIncidente || datosPrevios.id ? {
    id: datosPrevios.idIncidente || datosPrevios.id,
    tipo: datosPrevios.tipoSiniestro,
    fecha: datosPrevios.fechaHora || datosPrevios.fecha,
    localizacion: datosPrevios.localizacion,
    lugar: datosPrevios.lugar
  } : null

    // Cargar categorías desde el backend
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/categorias-material-peligroso') 
        const data = await res.json()
        if (data.success) {
          setCategorias(data.data)
        } else {
          console.error('Error cargando categorías:', data.message)
        }
      } catch (error) {
        console.error('❌ Error al traer categorías:', error)
      }
    }
    fetchCategorias()
  }, [])
  useEffect(() => {
  const fetchCatalogos = async () => {
    try {
      const [catRes, tipoRes, accMatRes, accPerRes] = await Promise.all([
        fetch('http://localhost:3000/api/categorias-material-peligroso'),
        fetch('http://localhost:3000/api/tipos-material'),
        fetch('http://localhost:3000/api/acciones-material'),
        fetch('http://localhost:3000/api/acciones-persona')
      ])

      const [catData, tipoData, accMatData, accPerData] = await Promise.all([
        catRes.json(), tipoRes.json(), accMatRes.json(), accPerRes.json()
      ])

      setCategorias(catData.data)
      setTiposMaterial(tipoData.data)
      setAccionesMaterial(accMatData.data)
      setAccionesPersona(accPerData.data)
    } catch (error) {
      console.error('❌ Error al cargar catálogos:', error)
    }
  }
  fetchCatalogos()
}, [])


  useEffect(() => {
    const fetchAccionesPersona = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/acciones-persona')
        const data = await res.json()
        if (data.success) setAccionesPersona(data.data)
      } catch (error) {
        console.error('❌ Error al traer acciones sobre personas:', error)
      }
    }
    fetchAccionesPersona()
  }, [])

  useEffect(() => {
  const fetchAccionesMaterial = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/acciones-material')
      const data = await res.json()
      if (data.success) setAccionesMaterial(data.data)
    } catch (error) {
      console.error('❌ Error al traer acciones sobre el material:', error)
    }
  }
  fetchAccionesMaterial()
}, [])

  useEffect(() => {
    const fetchTipos = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/tipos-materiales-involucrados')
        const data = await res.json()
        if (data.success) {
          setTiposMateriales(data.data)
        }
      } catch (error) {
        console.error('❌ Error al traer tipos de materiales:', error)
      }
    }
    fetchTipos()
  }, [])

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

  const guardarLocalmente = () => {
    localStorage.setItem(storageKey, JSON.stringify(formData))
    alert('Datos guardados localmente. Podés continuar después.')
  }

  const buildDto = () => {
    // Construir el objeto como lo espera el backend
    return {
      idIncidente: incidenteBasico?.id,
      idCategoria: parseInt(formData.categoria) || null,
      cantidadMateriales: parseInt(formData.cantidadMateriales) || 0,
      otraAccionMaterial: formData.otraAccionMaterial || null,
      otraAccionPersona: formData.otraAccionPersona || null,
      detalleOtrasAccionesPersona: formData.detalleAccionesPersona || null,
      cantidadSuperficieEvacuada: formData.superficieEvacuada || null,
      detalle: formData.detalle || null,

      // Arrays de IDs de ejemplo (simples por ahora)
      tiposMateriales: Object.keys(formData)
        .filter((key) => key.startsWith('material') && formData[key] === true)
        .map((key, i) => i + 1),

      accionesMaterial: Object.keys(formData)
        .filter((key) => key.startsWith('accion') && formData[key] === true)
        .map((key, i) => i + 1),

      accionesPersona: Object.keys(formData)
        .filter((key) => key.startsWith('personaAccion') && formData[key] === true)
        .map((key, i) => i + 1),

      // Damnificados como array único por ahora
      damnificados: [
        {
          nombre: formData.nombre || null,
          apellido: formData.apellido || null,
          domicilio: formData.domicilio || null,
          telefono: formData.telefono || null,
          dni: formData.dni || null,
          fallecio: formData.fallecio || false
        }
      ]
    }
  }

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
                {tiposMateriales.map(tipo => (
                  <div className="form-check" key={tipo.idTipoMatInvolucrado}>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`material${tipo.idTipoMatInvolucrado}`}
                      checked={formData[`material${tipo.idTipoMatInvolucrado}`] || false}
                      onChange={handleChange}
                    />
                    <label className="text-black form-check-label" htmlFor={`material${tipo.idTipoMatInvolucrado}`}>
                      {tipo.nombre}
                    </label>
                  </div>
                ))}
              </fieldset>
            </div>

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
                    <label className="text-black form-check-label" htmlFor={`accion${accion.idAccionMaterial}`}>
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
                <label className="text-black form-check-label" htmlFor={`personaAccion${accion.idAccionPersona}`}>
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
          <div className="row mb-3">
            <div className="col">
              <label className="text-black form-label">Nombre</label>
              <input
                type="text"
                className="form-control"
                id="nombre"
                value={formData.nombre || ''}
                onChange={handleChange}
              />
            </div>
            <div className="col">
              <label className="text-black form-label">Apellido</label>
              <input
                type="text"
                className="form-control"
                id="apellido"
                value={formData.apellido || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col">
              <label className="text-black form-label">Domicilio</label>
              <input
                type="text"
                className="form-control"
                id="domicilio"
                value={formData.domicilio || ''}
                onChange={handleChange}
              />
            </div>
            <div className="col">
              <label className="text-black form-label">Teléfono</label>
              <input
                type="tel"
                className="form-control"
                id="telefono"
                value={formData.telefono || ''}
                onChange={handleChange}
              />
            </div>
            <div className="col">
              <label className="text-black form-label">DNI</label>
              <input
                type="text"
                className="form-control"
                id="dni"
                value={formData.dni || ''}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="mb-3 form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="fallecio"
              checked={formData.fallecio || false}
              onChange={handleChange}
            />
            <label className="text-black form-check-label" htmlFor="fallecio">¿Falleció?</label>
          </div>

          {/* Botones */} 
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
          <div ref={toastRef} tabIndex={-1} className="alert alert-danger mt-3" role="alert">{errorMsg}</div>
        )}
        {successMsg && (
          <div ref={toastRef} tabIndex={-1} className="alert alert-success mt-3" role="alert">{successMsg}</div>
        )}
      </div>
    </div>
  )
}

export default MaterialPeligroso
