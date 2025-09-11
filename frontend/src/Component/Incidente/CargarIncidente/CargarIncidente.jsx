import { useState, useEffect } from 'react'
import './CargarIncidente.css'
import { Flame, AlertTriangle, FileText, User, Clock, MapPin, Phone } from 'lucide-react'
import { API_URLS, apiRequest } from '../../../config/api'
import { BackToMenuButton } from '../../Common/Button.jsx'
import Select from 'react-select'

const CargarIncidente = ({ onVolver, onNotificar }) => {
  const now = new Date()
  const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)

  // Parseo seguro de usuario
  let usuario = null
  try {
    const raw = localStorage.getItem('usuario')
    usuario = raw ? JSON.parse(raw) : null
  } catch {
    usuario = null
  }

  const nombreCompleto = usuario
    ? (`${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || usuario.usuario || 'Usuario no identificado')
    : 'Usuario no logueado'

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

  // Catálogos
  const [tiposIncidente, setTiposIncidente] = useState([])
  const [localizaciones, setLocalizaciones] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true)
        const [tiposRes, localizacionesRes] = await Promise.all([
          apiRequest(API_URLS.tiposIncidente),
          apiRequest(API_URLS.localizaciones)
        ])
        if (tiposRes?.success ?? true) setTiposIncidente(tiposRes.data || tiposRes || [])
        if (localizacionesRes?.success ?? true) setLocalizaciones(localizacionesRes.data || localizacionesRes || [])
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

  const datosEsencialesCompletos = () =>
    !!(formData.tipoSiniestro && formData.localizacion && formData.lugar)

  // Guardar incidente (tolerante a distintos contratos de API)
  const guardarIncidente = async () => {
    // Resolver IDs según selección por nombre/dirección
    const tipoSel = tiposIncidente.find(t => t.nombre === formData.tipoSiniestro)
    if (!tipoSel) throw new Error('Tipo de incidente no válido')

    const locSel = localizaciones.find(l => l.direccion === formData.localizacion)
    if (!locSel) throw new Error('Localización no válida')

    const payload = {
      dni: usuario?.dni || null,
      idTipoIncidente: tipoSel.idTipoIncidente,
      fecha: formData.fechaHora,
      idLocalizacion: locSel.idLocalizacion,
      descripcion: formData.lugar
    }

    // Datos del denunciante (opcionales)
    if (formData.nombreDenunciante || formData.apellidoDenunciante || formData.telefonoDenunciante || formData.dniDenunciante) {
      payload.nombreDenunciante = formData.nombreDenunciante || null
      payload.apellidoDenunciante = formData.apellidoDenunciante || null
      payload.telefonoDenunciante = formData.telefonoDenunciante || null
      payload.dniDenunciante = formData.dniDenunciante || null
    }

    const endpoint =
      API_URLS.incidentes?.create ||
      API_URLS.incidentes?.createIncidente ||
      API_URLS.incidentes

    const resp = await apiRequest(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    // 1) Si la API marca explícitamente fracaso
    if (resp && typeof resp === 'object' && 'success' in resp && resp.success === false) {
      throw new Error(resp.message || 'Error al guardar el incidente')
    }

    // 2) Normalizamos lo devuelto (data o el objeto plano)
    const incidente = (resp && resp.data) ? resp.data : resp

    // 3) Validación suave: si vino un objeto con id, estamos OK
    if (!incidente || (typeof incidente !== 'object')) {
      throw new Error('Respuesta inesperada del servidor')
    }

    return incidente
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const incidenteGuardado = await guardarIncidente()
      alert('✅ Incidente guardado correctamente')
      setIncidenteCreado(incidenteGuardado)

      if (onNotificar) {
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

  const notificarPorWhatsapp = async () => {
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

      console.log('📱 Enviando notificación WhatsApp para incidente:', incidente.idIncidente)

      const resp = await fetch(`/api/incidentes/${incidente.idIncidente}/notificar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      })

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}))
        throw new Error(errorData.message || `Error ${resp.status}: ${resp.statusText}`)
      }

      const resultado = await resp.json()

      if (resultado.success) {
        const { totalBomberos, notificacionesExitosas, notificacionesFallidas } = resultado.data
        alert(`🚨 ALERTA ENVIADA POR WHATSAPP ✅
        
📊 Resumen:
• Total bomberos: ${totalBomberos}
• Notificaciones exitosas: ${notificacionesExitosas}
• Notificaciones fallidas: ${notificacionesFallidas}

Los bomberos pueden responder "SI" o "NO" por WhatsApp para confirmar su asistencia.`)
      } else {
        throw new Error(resultado.message || 'Error al enviar notificación')
      }

      if (onNotificar) {
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
    } catch (error) {
      console.error('❌ Error al notificar por WhatsApp:', error)
      alert(`❌ Error al notificar por WhatsApp: ${error.message}`)
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
                <Select
                  classNamePrefix="rs"
                  placeholder="Seleccione tipo de siniestro"
                  options={tiposIncidente.map(t => ({ value: t.idTipoIncidente, label: t.nombre }))}
                  value={
                    (() => {
                      const sel = tiposIncidente.find(t => t.nombre === formData.tipoSiniestro);
                      return sel ? { value: sel.idTipoIncidente, label: sel.nombre } : null;
                    })()
                  }
                  onChange={(opt) => {
                    setFormData(prev => ({
                      ...prev,
                      tipoSiniestro: opt ? tiposIncidente.find(t => t.idTipoIncidente === opt.value)?.nombre || '' : ''
                    }));
                  }}
                  isClearable />
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
                <input
                  type="text"
                  id="lugar"
                  className="form-control"
                  value={formData.lugar}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-4 py-4">
                <label htmlFor="localizacion" className="form-label text-dark d-flex align-items-center gap-2">
                  <MapPin className="text-purple" />
                  Localización
                </label>
                <Select
                  classNamePrefix="rs"
                  placeholder="Seleccione localización"
                  options={localizaciones.map(l => ({ value: l.idLocalizacion, label: l.direccion }))}
                  value={
                    (() => {
                      const sel = localizaciones.find(l => l.direccion === formData.localizacion);
                      return sel ? { value: sel.idLocalizacion, label: sel.direccion } : null;
                    })()
                  }
                  onChange={(opt) => {
                    setFormData(prev => ({
                      ...prev,
                      localizacion: opt ? localizaciones.find(l => l.idLocalizacion === opt.value)?.direccion || '' : ''
                    }));
                  }}
                  isClearable
                />
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
                <input
                  type="text"
                  id="nombreDenunciante"
                  className="form-control"
                  value={formData.nombreDenunciante}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="apellidoDenunciante" className="text-dark form-label">Apellido</label>
                <input
                  type="text"
                  id="apellidoDenunciante"
                  className="form-control"
                  value={formData.apellidoDenunciante}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="telefonoDenunciante" className="text-dark form-label">Teléfono</label>
                <input
                  type="tel"
                  id="telefonoDenunciante"
                  className="form-control"
                  value={formData.telefonoDenunciante}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="dniDenunciante" className="text-dark form-label">DNI</label>
                <input
                  type="text"
                  id="dniDenunciante"
                  className="form-control"
                  value={formData.dniDenunciante}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="d-grid gap-3">
              {datosEsencialesCompletos() && (
                <button
                  type="button"
                  className="btn btn-warning btn-lg"
                  onClick={notificarPorWhatsapp}
                  disabled={notificandoBomberos}
                  style={{ fontWeight: 'bold', width: '100%' }}
                >
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

              <div className='d-flex justify-content-center align-items-center gap-3 mb-3'>

                <BackToMenuButton onClick={onVolver} />
                
                {!incidenteCreado && (
                  <button type="submit" className="btn btn-accept btn-medium btn-lg btn-sm-custom">
                    Guardar Incidente (Sin Notificar)
                  </button>
                )}
              </div>

              {incidenteCreado && (
                <div className="alert alert-success mt-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <span>✅ Incidente #{incidenteCreado.idIncidente} registrado exitosamente</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-success"
                      onClick={() => {
                        // Redirigir directamente al formulario de edición del incidente
                        console.log('🔄 Completar Detalles clicked - incidenteCreado:', incidenteCreado)
                        if (onVolver) {
                          console.log('💾 Guardando en localStorage:', incidenteCreado.idIncidente)
                          localStorage.setItem('incidenteParaCompletar', incidenteCreado.idIncidente)
                          console.log('🔄 Llamando onVolver con consultarIncidente')
                          onVolver('consultarIncidente')
                        }
                      }}
                    >
                      <i className="bi bi-pencil-square me-1"></i>
                      Completar Detalles →
                    </button>
                  </div>
                  <small className="text-muted d-block mt-2">
                    💡 Haz clic en "Completar Detalles" para agregar información específica del tipo de incidente
                  </small>
                </div>
              )}
            </div>
          </form>

        </div>
      </div>
    </div>
  )
}

export default CargarIncidente
