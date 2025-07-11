import { useState, useEffect } from 'react'
import './AccidenteTransito.css'
import '../../../DisenioFormulario/DisenioFormulario.css'

const AccidenteTransito = ({ datosPrevios = {}, onFinalizar }) => {
  const incidenteId = datosPrevios.id || 'temp'
  const storageKey = `accidente-${incidenteId}`

  const [formData, setFormData] = useState(() => {
    const guardado = localStorage.getItem(storageKey)
    return guardado ? JSON.parse(guardado) : { vehiculos: [] , damnificados: []}
  })

  const [causasAccidente, setCausasAccidente] = useState([])

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...datosPrevios,
      vehiculos: datosPrevios.vehiculos || prev.vehiculos || []
    }))
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    const payload = {
      idIncidente: datosPrevios.idIncidente,
      descripcion: formData.detalle,
      idCausaAccidente: parseInt(formData.idCausaAccidente),
      vehiculos: formData.vehiculos,
      damnificados: formData.damnificados
    }

    try {
      const res = await fetch('http://localhost:3000/api/accidentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (data.success) {
        alert('Accidente registrado exitosamente')
        localStorage.removeItem(storageKey)
        if (onFinalizar) onFinalizar({ id: datosPrevios.id })
      } else {
        alert('Error al registrar: ' + (data.message || ''))
        console.error(data)
      }
    } catch (error) {
      alert('Error al conectar con el backend')
      console.error('Error al enviar:', error)
    }
  }

  return (
    <div className="container d-flex justify-content-center align-items-center">
      <div className="formulario-consistente">
        <h2 className="text-black text-center mb-4">Accidente de Tránsito</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="idCausaAccidente" className="text-black form-label">Causa del accidente</label>
            <select
              className="form-select"
              id="idCausaAccidente"
              onChange={handleChange}
              value={formData.idCausaAccidente || ''}
            >
              <option disabled value="">Seleccione causa</option>
              {causasAccidente.map((causa) => (
                <option key={causa.idCausaAccidente} value={causa.idCausaAccidente}>
                  {causa.descripcion}
                </option>
              ))}
            </select>
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

          <div className="mb-3">
            <label className="text-black form-label">Detalle de lo sucedido</label>
            <textarea className="form-control" rows="3" id="detalle" value={formData.detalle || ''} onChange={handleChange}></textarea>
          </div>

          <h5 className="text-black mt-4">Personas damnificadas</h5>
          {formData.damnificados.map((d, index) => (
            <div key={index} className="border rounded p-3 mb-3">
              <div className="row mb-2">
                <div className="col">
                  <label className="text-black form-label">Nombre</label>
                  <input type="text" className="form-control" value={d.nombre} onChange={(e) => handleDamnificadoChange(index, 'nombre', e.target.value)} />
                </div>
                <div className="col">
                  <label className="text-black form-label">Apellido</label>
                  <input type="text" className="form-control" value={d.apellido} onChange={(e) => handleDamnificadoChange(index, 'apellido', e.target.value)} />
                </div>
              </div>
              <div className="mb-2">
                <label className="text-black form-label">Domicilio</label>
                <input type="text" className="form-control" value={d.domicilio} onChange={(e) => handleDamnificadoChange(index, 'domicilio', e.target.value)} />
              </div>
              <div className="row mb-2">
                <div className="col">
                  <label className="text-black form-label">Teléfono</label>
                  <input type="tel" className="form-control" value={d.telefono} onChange={(e) => handleDamnificadoChange(index, 'telefono', e.target.value)} />
                </div>
                <div className="col">
                  <label className="text-black form-label">DNI</label>
                  <input type="text" className="form-control" value={d.dni} onChange={(e) => handleDamnificadoChange(index, 'dni', e.target.value)} />
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

          <button type="submit" className="btn btn-danger w-100 mt-3">
            Finalizar carga
          </button>

          <button type="button" className="btn btn-secondary w-100 mt-2" onClick={guardarLocalmente}>
            Guardar y continuar después
          </button>
        </form>
      </div>
    </div>
  )
}

export default AccidenteTransito
