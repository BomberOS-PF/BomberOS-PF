import { useState, useEffect } from 'react'
import './AccidenteTransito.css'

const AccidenteTransito = ({ datosPrevios = {}, onFinalizar }) => {
  const incidenteId = datosPrevios.id || 'temp'
  const storageKey = `accidente-${incidenteId}`

  const [formData, setFormData] = useState(() => {
    const guardado = localStorage.getItem(storageKey)
    return guardado ? JSON.parse(guardado) : {
      vehiculos: [],
      causaAccidente: '',
      detalle: '',
      nombreDamnificado: '',
      apellidoDamnificado: '',
      domicilioDamnificado: '',
      telefonoDamnificado: '',
      dniDamnificado: '',
      fallecio: false
    }
  })

  const [causasAccidente, setCausasAccidente] = useState([])

  useEffect(() => {
    if (Object.keys(datosPrevios).length > 0) {
      setFormData(prev => ({
        ...prev,
        ...datosPrevios,
        vehiculos: Array.isArray(datosPrevios.vehiculos) ? datosPrevios.vehiculos : prev.vehiculos
      }))
    }
  }, [datosPrevios])

  useEffect(() => {
    const fetchCausas = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/causas-accidente')
        const data = await res.json()
        setCausasAccidente(data.data)
      } catch (error) {
        console.error('Error al cargar causas de accidente:', error)
      }
    }

    fetchCausas()
  }, [])

  const handleVehiculoChange = (index, field, value) => {
    const nuevosVehiculos = [...formData.vehiculos]
    nuevosVehiculos[index][field] = value
    setFormData(prev => ({
      ...prev,
      vehiculos: nuevosVehiculos,
      cantidadVehiculos: nuevosVehiculos.length
    }))
  }

  const agregarVehiculo = () => {
    const nuevosVehiculos = [
      ...(formData.vehiculos || []),
      { tipo: '', dominio: '', cantidad: '', modelo: '', anio: '', aseguradora: '', poliza: '' }
    ]
    setFormData(prev => ({
      ...prev,
      vehiculos: nuevosVehiculos,
      cantidadVehiculos: nuevosVehiculos.length
    }))
  }

  const eliminarVehiculo = (index) => {
    const nuevosVehiculos = formData.vehiculos.filter((_, i) => i !== index)
    setFormData(prev => ({
      ...prev,
      vehiculos: nuevosVehiculos,
      cantidadVehiculos: nuevosVehiculos.length
    }))
  }

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: id === 'causaAccidente' ? parseInt(value) : (type === 'checkbox' ? checked : value)
    }))
  }

  const guardarLocalmente = () => {
    localStorage.setItem(storageKey, JSON.stringify(formData))
    alert('Datos guardados localmente. Podés continuar después.')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const datos = {
      idIncidente: datosPrevios.idIncidente || datosPrevios.id,
      idCausaAccidente: formData.causaAccidente,
      detalle: formData.detalle,
      vehiculosInvolucrados: (formData.vehiculos || []).map(v => ({
        tipo: v.tipo,
        dominio: v.dominio,
        cantidad: parseInt(v.cantidad),
        modelo: v.modelo,
        anio: parseInt(v.anio),
        aseguradora: v.aseguradora,
        poliza: v.poliza
      })),
      damnificados: [
        {
          nombre: formData.nombreDamnificado,
          apellido: formData.apellidoDamnificado,
          domicilio: formData.domicilioDamnificado,
          telefono: formData.telefonoDamnificado,
          dni: formData.dniDamnificado,
          fallecio: formData.fallecio
        }
      ]
    }
    console.log('➡️ Enviando al backend:', datos)
    try {
      const response = await fetch('http://localhost:3000/api/accidentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      })

      const result = await response.json()

      if (response.ok) {
        console.log('✅ Accidente registrado correctamente:', result)
        localStorage.removeItem(storageKey)
        if (onFinalizar) onFinalizar()
      } else {
        console.error('❌ Error en la respuesta del servidor:', result.message)
        alert('Error: ' + result.message)
      }
    } catch (error) {
      console.error('❌ Error al enviar datos:', error)
      alert('Error al conectar con el servidor.')
    }
  }


  return (
    <div className="container d-flex justify-content-center align-items-center">
      <div className="form-accidente p-4 shadow rounded">
        <h2 className="text-white text-center mb-4">Accidente de Tránsito</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="causaAccidente" className="form-label">Causa del accidente</label>
            <select className="form-select" id="causaAccidente" onChange={handleChange} value={formData.causaAccidente || ''}>
              <option disabled value="">Seleccione causa</option>
              {causasAccidente.map(causa => (
                <option key={causa.idCausaAccidente} value={causa.idCausaAccidente}>
                  {causa.nombreCausaAccidenteTransito}
                </option>
              ))}
            </select>
          </div>

          <h5 className="text-white mt-3 mb-2">Vehículos involucrados</h5>
          {Array.isArray(formData.vehiculos) && formData.vehiculos.map((vehiculo, index) => (
            <div className="row mb-2 align-items-center" key={index}>
              <div className="col"><label className="form-label">Tipo</label><input type="text" className="form-control form-control-sm" value={vehiculo.tipo} onChange={(e) => handleVehiculoChange(index, 'tipo', e.target.value)} /></div>
              <div className="col"><label className="form-label">Dominio</label><input type="text" className="form-control form-control-sm" value={vehiculo.dominio} onChange={(e) => handleVehiculoChange(index, 'dominio', e.target.value)} /></div>
              <div className="col"><label className="form-label">Cantidad</label><input type="number" className="form-control form-control-sm" value={vehiculo.cantidad} onChange={(e) => handleVehiculoChange(index, 'cantidad', e.target.value)} /></div>
              <div className="col"><label className="form-label">Modelo</label><input type="text" className="form-control form-control-sm" value={vehiculo.modelo} onChange={(e) => handleVehiculoChange(index, 'modelo', e.target.value)} /></div>
              <div className="col"><label className="form-label">Año</label><input type="number" className="form-control form-control-sm" value={vehiculo.anio} onChange={(e) => handleVehiculoChange(index, 'anio', e.target.value)} /></div>
              <div className="col"><label className="form-label">Aseguradora</label><input type="text" className="form-control form-control-sm" value={vehiculo.aseguradora} onChange={(e) => handleVehiculoChange(index, 'aseguradora', e.target.value)} /></div>
              <div className="col"><label className="form-label">Póliza</label><input type="text" className="form-control form-control-sm" value={vehiculo.poliza} onChange={(e) => handleVehiculoChange(index, 'poliza', e.target.value)} /></div>
              <div className="col-auto d-flex align-items-center pt-4"><button type="button" className="btn btn-outline-danger btn-xs px-2 py-1" onClick={() => eliminarVehiculo(index)}>❌</button></div>
            </div>
          ))}

          <input type="hidden" id="cantidadVehiculos" value={(formData.vehiculos || []).length} />

          <div className="d-flex justify-content-end mb-3">
            <button type="button" className="btn btn-sm btn-success" onClick={agregarVehiculo}>+ Agregar vehículo</button>
          </div>

          <div className="mb-3">
            <label className="form-label">Detalle de lo sucedido</label>
            <textarea className="form-control" rows="3" id="detalle" value={formData.detalle || ''} onChange={handleChange}></textarea>
          </div>

          <h5 className="text-white mt-4">Personas damnificadas</h5>
          <div className="row mb-3">
            <div className="col"><label className="form-label">Nombre</label><input type="text" className="form-control" id="nombreDamnificado" value={formData.nombreDamnificado || ''} onChange={handleChange} /></div>
            <div className="col"><label className="form-label">Apellido</label><input type="text" className="form-control" id="apellidoDamnificado" value={formData.apellidoDamnificado || ''} onChange={handleChange} /></div>
          </div>

          <div className="mb-3">
            <label className="form-label">Domicilio</label>
            <input type="text" className="form-control" id="domicilioDamnificado" value={formData.domicilioDamnificado || ''} onChange={handleChange} />
          </div>

          <div className="row mb-3">
            <div className="col"><label className="form-label">Teléfono</label><input type="tel" className="form-control" id="telefonoDamnificado" value={formData.telefonoDamnificado || ''} onChange={handleChange} /></div>
            <div className="col"><label className="form-label">DNI</label><input type="text" className="form-control" id="dniDamnificado" value={formData.dniDamnificado || ''} onChange={handleChange} /></div>
          </div>

          <div className="mb-3 form-check">
            <input type="checkbox" className="form-check-input" id="fallecio" checked={formData.fallecio || false} onChange={handleChange} />
            <label className="form-check-label" htmlFor="fallecio">¿Falleció?</label>
          </div>

          <button type="submit" className="btn btn-danger w-100 mt-3">Finalizar carga</button>
          <button type="button" className="btn btn-secondary w-100 mt-2" onClick={guardarLocalmente}>Guardar y continuar después</button>
        </form>
      </div>
    </div>
  )
}

export default AccidenteTransito
