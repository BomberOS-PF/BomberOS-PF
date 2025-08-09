import { useState, useEffect, useRef } from 'react'
import './Rescate.css'
import '../../../DisenioFormulario/DisenioFormulario.css'

const Rescate = ({ datosPrevios = {}, onFinalizar }) => {
  const incidenteId = datosPrevios.idIncidente || datosPrevios.id || 'temp'
  const storageKey = `rescate-${incidenteId}`

  const [formData, setFormData] = useState(() => {
    const guardado = localStorage.getItem(storageKey)
    return guardado ? JSON.parse(guardado) : {
      lugar: '',
      otroLugar: '',
      detalle: '',
      damnificados: []
    }
  })

  const [mostrarOtroLugar, setMostrarOtroLugar] = useState(formData.lugar === 'Otro')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const toastRef = useRef(null)

  const incidenteBasico = datosPrevios.idIncidente || datosPrevios.id ? {
    id: datosPrevios.idIncidente || datosPrevios.id,
    tipo: datosPrevios.tipoSiniestro,
    fecha: datosPrevios.fechaHora || datosPrevios.fecha,
    localizacion: datosPrevios.localizacion,
    lugar: datosPrevios.lugar
  } : null

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...datosPrevios,
      damnificados: datosPrevios.damnificados || prev.damnificados || []
    }))
  }, [datosPrevios])

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))
    if (id === 'lugar') {
      setMostrarOtroLugar(value === 'Otro')
    }
  }

  const handleDamnificadoChange = (index, e) => {
    const { id, value, type, checked } = e.target
    const updatedDamnificados = [...formData.damnificados]
    updatedDamnificados[index][id] = type === 'checkbox' ? checked : value
    setFormData(prev => ({
      ...prev,
      damnificados: updatedDamnificados
    }))
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
    const updated = [...formData.damnificados]
    updated.splice(index, 1)
    setFormData(prev => ({
      ...prev,
      damnificados: updated
    }))
  }

  const guardarLocalmente = () => {
    localStorage.setItem(storageKey, JSON.stringify(formData))
    alert('Datos guardados localmente. Podés continuar después.')
  }

  // AHORA sí, POST al backend
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSuccessMsg('')
    setErrorMsg('')

    try {
      // Armamos el body con los campos correctos para el backend
      const body = {
        idIncidente: datosPrevios.idIncidente || datosPrevios.id,
        lugar: formData.lugar === 'Otro' ? formData.otroLugar : formData.lugar,
        detalle: formData.detalle,
        damnificados: formData.damnificados
      }

      // Mandamos el POST al backend (URL COMPLETA)
      console.log('Enviando rescate:', body)
      const resp = await fetch('http://localhost:3000/api/rescate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await resp.json()
      if (resp.ok && data.success) {
        setSuccessMsg('Rescate registrado correctamente')
        setErrorMsg('')
        localStorage.removeItem(storageKey)
        if (onFinalizar) onFinalizar()
      } else {
        setErrorMsg(data.error || data.message || 'Error al registrar rescate')
        setSuccessMsg('')
      }
    } catch (error) {
      setErrorMsg('Error al conectar con backend: ' + error.message)
      setSuccessMsg('')
    } finally {
      setLoading(false)
      if (toastRef.current) toastRef.current.focus()
    }
  }

  return (
    <div className="container d-flex justify-content-center align-items-center">
      <div className="formulario-consistente p-4 shadow rounded">
        <h2 className="text-black text-center mb-4">Rescate</h2>

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
          <div className="mb-3">
            <label className="text-black form-label">Lugar</label>
            <select className="form-select" id="lugar" value={formData.lugar || ''} onChange={handleChange}>
              <option disabled value="">Seleccione</option>
              <option>Arroyo</option>
              <option>Lago</option>
              <option>Bar</option>
              <option>Montaña</option>
              <option>Río</option>
              <option>Restaurant-Comedor</option>
              <option>Otro</option>
            </select>
          </div>

          {mostrarOtroLugar && (
            <div className="mb-3">
              <label className="text-black form-label">Describa el otro tipo de lugar</label>
              <input type="text" className="form-control" id="otroLugar" value={formData.otroLugar || ''} onChange={handleChange} />
            </div>
          )}

          <div className="mb-3">
            <label className="text-black form-label">Detalle de lo sucedido</label>
            <textarea className="form-control" rows="3" id="detalle" value={formData.detalle || ''} onChange={handleChange}></textarea>
          </div>

          <h5 className="text-white mt-4">Personas damnificadas</h5>

          {formData.damnificados.map((dam, index) => (
            <div key={index} className="border rounded p-3 mb-3 bg-light-subtle">
              <div className="row mb-2">
                <div className="col">
                  <label className="form-label text-black">Nombre</label>
                  <input type="text" className="form-control" id="nombre" value={dam.nombre || ''} onChange={(e) => handleDamnificadoChange(index, e)} />
                </div>
                <div className="col">
                  <label className="form-label text-black">Apellido</label>
                  <input type="text" className="form-control" id="apellido" value={dam.apellido || ''} onChange={(e) => handleDamnificadoChange(index, e)} />
                </div>
              </div>

              <div className="row mb-2">
                <div className="col">
                  <label className="form-label text-black">Domicilio</label>
                  <input type="text" className="form-control" id="domicilio" value={dam.domicilio || ''} onChange={(e) => handleDamnificadoChange(index, e)} />
                </div>
                <div className="col">
                  <label className="form-label text-black">Teléfono</label>
                  <input type="text" className="form-control" id="telefono" value={dam.telefono || ''} onChange={(e) => handleDamnificadoChange(index, e)} />
                </div>
                <div className="col">
                  <label className="form-label text-black">DNI</label>
                  <input type="text" className="form-control" id="dni" value={dam.dni || ''} onChange={(e) => handleDamnificadoChange(index, e)} />
                </div>
              </div>

              <div className="form-check mb-2">
                <input type="checkbox" className="form-check-input" id="fallecio" checked={dam.fallecio || false} onChange={(e) => handleDamnificadoChange(index, e)} />
                <label className="form-check-label text-black" htmlFor="fallecio">¿Falleció?</label>
              </div>

              <div className="text-end">
                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => eliminarDamnificado(index)}>❌ Eliminar</button>
              </div>
            </div>
          ))}

          <button type="button" className="btn btn-sm btn-outline-primary mb-3" onClick={agregarDamnificado}>➕ Agregar damnificado</button>

          <button type="submit" className="btn btn-danger w-100 mt-3" disabled={loading}>
            {loading ? 'Cargando...' : (datosPrevios.idIncidente || datosPrevios.id ? 'Actualizar rescate' : 'Finalizar carga')}
          </button>
          <button type="button" className="btn btn-secondary w-100 mt-2" onClick={guardarLocalmente} disabled={loading}>
            Guardar y continuar después
          </button>
        </form>

        {errorMsg && <div ref={toastRef} tabIndex={-1} className="alert alert-danger mt-3" role="alert">{errorMsg}</div>}
        {successMsg && <div ref={toastRef} tabIndex={-1} className="alert alert-success mt-3" role="alert">{successMsg}</div>}
      </div>
    </div>
  )
}

export default Rescate
