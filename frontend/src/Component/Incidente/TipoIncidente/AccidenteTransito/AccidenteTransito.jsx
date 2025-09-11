import { useState, useEffect, useRef } from 'react'
import Select from 'react-select'

const AccidenteTransito = ({ datosPrevios = {}, onFinalizar }) => {
  const incidenteId = datosPrevios.idIncidente || datosPrevios.id || 'temp'
  const storageKey = `accidente-${incidenteId}`

  const [formData, setFormData] = useState(() => {
    const guardado = localStorage.getItem(storageKey)
    const savedData = guardado ? JSON.parse(guardado) : { vehiculos: [], damnificados: [] }

    // Mapear los nombres de campos del backend a los nombres que usa el frontend
    const datosPreviosMapeados = {
      ...datosPrevios,
      // Mapear campos específicos del accidente de tránsito
      detalle: datosPrevios.detalle || datosPrevios.descripcion, // Mapear descripcion del backend a detalle del frontend
      causaAccidente: datosPrevios.causaAccidente || datosPrevios.idCausaAccidente,
      vehiculos: datosPrevios.vehiculos || [],
      damnificados: datosPrevios.damnificados || []
    }

    // Combinar datos guardados con datos previos mapeados, dando prioridad a los datos previos
    const combined = { ...savedData, ...datosPreviosMapeados }

    return combined
  })

  const [causasAccidente, setCausasAccidente] = useState([])
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [errors, setErrors] = useState({})
  const [damnificadosErrors, setDamnificadosErrors] = useState([])
  const toastRef = useRef(null)

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
        // Mapear campos específicos del accidente de tránsito
        detalle: datosPrevios.detalle || datosPrevios.descripcion, // Mapear descripcion del backend a detalle del frontend
        causaAccidente: datosPrevios.causaAccidente || datosPrevios.idCausaAccidente,
        vehiculos: datosPrevios.vehiculos || [],
        damnificados: datosPrevios.damnificados || []
      }

      setFormData(prev => ({ ...prev, ...datosMapeados }))
    }
  }, [datosPrevios])

  useEffect(() => {
    const fetchCausas = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/causa-accidente')
        const data = await res.json()
        if (data.success) {
          setCausasAccidente(data.data)
        } else {
          console.error('Error en la respuesta:', data.error)
        }
      } catch (err) {
        console.error('Error al conectar con backend:', err)
      }
    }

    fetchCausas()
  }, [])

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }))
  }

  const handleVehiculoChange = (index, field, value) => {
    const nuevosVehiculos = [...formData.vehiculos]
    nuevosVehiculos[index][field] = value
    setFormData(prev => ({
      ...prev,
      vehiculos: nuevosVehiculos
    }))
  }

  const agregarVehiculo = () => {
    setFormData(prev => ({
      ...prev,
      vehiculos: [
        ...(prev.vehiculos || []),
        { patente: '', modelo: '', marca: '', anio: '', aseguradora: '', poliza: '' }
      ]
    }))
  }

  const eliminarVehiculo = (index) => {
    const nuevosVehiculos = formData.vehiculos.filter((_, i) => i !== index)
    setFormData(prev => ({
      ...prev,
      vehiculos: nuevosVehiculos
    }))
  }

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

  const validate = () => {
    const newErrors = {}

    // Validar causa del accidente (obligatorio)
    if (!formData.idCausaAccidente || formData.idCausaAccidente === "") {
      newErrors.idCausaAccidente = 'Campo obligatorio'
    }

    // Validar que haya al menos un vehículo
    if (!formData.vehiculos || formData.vehiculos.length === 0) {
      newErrors.vehiculos = 'Debe agregar al menos un vehículo involucrado'
    }

    // Validar detalle (obligatorio)
    if (!formData.detalle || formData.detalle.trim() === '') {
      newErrors.detalle = 'Campo obligatorio'
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

  const handleSubmit = async () => {
    setSuccessMsg('')
    setErrorMsg('')

    if (!validate()) {
      setErrorMsg('Por favor complete los campos obligatorios.');
      if (toastRef.current) toastRef.current.focus();
      return;
    }

    setLoading(true)

    const payload = {
      idIncidente: datosPrevios.idIncidente || datosPrevios.id,
      descripcion: formData.detalle,
      idCausaAccidente: parseInt(formData.idCausaAccidente),
      vehiculos: formData.vehiculos,
      damnificados: formData.damnificados
    }

    try {
      const esActualizacion = datosPrevios.idIncidente || datosPrevios.id
      const method = esActualizacion ? 'PUT' : 'POST'
      const url = esActualizacion ?
        'http://localhost:3000/api/incidentes/accidente-transito' :
        'http://localhost:3000/api/accidentes'

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (data.success) {
        const mensajeExito = esActualizacion ?
          'Accidente de tránsito actualizado con éxito' :
          'Accidente de tránsito registrado exitosamente'

        setSuccessMsg(mensajeExito)
        setErrorMsg('')
        localStorage.removeItem(storageKey)

        // Pasar el resultado completo al callback
        if (onFinalizar) {
          onFinalizar({
            success: true,
            message: mensajeExito,
            data: data,
            esActualizacion
          })
        }
      } else {
        const mensajeError = 'Error al ' + (esActualizacion ? 'actualizar' : 'registrar') + ': ' + (data.message || '')
        setErrorMsg(mensajeError)
        setSuccessMsg('')
        console.error(data)

        // También pasar el error al callback
        if (onFinalizar) {
          onFinalizar({
            success: false,
            message: mensajeError,
            error: data
          })
        }
      }
    } catch (error) {
      const mensajeError = 'Error al conectar con el backend'
      setErrorMsg(mensajeError)
      setSuccessMsg('')
      console.error('Error al enviar:', error)

      if (onFinalizar) {
        onFinalizar({
          success: false,
          message: mensajeError,
          error
        })
      }
    } finally {
      setLoading(false)
      if (toastRef.current) toastRef.current.focus()
    }
  }

  return (
    <div className="container-fluid py-5">
      <div className="card shadow-sm border-0 bg-white bg-opacity-1 backdrop-blur-sm">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="idCausaAccidente" className="form-label text-dark d-flex align-items-center gap-2">Causa del accidente *</label>
              <Select
                options={causasAccidente.map(c => ({
                  value: c.idCausaAccidente,
                  label: c.descripcion
                }))}
                value={
                  causasAccidente
                    .map(c => ({ value: c.idCausaAccidente, label: c.descripcion }))
                    .find(opt => opt.value === formData.idCausaAccidente) || null
                }
                onChange={(opcion) =>
                  setFormData(prev => ({ ...prev, idCausaAccidente: opcion ? opcion.value : '' }))
                }
                classNamePrefix="rs"
                placeholder="Seleccionar causa del accidente"
                isClearable
              />
              {errors.idCausaAccidente && <div className="invalid-feedback" id="error-idCausaAccidente">{errors.idCausaAccidente}</div>}
            </div>

            <h5 className="text-black mt-3 mb-2">Vehículos involucrados</h5>
            {formData.vehiculos.map((vehiculo, index) => (
              <div className="row mb-2 align-items-center" key={index}>
                <div className="col">
                  <label className="text-black form-label">Patente</label>
                  <input type="text" className="form-control form-control-sm" value={vehiculo.patente} onChange={(e) => handleVehiculoChange(index, 'patente', e.target.value)} />
                </div>
                <div className="col">
                  <label className="text-black form-label">Modelo</label>
                  <input type="text" className="form-control form-control-sm" value={vehiculo.modelo} onChange={(e) => handleVehiculoChange(index, 'modelo', e.target.value)} />
                </div>
                <div className="col">
                  <label className="text-black form-label">Marca</label>
                  <input type="text" className="form-control form-control-sm" value={vehiculo.marca} onChange={(e) => handleVehiculoChange(index, 'marca', e.target.value)} />
                </div>
                <div className="col">
                  <label className="text-black form-label">Año</label>
                  <input type="number" className="form-control form-control-sm" value={vehiculo.anio} onChange={(e) => handleVehiculoChange(index, 'anio', parseInt(e.target.value))} />
                </div>
                <div className="col">
                  <label className="text-black form-label">Aseguradora</label>
                  <input type="text" className="form-control form-control-sm" value={vehiculo.aseguradora} onChange={(e) => handleVehiculoChange(index, 'aseguradora', e.target.value)} />
                </div>
                <div className="col">
                  <label className="text-black form-label">Póliza</label>
                  <input type="text" className="form-control form-control-sm" value={vehiculo.poliza} onChange={(e) => handleVehiculoChange(index, 'poliza', e.target.value)} />
                </div>
                <div className="col-auto d-flex align-items-center pt-4">
                  <button type="button" className="btn btn-outline-danger btn-xs px-2 py-1" onClick={() => eliminarVehiculo(index)}>
                    ❌
                  </button>
                </div>
              </div>
            ))}

            <div className="d-flex justify-content-end mb-3">
              <button type="button" className="btn btn-sm btn-success" onClick={agregarVehiculo}>+ Agregar vehículo</button>
            </div>

            {errors.vehiculos && (
              <div className="alert alert-danger" role="alert">
                {errors.vehiculos}
              </div>
            )}

            <div className="mb-3">
              <label className="text-black form-label">Detalle de lo sucedido *</label>
              <textarea className={`form-control${errors.detalle ? ' is-invalid' : ''}`} rows="3" id="detalle" value={formData.detalle || ''} onChange={handleChange} aria-describedby="error-detalle"></textarea>
              {errors.detalle && <div className="invalid-feedback" id="error-detalle">{errors.detalle}</div>}
            </div>

            <h5 className="text-black mt-4">Personas damnificadas</h5>
            {formData.damnificados.map((d, index) => (
              <div key={index} className="border rounded p-3 mb-3">
                <div className="row mb-2">
                  <div className="col">
                    <label className="text-black form-label">Nombre {!damnificadoVacio(d) ? '*' : ''}</label>
                    <input type="text" className={`form-control${damnificadosErrors[index]?.nombre ? ' is-invalid' : ''}`} value={d.nombre} onChange={(e) => handleDamnificadoChange(index, 'nombre', e.target.value)} />
                    {damnificadosErrors[index]?.nombre && <div className="invalid-feedback">{damnificadosErrors[index].nombre}</div>}
                  </div>
                  <div className="col">
                    <label className="text-black form-label">Apellido {!damnificadoVacio(d) ? '*' : ''}</label>
                    <input type="text" className={`form-control${damnificadosErrors[index]?.apellido ? ' is-invalid' : ''}`} value={d.apellido} onChange={(e) => handleDamnificadoChange(index, 'apellido', e.target.value)} />
                    {damnificadosErrors[index]?.apellido && <div className="invalid-feedback">{damnificadosErrors[index].apellido}</div>}
                  </div>
                </div>
                <div className="mb-2">
                  <label className="text-black form-label">Domicilio</label>
                  <input type="text" className="form-control" value={d.domicilio} onChange={(e) => handleDamnificadoChange(index, 'domicilio', e.target.value)} />
                </div>
                <div className="row mb-2">
                  <div className="col">
                    <label className="text-black form-label">Teléfono</label>
                    <input type="tel" className={`form-control${damnificadosErrors[index]?.telefono ? ' is-invalid' : ''}`} value={d.telefono} onChange={(e) => handleDamnificadoChange(index, 'telefono', e.target.value)} />
                    {damnificadosErrors[index]?.telefono && <div className="invalid-feedback">{damnificadosErrors[index].telefono}</div>}
                  </div>
                  <div className="col">
                    <label className="text-black form-label">DNI</label>
                    <input type="text" className={`form-control${damnificadosErrors[index]?.dni ? ' is-invalid' : ''}`} value={d.dni} onChange={(e) => handleDamnificadoChange(index, 'dni', e.target.value)} />
                    {damnificadosErrors[index]?.dni && <div className="invalid-feedback">{damnificadosErrors[index].dni}</div>}
                  </div>
                </div>
                <div className="form-check mb-2">
                  <input type="checkbox" className="form-check-input" checked={d.fallecio} onChange={(e) => handleDamnificadoChange(index, 'fallecio', e.target.checked)} />
                  <label className="form-check-label text-black">¿Falleció?</label>
                </div>
                <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => eliminarDamnificado(index)}>❌ Eliminar damnificado</button>
              </div>
            ))}

            <div className="d-flex justify-content-end mb-3">
              <button type="button" className="btn btn-sm btn-success" onClick={agregarDamnificado}>+ Agregar damnificado</button>
            </div>

            <button type="button" className="btn btn-danger w-100 mt-3" disabled={loading} onClick={() => handleSubmit()}>
              {loading ? 'Cargando...' : (datosPrevios.idIncidente || datosPrevios.id ? 'Actualizar accidente de tránsito' : 'Finalizar carga')}
            </button>

            <button type="button" className="btn btn-secondary w-100 mt-2" onClick={guardarLocalmente} disabled={loading}>
              Guardar y continuar después
            </button>
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

export default AccidenteTransito
