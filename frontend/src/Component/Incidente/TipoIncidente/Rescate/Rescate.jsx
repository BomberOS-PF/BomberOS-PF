import { useState, useEffect, useRef } from 'react'
import './Rescate.css'
import '../../../DisenioFormulario/DisenioFormulario.css'
import { API_URLS, apiRequest } from '../../../../config/api'

const Rescate = ({ datosPrevios = {}, onFinalizar }) => {
  const incidenteId = datosPrevios.idIncidente || datosPrevios.id || 'temp'
  const storageKey = `rescate-${incidenteId}`

  const [formData, setFormData] = useState(() => {
    const guardado = localStorage.getItem(storageKey)
    return guardado
      ? JSON.parse(guardado)
      : {
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

  // Información del incidente base
  const incidenteBasico = datosPrevios.idIncidente || datosPrevios.id
    ? {
        id: datosPrevios.idIncidente || datosPrevios.id,
        tipo: datosPrevios.tipoSiniestro,
        fecha: datosPrevios.fechaHora || datosPrevios.fecha,
        localizacion: datosPrevios.localizacion,
        lugar: datosPrevios.lugar
      }
    : null

  // Merge con datosPrevios sin pisar damnificados ya cargados
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...datosPrevios,
      damnificados: Array.isArray(prev.damnificados) ? prev.damnificados : []
    }))
  }, [datosPrevios])

  // Mantener en sync el toggle "Otro"
  useEffect(() => {
    setMostrarOtroLugar((formData.lugar || '') === 'Otro')
  }, [formData.lugar])

  // Handlers
  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleDamnificadoChange = (index, e) => {
    const { id, value, type, checked } = e.target
    const updated = [...(formData.damnificados || [])]
    updated[index] = { ...updated[index], [id]: type === 'checkbox' ? checked : value }
    setFormData(prev => ({ ...prev, damnificados: updated }))
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
    setFormData(prev => ({
      ...prev,
      damnificados: (prev.damnificados || []).filter((_, i) => i !== index)
    }))
  }

  const guardarLocalmente = () => {
    localStorage.setItem(storageKey, JSON.stringify(formData))
    alert('Datos guardados localmente. Podés continuar después.')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSuccessMsg('')
    setErrorMsg('')

    try {
      // Snapshot local
      localStorage.setItem(storageKey, JSON.stringify(formData))

      const body = {
        idIncidente: incidenteId,
        lugar: formData.lugar === 'Otro' ? formData.otroLugar : formData.lugar,
        detalle: formData.detalle,
        damnificados: formData.damnificados
      }

      const resp = await apiRequest(API_URLS.incidentes.createRescate, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!resp?.success) {
        throw new Error(resp?.message || 'Error al registrar rescate')
      }

      const esActualizacion = !!(datosPrevios.idIncidente || datosPrevios.id)
      setSuccessMsg(esActualizacion ? 'Rescate actualizado correctamente' : '✅ Rescate registrado correctamente')
      setErrorMsg('')
      localStorage.removeItem(storageKey)
      onFinalizar?.({ idIncidente: incidenteId })
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
            <label htmlFor="lugar" className="text-black form-label">Lugar</label>
            <select
              className="form-select"
              id="lugar"
              value={formData.lugar || ''}
              onChange={handleChange}
            >
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
              <label htmlFor="otroLugar" className="text-black form-label">Describa el otro tipo de lugar</label>
              <input
                type="text"
                className="form-control"
                id="otroLugar"
                value={formData.otroLugar || ''}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="mb-3">
            <label htmlFor="detalle" className="text-black form-label">Detalle de lo sucedido</label>
            <textarea
              className="form-control"
              rows="3"
              id="detalle"
              value={formData.detalle || ''}
              onChange={handleChange}
            ></textarea>
          </div>

          <h5 className="text-white mt-4">Personas damnificadas</h5>

          {(formData.damnificados || []).map((dam, index) => {
            const base = `dam-${index}`
            return (
              <div key={index} className="border rounded p-3 mb-3 bg-light-subtle">
                <div className="row mb-2">
                  <div className="col">
                    <label htmlFor={`${base}-nombre`} className="form-label text-black">Nombre</label>
                    <input type="text" className="form-control" id="nombre" value={dam.nombre || ''} onChange={(e) => handleDamnificadoChange(index, e)} />
                  </div>
                  <div className="col">
                    <label htmlFor={`${base}-apellido`} className="form-label text-black">Apellido</label>
                    <input type="text" className="form-control" id="apellido" value={dam.apellido || ''} onChange={(e) => handleDamnificadoChange(index, e)} />
                  </div>
                </div>

                <div className="row mb-2">
                  <div className="col">
                    <label htmlFor={`${base}-domicilio`} className="form-label text-black">Domicilio</label>
                    <input type="text" className="form-control" id="domicilio" value={dam.domicilio || ''} onChange={(e) => handleDamnificadoChange(index, e)} />
                  </div>
                  <div className="col">
                    <label htmlFor={`${base}-telefono`} className="form-label text-black">Teléfono</label>
                    <input type="text" className="form-control" id="telefono" value={dam.telefono || ''} onChange={(e) => handleDamnificadoChange(index, e)} />
                  </div>
                  <div className="col">
                    <label htmlFor={`${base}-dni`} className="form-label text-black">DNI</label>
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
            )
          })}

          <button type="button" className="btn btn-sm btn-outline-primary mb-3" onClick={agregarDamnificado}>
            ➕ Agregar damnificado
          </button>

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
