import { useState, useEffect } from 'react'
import './CargarIncidente.css'
import { Flame, AlertTriangle, FileText, User, Clock, MapPin, Phone } from 'lucide-react'
import '../../DisenioFormulario/DisenioFormulario.css'
import { API_URLS, apiRequest } from '../../../config/api'

const CargarIncidente = ({ onVolver, onNotificar }) => {
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

  // Estados para los datos dinámicos
  const [tiposIncidente, setTiposIncidente] = useState([])
  const [localizaciones, setLocalizaciones] = useState([])
  const [loading, setLoading] = useState(true)

  // Cargar datos dinámicos al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true)
        const [tiposRes, localizacionesRes] = await Promise.all([
          apiRequest(API_URLS.tiposIncidente),
          apiRequest(API_URLS.localizaciones)
        ])

        setTiposIncidente(tiposRes.data || [])
        setLocalizaciones(localizacionesRes.data || [])
      } catch (error) {
        console.error('Error al cargar datos:', error)
      } finally {
        setLoading(false)
      }
    }

    cargarDatos()
  }, [])

  const handleChange = (e) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const datosEsencialesCompletos = () => {
    return formData.tipoSiniestro && formData.localizacion && formData.lugar
  }

  const guardarIncidente = async () => {
    try {
      // Buscar el ID del tipo de incidente seleccionado
      const tipoSeleccionado = tiposIncidente.find(tipo => tipo.nombre === formData.tipoSiniestro)
      if (!tipoSeleccionado) {
        throw new Error('Tipo de incidente no válido')
      }

      // Buscar el ID de la localización seleccionada
      const localizacionSeleccionada = localizaciones.find(loc => loc.descripcion === formData.localizacion)
      if (!localizacionSeleccionada) {
        throw new Error('Localización no válida')
      }

      const payload = {
        dni: usuario?.dni,
        idTipoIncidente: tipoSeleccionado.idTipoIncidente,
        fecha: formData.fechaHora,
        idLocalizacion: localizacionSeleccionada.idLocalizacion,
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
        // Pasar datos más completos al formulario específico
        const datosParaFormulario = {
          ...incidenteGuardado,
          tipoSiniestro: formData.tipoSiniestro,
          fechaHora: formData.fechaHora,
          localizacion: formData.localizacion,
          lugar: formData.lugar,
          nombreDenunciante: formData.nombreDenunciante,
          apellidoDenunciante: formData.apellidoDenunciante,
          telefonoDenunciante: formData.telefonoDenunciante,
          dniDenunciante: formData.dniDenunciante
        }
        onNotificar(formData.tipoSiniestro, datosParaFormulario)
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

        // Callback para manejar el flujo posterior
        if (onNotificar) {
          // Pasar datos más completos al formulario específico
          const datosParaFormulario = {
            ...incidente,
            tipoSiniestro: formData.tipoSiniestro,
            fechaHora: formData.fechaHora,
            localizacion: formData.localizacion,
            lugar: formData.lugar,
            nombreDenunciante: formData.nombreDenunciante,
            apellidoDenunciante: formData.apellidoDenunciante,
            telefonoDenunciante: formData.telefonoDenunciante,
            dniDenunciante: formData.dniDenunciante
          }
          onNotificar(formData.tipoSiniestro, datosParaFormulario)
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
    <div className='container'>
      <div className='text-center mb-4'>
        <div className='d-flex justify-content-center align-items-center gap-3 mb-3'>
          <div className='bg-danger p-3 rounded-circle'>
            <Flame size={32} color="white" />
          </div>
          <h1 className="fw-bold text-white fs-3 mb-0">Cargar Incidente</h1>
        </div>
        <span className="badge bg-danger-subtle text-danger">
          <AlertTriangle className="me-2" /> Sistema de Emergencias - Cuartel de Bomberos
        </span>
      </div>

      <div className="card shadow-sm border-0 bg-white bg-opacity-1 backdrop-blur-sm">
        <div className="card-header bg-danger text-white d-flex align-items-center gap-2 py-4">
          <FileText />
          <strong>Cargar Incidente</strong>
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="row mb-3">
              <div className="col-md-6 py-4">
                <label className="form-label text-dark d-flex align-items-center gap-2">
                  <User className="text-danger" />
                  Persona que carga
                </label>
                <input type="text" className="form-control" value={nombreCompleto || 'Desconocido'} disabled readOnly />
              </div>

              <div className="col-md-6 py-4">
                <label htmlFor="tipoSiniestro" className="text-dark form-label d-flex align-items-center gap-2">
                  <AlertTriangle className="text-warning" />
                  Tipo de Siniestro
                </label>
                <select className="text-dark form-select" id="tipoSiniestro" required onChange={handleChange} defaultValue="">
                  <option disabled value="">Seleccione tipo</option>
                  <option>Accidente de Tránsito</option>
                  <option>Factores Climáticos</option>
                  <option>Incendio Estructural</option>
                  <option>Incendio Forestal</option>
                  <option>Material Peligroso</option>
                  <option>Rescate</option>
                </select>
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-md-4 py-4">
                <label htmlFor="fechaHora" className="form-label text-dark d-flex align-items-center gap-2">
                  <Clock className="text-primary" />
                  Fecha y Hora
                </label>
                <input
                  type="datetime-local"
                  id="fechaHora"
                  className="form-control estrecho"
                  value={formData.fechaHora}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-4 py-4">
                <label htmlFor="lugar" className="form-label text-dark d-flex align-items-center gap-2">
                  <MapPin className="text-success" />
                  Lugar
                </label>
                <input type="text" id="lugar" className="form-control" onChange={handleChange} required />
              </div>

              <div className="col-md-4 py-4">
                <label htmlFor="localizacion" className="form-label text-dark d-flex align-items-center gap-2">
                  <MapPin className="text-purple" />
                  Localización
                </label>
                <select className="form-select" id="localizacion" required onChange={handleChange} defaultValue="">
                  <option disabled value="">Seleccione localización</option>
                  {loading ? (
                    <option>Cargando localizaciones...</option>
                  ) : (
                    localizaciones.map(loc => (
                      <option key={loc.idLocalizacion} value={loc.descripcion}>
                        {loc.descripcion}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <hr className="mb-4" />

            <div className="mb-3 d-flex align-items-center gap-2">
              <Phone className="text-indigo" />
              <h5 className="mb-0 text-dark">Datos del denunciante</h5>
              <span className="badge bg-secondary text-white text-uppercase">opcional</span>
            </div>

            <div className="row mb-4">
              <div className="col-md-3">
                <label htmlFor="nombreDenunciante" className="text-dark form-label">Nombre</label>
                <input type="text" id="nombreDenunciante" className="form-control" onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label htmlFor="apellidoDenunciante" className="text-dark form-label">Apellido</label>
                <input type="text" id="apellidoDenunciante" className="form-control" onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label htmlFor="telefonoDenunciante" className="text-dark form-label">Teléfono</label>
                <input type="tel" id="telefonoDenunciante" className="form-control" onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label htmlFor="dniDenunciante" className="text-dark form-label">DNI</label>
                <input type="text" id="dniDenunciante" className="form-control" onChange={handleChange} />
              </div>
            </div>
            <div className="row mb-3">
              <div className="col">
                <label htmlFor="telefonoDenunciante" className="text-black form-label">Teléfono</label>
                <input type="tel" className="form-control" id="telefonoDenunciante" onChange={handleChange} />
              </div>
              <div className="col">
                <label htmlFor="dniDenunciante" className="text-black form-label">dni</label>
                <input type="text" className="form-control" id="dniDenunciante" onChange={handleChange} />
              </div>
            </div>

            <div className="d-grid gap-3">
              {datosEsencialesCompletos() && (
                <button type="button" className="btn btn-warning btn-lg" onClick={notificarBomberos} disabled={notificandoBomberos}>
                  {notificandoBomberos ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Enviando alerta...
                    </>
                  ) : (
                    <>🚨 Notificar emergencia a bomberos</>
                  )}
                </button>
              )}

              {!incidenteCreado && (
                <button type="submit" className="btn btn-danger btn-lg">
                  Guardar Incidente (Sin Notificar)
                </button>
              )}

              {incidenteCreado && (
                <div className="alert alert-success mt-3">
                  ✅ Incidente registrado y bomberos notificados
                </div>
              )}

              <button type="button" className="btn btn-secondary" onClick={onVolver}>
                Volver al menú
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CargarIncidente
