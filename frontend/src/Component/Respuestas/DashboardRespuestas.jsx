import React, { useState, useEffect } from 'react'
import './DashboardRespuestas.css'
import { buildApiUrl } from '../../config/api'

const DashboardRespuestas = () => {
  const [dashboard, setDashboard] = useState(null)
  const [incidenteSeleccionado, setIncidenteSeleccionado] = useState(null)
  const [respuestasDetalle, setRespuestasDetalle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Cargar dashboard inicial
  useEffect(() => {
    cargarDashboard()
    // Actualizar cada 30 segundos
    const interval = setInterval(cargarDashboard, 30000)
    return () => clearInterval(interval)
  }, [])

  const cargarDashboard = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/dashboard/respuestas'))
      const data = await response.json()
      
      if (data.success) {
        setDashboard(data.data)
        setError(null)
      } else {
        setError('Error al cargar dashboard')
      }
    } catch (err) {
      setError('Error de conexión')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const cargarDetalleIncidente = async (idIncidente) => {
    try {
      setLoading(true)
      const response = await fetch(buildApiUrl(`/api/incidentes/${idIncidente}/respuestas`))
      const data = await response.json()
      
      if (data.success) {
        setRespuestasDetalle(data.data)
        setIncidenteSeleccionado(idIncidente)
      } else {
        setError('Error al cargar detalles del incidente')
      }
    } catch (err) {
      setError('Error de conexión')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const obtenerIconoRespuesta = (asistio) => {
    if (asistio === 1) return '✅'
    if (asistio === 0) return '❌'
    return '❓'
  }

  const obtenerTipoRespuesta = (asistio) => {
    if (asistio === 1) return 'CONFIRMADO'
    if (asistio === 0) return 'DECLINADO'
    return 'PENDIENTE'
  }

  if (loading && !dashboard) {
    return (
      <div className="dashboard-respuestas">
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (error && !dashboard) {
    return (
      <div className="dashboard-respuestas">
        <div className="error">
          <h3>❌ Error</h3>
          <p>{error}</p>
          <button onClick={cargarDashboard}>Reintentar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-respuestas">
      <div className="dashboard-header">
        <h1>📊 Dashboard de Respuestas WhatsApp</h1>
        <div className="timestamp">
          Última actualización: {dashboard?.timestamp ? formatearFecha(dashboard.timestamp) : 'N/A'}
        </div>
      </div>

      {/* Estadísticas Generales */}
      <div className="estadisticas-generales">
        <div className="stat-card">
          <div className="stat-icon">🚨</div>
          <div className="stat-content">
            <h3>{dashboard?.estadisticasGenerales?.totalIncidentes || 0}</h3>
            <p>Incidentes Totales</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <h3>{dashboard?.estadisticasGenerales?.totalRespuestas || 0}</h3>
            <p>Respuestas Totales</p>
          </div>
        </div>

        <div className="stat-card confirmado">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{dashboard?.estadisticasGenerales?.totalConfirmados || 0}</h3>
            <p>Confirmados</p>
          </div>
        </div>

        <div className="stat-card declinado">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <h3>{dashboard?.estadisticasGenerales?.totalDeclinados || 0}</h3>
            <p>Declinados</p>
          </div>
        </div>

        <div className="stat-card pendiente">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <h3>{dashboard?.estadisticasGenerales?.totalPendientes || 0}</h3>
            <p>Pendientes</p>
          </div>
        </div>
      </div>

      {/* Lista de Incidentes Recientes */}
      <div className="incidentes-recientes">
        <h2>🚒 Incidentes Recientes</h2>
        
        {dashboard?.incidentesRecientes?.length === 0 ? (
          <div className="no-data">
            <p>No hay incidentes con respuestas registradas</p>
          </div>
        ) : (
          <div className="incidentes-lista">
            {dashboard?.incidentesRecientes?.map((incidente) => (
              <div 
                key={incidente.idIncidente} 
                className="incidente-card"
                onClick={() => cargarDetalleIncidente(incidente.idIncidente)}
              >
                <div className="incidente-header">
                  <h3>Incidente #{incidente.idIncidente}</h3>
                  <span className="fecha">{formatearFecha(incidente.fecha)}</span>
                </div>
                
                <p className="descripcion">{incidente.descripcion}</p>
                
                <div className="respuestas-resumen">
                  <div className="respuesta-stat confirmado">
                    <span className="icon">✅</span>
                    <span className="count">{incidente.confirmados}</span>
                  </div>
                  <div className="respuesta-stat declinado">
                    <span className="icon">❌</span>
                    <span className="count">{incidente.declinados}</span>
                  </div>
                  <div className="respuesta-stat pendiente">
                    <span className="icon">⏰</span>
                    <span className="count">{incidente.pendientes}</span>
                  </div>
                  <div className="total-respuestas">
                    Total: {incidente.totalRespuestas}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalle de Respuestas */}
      {respuestasDetalle && (
        <div className="modal-overlay" onClick={() => setRespuestasDetalle(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📱 Respuestas - Incidente #{incidenteSeleccionado}</h2>
              <button 
                className="close-button"
                onClick={() => setRespuestasDetalle(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Estadísticas del Incidente */}
              <div className="estadisticas-incidente">
                <div className="stat-mini confirmado">
                  <span>✅ {respuestasDetalle.estadisticas.confirmados}</span>
                </div>
                <div className="stat-mini declinado">
                  <span>❌ {respuestasDetalle.estadisticas.declinados}</span>
                </div>
                <div className="stat-mini pendiente">
                  <span>⏰ {respuestasDetalle.estadisticas.pendientes}</span>
                </div>
                <div className="stat-mini total">
                  <span>💬 {respuestasDetalle.estadisticas.totalRespuestas}</span>
                </div>
              </div>

              {/* Lista de Respuestas */}
              <div className="respuestas-lista">
                {respuestasDetalle.respuestas.length === 0 ? (
                  <p>No hay respuestas registradas para este incidente</p>
                ) : (
                  respuestasDetalle.respuestas.map((respuesta) => (
                    <div key={respuesta.id} className="respuesta-item">
                      <div className="respuesta-icon">
                        {obtenerIconoRespuesta(respuesta.asistio)}
                      </div>
                      <div className="respuesta-info">
                        <div className="bombero-info">
                          <strong>{respuesta.nombreBombero || 'Bombero no identificado'}</strong>
                          <span className="telefono">{respuesta.telefonoBombero}</span>
                          {respuesta.viaWhatsapp && (
                            <span className="whatsapp-badge">📱 WhatsApp</span>
                          )}
                        </div>
                        <div className="respuesta-detalle">
                          <span 
                            className="tipo-respuesta"
                            style={{ 
                              color: respuesta.asistio === 1 ? '#28a745' : 
                                     respuesta.asistio === 0 ? '#dc3545' : '#ffc107' 
                            }}
                          >
                            {obtenerTipoRespuesta(respuesta.asistio)}
                          </span>
                          {respuesta.respuestaWhatsapp && (
                            <span className="respuesta-original">
                              "{respuesta.respuestaWhatsapp}"
                            </span>
                          )}
                        </div>
                        <div className="respuesta-meta">
                          <span className="fecha">{formatearFecha(respuesta.fechaRespuesta)}</span>
                          {respuesta.messageSid && (
                            <span className="message-id">ID: {respuesta.messageSid.slice(-8)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardRespuestas
