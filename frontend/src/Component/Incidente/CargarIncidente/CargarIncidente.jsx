import { useState } from 'react'
import './CargarIncidente.css'
import '../../DisenioFormulario/DisenioFormulario.css'

const CargarIncidente = ({ onVolver, onNotificar }) => {
  const now = new Date()
  const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)

  const usuario = JSON.parse(localStorage.getItem('usuario'))
  console.log('🧾 Usuario cargado desde localStorage:', usuario)

  const [formData, setFormData] = useState({
    fechaHora: localDateTime,
    tipoSiniestro: '',
    localizacion: '',
    lugar: '',
    nombreDenunciante: '',
    apellidoDenunciante: '',
    telefonoDenunciante: '',
    dniDenunciante: ''
  })

  const [incidenteCreado, setIncidenteCreado] = useState(null)
  const [notificandoBomberos, setNotificandoBomberos] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const datosEsencialesCompletos = () => {
    return formData.tipoSiniestro && formData.localizacion && formData.lugar
  }

  const guardarIncidente = async () => {
    try {
      const tipoMap = {
        'Accidente': 1,
        'Factores Climáticos': 2,
        'Incendio Estructural': 3,
        'Incendio Forestal': 4,
        'Material Peligroso': 5,
        'Rescate': 6
      }

      const localizacionMap = {
        'Despeñaderos': 1,
        'Zona Rural': 2,
        'Zona Urbana': 3,
        'Zona Industrial': 4,
        'Zona Costera': 5,
        'Otros': 6
      }

      const payload = {
        dni: usuario?.dni,
        idTipoIncidente: tipoMap[formData.tipoSiniestro],
        fecha: formData.fechaHora,
        idLocalizacion: localizacionMap[formData.localizacion] || 99,
        descripcion: formData.lugar
      }

      if (
        formData.nombreDenunciante ||
        formData.apellidoDenunciante ||
        formData.telefonoDenunciante ||
        formData.dniDenunciante
      ) {
        payload.nombreDenunciante = formData.nombreDenunciante
        payload.apellidoDenunciante = formData.apellidoDenunciante
        payload.telefonoDenunciante = formData.telefonoDenunciante
        payload.dniDenunciante = formData.dniDenunciante
      }

      const response = await fetch('http://localhost:3000/api/incidentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar el incidente')
      }

      return data
    } catch (error) {
      console.error('❌ Error al guardar incidente:', error)
      throw error
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const incidenteGuardado = await guardarIncidente()
      alert('✅ Incidente guardado correctamente')
      setIncidenteCreado(incidenteGuardado)

      if (onNotificar) {
        onNotificar(formData.tipoSiniestro, incidenteGuardado)
      }

    } catch (error) {
      alert(`Error: ${error.message}`)
    }
  }

  const notificarBomberos = async () => {
    if (!datosEsencialesCompletos()) {
      alert('❌ Debe completar al menos el tipo de siniestro, localización y lugar del incidente')
      return
    }

    setNotificandoBomberos(true)

    try {
      let incidente = incidenteCreado
      if (!incidente) {
        console.log('💾 Guardando incidente automáticamente antes de notificar...')
        incidente = await guardarIncidente()
        setIncidenteCreado(incidente)
        console.log('✅ Incidente guardado:', incidente)
      }

      const response = await fetch(`http://localhost:3000/api/incidentes/${incidente.idIncidente}/notificar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const { totalBomberos, notificacionesExitosas, notificacionesFallidas } = data.data

        let mensaje = `🚨 ALERTA ENVIADA A BOMBEROS:\n\n`
        mensaje += `📍 Tipo: ${formData.tipoSiniestro}\n`
        mensaje += `📍 Ubicación: ${formData.localizacion} - ${formData.lugar}\n`
        mensaje += `📍 Fecha/Hora: ${formData.fechaHora}\n\n`
        mensaje += `📱 Total bomberos contactados: ${totalBomberos}\n`
        mensaje += `✅ Notificaciones exitosas: ${notificacionesExitosas}\n`
        if (notificacionesFallidas > 0) {
          mensaje += `❌ Notificaciones fallidas: ${notificacionesFallidas}\n`
        }

        mensaje += `\n✅ Incidente registrado y bomberos notificados correctamente.`
        alert(mensaje)

        if (onNotificar) {
          onNotificar(formData.tipoSiniestro, incidente)
        }
      } else {
        throw new Error(data.message || 'Error en la notificación')
      }

    } catch (error) {
      console.error('❌ Error al notificar bomberos:', error)
      alert(`❌ Error al notificar bomberos: ${error.message}`)
    } finally {
      setNotificandoBomberos(false)
    }
  }

  return (
    <div className="container-fluid p-4" style={{ maxHeight: 'calc(100vh - 5rem)', overflowY: 'auto' }}>
      <div className="form-wrapper shadow rounded bg-dark text-white p-4">
        <h2 className="mb-4">Cargar Incidente</h2>
        <form onSubmit={handleSubmit}>
          <h5 className="mb-3">🗓️ Datos del Incidente</h5>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="fechaHora" className="form-label">Fecha y hora</label>
              <input type="datetime-local" className="form-control" name="fechaHora" value={formData.fechaHora} onChange={handleChange} required />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="tipoSiniestro" className="form-label">Tipo de siniestro</label>
              <select className="form-select" name="tipoSiniestro" value={formData.tipoSiniestro} onChange={handleChange} required>
                <option value="">Seleccione</option>
                <option value="Accidente">Accidente</option>
                <option value="Factores Climáticos">Factores Climáticos</option>
                <option value="Incendio Estructural">Incendio Estructural</option>
                <option value="Incendio Forestal">Incendio Forestal</option>
                <option value="Material Peligroso">Material Peligroso</option>
                <option value="Rescate">Rescate</option>
              </select>
            </div>
          </div>

          <h5 className="mb-3 mt-4">📍 Ubicación</h5>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Zona</label>
              <select className="form-select" name="localizacion" value={formData.localizacion} onChange={handleChange} required>
                <option value="">Seleccione</option>
                <option value="Despeñaderos">Despeñaderos</option>
                <option value="Zona Rural">Zona Rural</option>
                <option value="Zona Urbana">Zona Urbana</option>
                <option value="Zona Industrial">Zona Industrial</option>
                <option value="Zona Costera">Zona Costera</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Lugar específico</label>
              <input type="text" className="form-control" name="lugar" value={formData.lugar} onChange={handleChange} required />
            </div>
          </div>

          <h5 className="mb-3 mt-4">👤 Denunciante (opcional)</h5>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Nombre</label>
              <input type="text" className="form-control" name="nombreDenunciante" value={formData.nombreDenunciante} onChange={handleChange} />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Apellido</label>
              <input type="text" className="form-control" name="apellidoDenunciante" value={formData.apellidoDenunciante} onChange={handleChange} />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Teléfono</label>
              <input type="tel" className="form-control" name="telefonoDenunciante" value={formData.telefonoDenunciante} onChange={handleChange} />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">DNI</label>
              <input type="number" className="form-control" name="dniDenunciante" value={formData.dniDenunciante} onChange={handleChange} />
            </div>
          </div>

          <div className="mt-4 d-flex justify-content-end gap-2 flex-wrap">
            {!incidenteCreado && (
              <button type="submit" className="btn btn-danger">
                Guardar Incidente (Sin Notificar)
              </button>
            )}

            {incidenteCreado && (
              <button
                type="button"
                className="btn btn-warning"
                onClick={notificarBomberos}
                disabled={notificandoBomberos}
              >
                {notificandoBomberos ? 'Notificando...' : '🚨 Notificar Bomberos'}
              </button>
            )}
          </div>

          {incidenteCreado && (
            <div className="alert alert-success mt-3 mb-0">
              ✅ Incidente registrado y bomberos notificados
            </div>
          )}

          <button type="button" className="btn btn-secondary" onClick={onVolver}>
              Volver
          </button>
        </form>
      </div>
    </div>
  )
}

export default CargarIncidente
