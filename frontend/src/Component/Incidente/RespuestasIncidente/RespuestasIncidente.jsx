import React, { useState, useEffect } from 'react'
import './RespuestasIncidente.css'
import { buildApiUrl } from '../config/api'

const RespuestasIncidente = ({ idIncidente, onVolver }) => {
  const [respuestas, setRespuestas] = useState(null)
  const [estadisticas, setEstadisticas] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (idIncidente) {
      cargarRespuestas()
    }
  }, [idIncidente])

  const cargarRespuestas = async () => {
    try {
      setLoading(true)
      const response = await fetch(buildApiUrl(`/api/incidentes/${idIncidente}/respuestas`))
      const data = await response.json()
      
      if (data.success) {
        setRespuestas(data.data.respuestas)
        setEstadisticas(data.data.estadisticas)
        setError(null)
      } else {
        setError('Error al cargar respuestas del incidente')
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

  const obtenerColorRespuesta = (asistio) => {
    if (asistio === 1) return '#28a745'
    if (asistio === 0) return '#dc3545'
    return '#ffc107'
  }

  if (loading) {
    return (
      <div className="respuestas-incidente">
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando respuestas...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="respuestas-incidente">
        <div className="error">
          <h3>❌ Error</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={cargarRespuestas}>Reintentar</button>
            {onVolver && <button onClick={onVolver}>Volver</button>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="respuestas-incidente">
      <div className="respuestas-header">
        <h2>📱 Respuestas WhatsApp - Incidente #{idIncidente}</h2>
        {onVolver && (
          <button className="btn-volver" onClick={onVolver}>
            ← Volver
          </button>
        )}
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="estadisticas-respuestas">
          <div className="stat-card confirmado">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{estadisticas.confirmados}</h3>
              <p>Confirmados</p>
            </div>
          </div>

          <div className="stat-card declinado">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <h3>{estadisticas.declinados}</h3>
              <p>Declinados</p>
            </div>
          </div>

          <div className="stat-card pendiente">
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <h3>{estadisticas.pendientes}</h3>
              <p>Pendientes</p>
            </div>
          </div>

          <div className="stat-card total">
            <div className="stat-icon">💬</div>
            <div className="stat-content">
              <h3>{estadisticas.totalRespuestas}</h3>
              <p>Total Respuestas</p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Respuestas */}
      <div className="respuestas-lista">
        <h3>📋 Detalle de Respuestas</h3>
        
        {!respuestas || respuestas.length === 0 ? (
          <div className="no-respuestas">
            <div className="no-respuestas-icon">📭</div>
            <h4>No hay respuestas registradas</h4>
            <p>Aún no se han recibido respuestas de WhatsApp para este incidente.</p>
          </div>
        ) : (
          <div className="respuestas-grid">
            {respuestas.map((respuesta) => (
              <div key={respuesta.id} className="respuesta-card">
                <div className="respuesta-header">
                  <div className="bombero-info">
                    <div className="bombero-avatar">
                      {obtenerIconoRespuesta(respuesta.asistio)}
                    </div>
                    <div className="bombero-datos">
                      <h4>{respuesta.nombreBombero || 'Bombero no identificado'}</h4>
                      <span className="telefono">{respuesta.telefonoBombero}</span>
                    </div>
                  </div>
                  {respuesta.viaWhatsapp && (
                    <div className="whatsapp-badge">
                      📱 WhatsApp
                    </div>
                  )}
                </div>

                <div className="respuesta-content">
                  <div className="tipo-respuesta">
                    <span 
                      className="tipo-badge"
                      style={{ 
                        backgroundColor: obtenerColorRespuesta(respuesta.asistio),
                        color: 'white'
                      }}
                    >
                      {obtenerTipoRespuesta(respuesta.asistio)}
                    </span>
                  </div>

                  {respuesta.respuestaWhatsapp && (
                    <div className="respuesta-original">
                      <strong>Respuesta original:</strong>
                      <span className="texto-respuesta">"{respuesta.respuestaWhatsapp}"</span>
                    </div>
                  )}

                  <div className="respuesta-meta">
                    <div className="fecha-respuesta">
                      <i className="bi bi-clock"></i>
                      {formatearFecha(respuesta.fechaRespuesta)}
                    </div>
                    {respuesta.messageSid && (
                      <div className="message-id">
                        <i className="bi bi-hash"></i>
                        {respuesta.messageSid.slice(-8)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Información adicional */}
      {estadisticas && estadisticas.primeraRespuesta && (
        <div className="info-adicional">
          <div className="info-item">
            <strong>Primera respuesta:</strong>
            <span>{formatearFecha(estadisticas.primeraRespuesta)}</span>
          </div>
          {estadisticas.ultimaRespuesta && (
            <div className="info-item">
              <strong>Última respuesta:</strong>
              <span>{formatearFecha(estadisticas.ultimaRespuesta)}</span>
            </div>
          )}
          <div className="info-item">
            <strong>Respondieron por WhatsApp:</strong>
            <span>{estadisticas.respondieronWhatsapp} bomberos</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default RespuestasIncidente
