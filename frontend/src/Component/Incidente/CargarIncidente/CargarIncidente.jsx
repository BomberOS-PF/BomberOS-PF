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
  
  // Construir nombre completo con fallbacks
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

  // Función para verificar si los datos esenciales están completos
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
        DNI: usuario?.dni,
        idTipoIncidente: tipoMap[formData.tipoSiniestro],
        fecha: formData.fechaHora,
        idLocalizacion: localizacionMap[formData.localizacion] || 99,
        descripcion: formData.lugar
      }

      const hayDenunciante =
        formData.nombreDenunciante || formData.apellidoDenunciante ||
        formData.telefonoDenunciante || formData.dniDenunciante

      if (hayDenunciante) {
        payload.denunciante = {
          nombre: formData.nombreDenunciante || null,
          apellido: formData.apellidoDenunciante || null,
          telefono: formData.telefonoDenunciante || null,
          dni: formData.dniDenunciante || null
        }
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
      
      // Guardar el incidente creado para referencia
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
      // Primero guardar el incidente automáticamente
      let incidente = incidenteCreado
      if (!incidente) {
        console.log('💾 Guardando incidente automáticamente antes de notificar...')
        incidente = await guardarIncidente()
        setIncidenteCreado(incidente)
        console.log('✅ Incidente guardado:', incidente)
      }

      console.log('📱 Notificando bomberos para incidente:', incidente)
      
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

        // Callback para manejar el flujo posterior
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
    <div className="container d-flex justify-content-center align-items-center">
      <div className="formulario-consistente">
        <h2 className="text-white text-center mb-4">Cargar Incidente</h2>
        <form onSubmit={handleSubmit}>
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Persona que carga</label>
              <input
                type="text"
                className="form-control"
                value={nombreCompleto || 'Desconocido'}
                disabled
                readOnly
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="tipoSiniestro" className="form-label">Tipo de Siniestro</label>
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
              <label htmlFor="fechaHora" className="form-label">Fecha y Hora</label>
              <input
                type="datetime-local"
                className="form-control estrecho"
                id="fechaHora"
                value={formData.fechaHora}
                required
                onChange={handleChange}
              />
            </div>
          </div>

          <h5 className="text-white mb-3">Datos del denunciante (opcional)</h5>
          <div className="row mb-3">
            <div className="col">
              <label htmlFor="nombreDenunciante" className="form-label">Nombre</label>
              <input type="text" className="form-control" id="nombreDenunciante" onChange={handleChange} />
            </div>
            <div className="col">
              <label htmlFor="apellidoDenunciante" className="form-label">Apellido</label>
              <input type="text" className="form-control" id="apellidoDenunciante" onChange={handleChange} />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col">
              <label htmlFor="telefonoDenunciante" className="form-label">Teléfono</label>
              <input type="tel" className="form-control" id="telefonoDenunciante" onChange={handleChange} />
            </div>
            <div className="col">
              <label htmlFor="dniDenunciante" className="form-label">DNI</label>
              <input type="text" className="form-control" id="dniDenunciante" onChange={handleChange} />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <label htmlFor="localizacion" className="form-label">Localización</label>
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

            <div className="col-md-6">
              <label htmlFor="lugar" className="form-label">Calle y/o Kilometraje o Lugar</label>
              <input
                type="text"
                className="form-control"
                id="lugar"
                placeholder="Ej: Av. Siempre Viva 742, km 12"
                required
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="botones-accion">
            {/* Botón de Notificar - Aparece cuando los datos esenciales están completos */}
            {datosEsencialesCompletos() && (
              <button 
                type="button" 
                className="btn btn-warning btn-lg" 
                onClick={notificarBomberos}
                disabled={notificandoBomberos}
                style={{ 
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  marginBottom: '10px',
                  width: '100%'
                }}
              >
                {notificandoBomberos ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    🚨 Enviando alerta a bomberos...
                  </>
                ) : (
                  <>
                    🚨 NOTIFICAR EMERGENCIA A BOMBEROS
                  </>
                )}
              </button>
            )}
            
            {/* Botón de guardar incidente - Solo aparece si no se ha notificado */}
            {!incidenteCreado && (
              <button type="submit" className="btn btn-danger">
                Guardar Incidente (Sin Notificar)
              </button>
            )}
            
            {/* Información del estado */}
            {incidenteCreado && (
              <div className="alert alert-success mt-2">
                ✅ Incidente registrado y bomberos notificados
              </div>
            )}
            
            <button type="button" className="btn btn-secondary" onClick={onVolver}>
              Volver
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CargarIncidente
