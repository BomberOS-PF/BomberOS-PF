import { useState } from 'react'
import './CargarIncidente.css'
import '../../DisenioFormulario/DisenioFormulario.css'

const CargarIncidente = ({ onVolver, onNotificar}) => {
  const now = new Date()
  const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)

  const usuario = JSON.parse(localStorage.getItem('usuario'))

  const nombreCompleto = usuario ? 
    `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || 
    usuario.usuario || 
    'Usuario no identificado' 
    : 'Usuario no logueado'

  const [formData, setFormData] = useState({
    fechaHora: localDateTime
  })

  const [incidenteCreado, setIncidenteCreado] = useState(null)
  const [notificandoBomberos, setNotificandoBomberos] = useState(false)

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
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

      if (formData.nombreDenunciante || formData.apellidoDenunciante || formData.telefonoDenunciante || formData.dniDenunciante) {
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

      if (!response.ok) throw new Error(data.error || 'Error al guardar el incidente')

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
        incidente = await guardarIncidente()
        setIncidenteCreado(incidente)
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
        if (notificacionesFallidas > 0) mensaje += `❌ Notificaciones fallidas: ${notificacionesFallidas}\n`
        mensaje += `\n✅ Incidente registrado y bomberos notificados correctamente.`
        alert(mensaje)
        if (onNotificar) onNotificar(formData.tipoSiniestro, incidente)
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
    <div className="container-fluid p-4">
      <div className="formulario-consistente">
        <h2 className="text-black text-center mb-4">Cargar Incidente</h2>
        <form onSubmit={handleSubmit}>
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="text-black form-label">Persona que carga</label>
              <input type="text" className="form-control" value={nombreCompleto || 'Desconocido'} disabled readOnly />
            </div>
            <div className="col-md-6">
              <label htmlFor="tipoSiniestro" className="text-black form-label">Tipo de Siniestro</label>
              <select className="form-select" id="tipoSiniestro" required onChange={handleChange} defaultValue="">
                <option disabled value="">Seleccione tipo</option>
                <option>Accidente</option>
                <option>Factores Climáticos</option>
                <option>Incendio Estructural</option>
                <option>Incendio Forestal</option>
                <option>Material Peligroso</option>
                <option>Rescate</option>
              </select>
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-4">
              <label htmlFor="fechaHora" className="text-black form-label">Fecha y Hora</label>
              <input type="datetime-local" className="form-control estrecho" id="fechaHora" value={formData.fechaHora} required onChange={handleChange} />
            </div>
            <div className="col-md-4">
              <label htmlFor="lugar" className="text-black form-label">Lugar</label>
              <input type="text" className="form-control" id="lugar" required onChange={handleChange} />
            </div>
            <div className="col-md-4">
              <label htmlFor="localizacion" className="text-black form-label">Localización</label>
              <select className="form-select" id="localizacion" required onChange={handleChange} defaultValue="">
                <option disabled value="">Seleccione localización</option>
                <option>Despeñaderos</option>
                <option>Zona Rural</option>
                <option>Zona Urbana</option>
                <option>Zona Industrial</option>
                <option>Zona Costera</option>
                <option>Otros</option>
              </select>
            </div>
          </div>

          <h5 className="text-black mb-3">Datos del denunciante (opcional)</h5>
          <div className="row mb-3">
            <div className="col-md-3">
              <label htmlFor="nombreDenunciante" className="text-black form-label">Nombre</label>
              <input type="text" className="form-control" id="nombreDenunciante" onChange={handleChange} />
            </div>
            <div className="col-md-3">
              <label htmlFor="apellidoDenunciante" className="text-black form-label">Apellido</label>
              <input type="text" className="form-control" id="apellidoDenunciante" onChange={handleChange} />
            </div>
            <div className="col-md-3">
              <label htmlFor="telefonoDenunciante" className="text-black form-label">Teléfono</label>
              <input type="tel" className="form-control" id="telefonoDenunciante" onChange={handleChange} />
            </div>
            <div className="col-md-3">
              <label htmlFor="dniDenunciante" className="text-black form-label">DNI</label>
              <input type="text" className="form-control" id="dniDenunciante" onChange={handleChange} />
            </div>
          </div>

          <div className="botones-accion">
            {datosEsencialesCompletos() && (
              <button type="button" className="btn btn-warning btn-lg w-100" onClick={notificarBomberos} disabled={notificandoBomberos}>
                {notificandoBomberos ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    🚨 Enviando alerta a bomberos...
                  </>
                ) : (
                  <>🚨 NOTIFICAR EMERGENCIA A BOMBEROS</>
                )}
              </button>
            )}

            {!incidenteCreado && (
              <button type="submit" className="btn btn-danger mt-3 w-100">
                Guardar Incidente (Sin Notificar)
              </button>
            )}

            {incidenteCreado && (
              <div className="alert alert-success mt-3">
                ✅ Incidente registrado y bomberos notificados
              </div>
            )}

            <button type="button" className="btn btn-secondary mt-3" onClick={onVolver}>
              Volver
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CargarIncidente
