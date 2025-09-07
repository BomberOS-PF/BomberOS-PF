import React, { useState, useEffect } from 'react'
import './EstadoWhatsApp.css'

const EstadoWhatsApp = () => {
  const [estado, setEstado] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [ultimasNotificaciones, setUltimasNotificaciones] = useState([])

  useEffect(() => {
    cargarEstado()
    // Actualizar cada 60 segundos
    const interval = setInterval(cargarEstado, 60000)
    return () => clearInterval(interval)
  }, [])

  const cargarEstado = async () => {
    try {
      // Simular estado del servicio WhatsApp
      // En una implementación real, esto vendría de un endpoint del backend
      const estadoSimulado = {
        enabled: true,
        configured: true,
        whatsappNumber: 'whatsapp:+14155238886',
        ultimaConexion: new Date().toISOString(),
        mensajesEnviados: 42,
        mensajesRecibidos: 38,
        bomberosSinTelefono: 3
      }
      
      setEstado(estadoSimulado)
      setError(null)
      
      // Cargar últimas notificaciones
      await cargarUltimasNotificaciones()
      
    } catch (err) {
      setError('Error al cargar estado de WhatsApp')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const cargarUltimasNotificaciones = async () => {
    try {
      const response = await fetch('/api/incidentes/resumen-respuestas')
      const data = await response.json()
      
      if (data.success) {
        // Tomar los últimos 5 incidentes con respuestas
        const incidentesConRespuestas = data.data
          .filter(inc => inc.respondieronWhatsapp > 0)
          .slice(0, 5)
        
        setUltimasNotificaciones(incidentesConRespuestas)
      }
    } catch (err) {
      console.error('Error al cargar notificaciones:', err)
    }
  }

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-AR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const obtenerEstadoColor = () => {
    if (!estado) return '#6c757d'
    if (estado.enabled && estado.configured) return '#28a745'
    if (estado.enabled && !estado.configured) return '#ffc107'
    return '#dc3545'
  }

  const obtenerEstadoTexto = () => {
    if (!estado) return 'Desconocido'
    if (estado.enabled && estado.configured) return 'Activo'
    if (estado.enabled && !estado.configured) return 'Configuración Incompleta'
    return 'Deshabilitado'
  }

  if (loading) {
    return (
      <div className="estado-whatsapp">
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando estado...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="estado-whatsapp">
      <div className="estado-header">
        <h2>📱 Estado WhatsApp</h2>
        <div 
          className="estado-indicator"
          style={{ backgroundColor: obtenerEstadoColor() }}
        >
          {obtenerEstadoTexto()}
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
          <button onClick={cargarEstado}>Reintentar</button>
        </div>
      )}

      {estado && (
        <div className="estado-content">
          {/* Información del Servicio */}
          <div className="servicio-info">
            <div className="info-card">
              <div className="info-icon">📞</div>
              <div className="info-content">
                <h4>Número WhatsApp</h4>
                <p>{estado.whatsappNumber || 'No configurado'}</p>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">⏰</div>
              <div className="info-content">
                <h4>Última Conexión</h4>
                <p>{estado.ultimaConexion ? formatearFecha(estado.ultimaConexion) : 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Estadísticas de Mensajes */}
          <div className="mensajes-stats">
            <h3>📊 Estadísticas de Mensajes</h3>
            <div className="stats-grid">
              <div className="stat-item enviados">
                <div className="stat-number">{estado.mensajesEnviados}</div>
                <div className="stat-label">Enviados</div>
              </div>
              <div className="stat-item recibidos">
                <div className="stat-number">{estado.mensajesRecibidos}</div>
                <div className="stat-label">Recibidos</div>
              </div>
              <div className="stat-item sin-telefono">
                <div className="stat-number">{estado.bomberosSinTelefono}</div>
                <div className="stat-label">Sin Teléfono</div>
              </div>
            </div>
          </div>

          {/* Últimas Notificaciones */}
          <div className="ultimas-notificaciones">
            <h3>🔔 Últimas Notificaciones</h3>
            {ultimasNotificaciones.length === 0 ? (
              <div className="no-notificaciones">
                <p>No hay notificaciones recientes</p>
              </div>
            ) : (
              <div className="notificaciones-lista">
                {ultimasNotificaciones.map((incidente) => (
                  <div key={incidente.idIncidente} className="notificacion-item">
                    <div className="notificacion-header">
                      <span className="incidente-id">#{incidente.idIncidente}</span>
                      <span className="fecha">{formatearFecha(incidente.fecha)}</span>
                    </div>
                    <div className="notificacion-content">
                      <p className="descripcion">{incidente.descripcion}</p>
                      <div className="respuestas-info">
                        <span className="whatsapp-count">
                          📱 {incidente.respondieronWhatsapp} respuestas
                        </span>
                        <div className="respuestas-breakdown">
                          <span className="confirmados">✅ {incidente.confirmados}</span>
                          <span className="declinados">❌ {incidente.declinados}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Configuración y Ayuda */}
          <div className="configuracion-ayuda">
            <h3>⚙️ Configuración</h3>
            <div className="config-items">
              <div className="config-item">
                <span className="config-label">Servicio Habilitado:</span>
                <span className={`config-value ${estado.enabled ? 'enabled' : 'disabled'}`}>
                  {estado.enabled ? '✅ Sí' : '❌ No'}
                </span>
              </div>
              <div className="config-item">
                <span className="config-label">Configuración Completa:</span>
                <span className={`config-value ${estado.configured ? 'enabled' : 'disabled'}`}>
                  {estado.configured ? '✅ Sí' : '❌ No'}
                </span>
              </div>
            </div>

            {(!estado.enabled || !estado.configured) && (
              <div className="config-help">
                <h4>📝 Para configurar WhatsApp:</h4>
                <ol>
                  <li>Configurar variables de entorno en el servidor</li>
                  <li>TWILIO_ENABLED=true</li>
                  <li>TWILIO_ACCOUNT_SID=tu_account_sid</li>
                  <li>TWILIO_AUTH_TOKEN=tu_auth_token</li>
                  <li>TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default EstadoWhatsApp
