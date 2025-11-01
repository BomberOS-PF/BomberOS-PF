import React, { useMemo } from 'react'
import './TendenciasGrafico.css'

const TendenciasGrafico = ({ incidentes }) => {
  // Calcular estadísticas de los últimos 7 días
  const tendencias = useMemo(() => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    
    const ultimos7Dias = []
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date(hoy)
      fecha.setDate(fecha.getDate() - i)
      
      const incidentesDia = incidentes.filter(inc => {
        const fechaInc = new Date(inc.fecha)
        fechaInc.setHours(0, 0, 0, 0)
        return fechaInc.getTime() === fecha.getTime()
      })
      
      const stats = incidentesDia.reduce((acc, inc) => {
        acc.incidentes++
        acc.confirmados += inc.confirmados || 0
        acc.declinados += inc.declinados || 0
        acc.pendientes += inc.pendientes || 0
        acc.total += inc.totalRespuestas || 0
        return acc
      }, {
        fecha: fecha,
        incidentes: 0,
        confirmados: 0,
        declinados: 0,
        pendientes: 0,
        total: 0
      })
      
      ultimos7Dias.push(stats)
    }
    
    return ultimos7Dias
  }, [incidentes])

  const maxIncidentes = Math.max(...tendencias.map(d => d.incidentes), 1)
  const maxRespuestas = Math.max(...tendencias.map(d => d.total), 1)

  const formatearDia = (fecha) => {
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    return dias[fecha.getDay()]
  }

  const formatearFecha = (fecha) => {
    return fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
  }

  return (
    <div className="tendencias-grafico">
      <h3>📈 Tendencia de los Últimos 7 Días</h3>
      
      <div className="grafico-container">
        {/* Gráfico de Incidentes */}
        <div className="grafico-seccion">
          <h4>Incidentes por Día</h4>
          <div className="grafico-barras">
            {tendencias.map((dia, index) => (
              <div key={index} className="barra-container">
                <div className="barra-wrapper">
                  <div 
                    className="barra incidentes-barra"
                    style={{ 
                      height: `${(dia.incidentes / maxIncidentes) * 100}%`,
                      minHeight: dia.incidentes > 0 ? '5px' : '0'
                    }}
                    title={`${dia.incidentes} incidente${dia.incidentes !== 1 ? 's' : ''}`}
                  >
                    {dia.incidentes > 0 && (
                      <span className="barra-valor">{dia.incidentes}</span>
                    )}
                  </div>
                </div>
                <div className="barra-label">
                  <div className="dia">{formatearDia(dia.fecha)}</div>
                  <div className="fecha">{formatearFecha(dia.fecha)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gráfico de Respuestas */}
        <div className="grafico-seccion">
          <h4>Respuestas por Día</h4>
          <div className="grafico-barras">
            {tendencias.map((dia, index) => (
              <div key={index} className="barra-container">
                <div className="barra-wrapper">
                  <div 
                    className="barra-stack"
                    style={{ 
                      height: `${(dia.total / maxRespuestas) * 100}%`,
                      minHeight: dia.total > 0 ? '5px' : '0'
                    }}
                  >
                    {dia.confirmados > 0 && (
                      <div 
                        className="barra-segmento confirmado"
                        style={{ 
                          height: `${(dia.confirmados / dia.total) * 100}%`
                        }}
                        title={`${dia.confirmados} confirmado${dia.confirmados !== 1 ? 's' : ''}`}
                      />
                    )}
                    {dia.declinados > 0 && (
                      <div 
                        className="barra-segmento declinado"
                        style={{ 
                          height: `${(dia.declinados / dia.total) * 100}%`
                        }}
                        title={`${dia.declinados} declinado${dia.declinados !== 1 ? 's' : ''}`}
                      />
                    )}
                    {dia.pendientes > 0 && (
                      <div 
                        className="barra-segmento pendiente"
                        style={{ 
                          height: `${(dia.pendientes / dia.total) * 100}%`
                        }}
                        title={`${dia.pendientes} pendiente${dia.pendientes !== 1 ? 's' : ''}`}
                      />
                    )}
                    {dia.total > 0 && (
                      <span className="barra-valor">{dia.total}</span>
                    )}
                  </div>
                </div>
                <div className="barra-label">
                  <div className="dia">{formatearDia(dia.fecha)}</div>
                  <div className="fecha">{formatearFecha(dia.fecha)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="grafico-leyenda">
        <div className="leyenda-item">
          <span className="leyenda-color confirmado"></span>
          <span>Confirmados</span>
        </div>
        <div className="leyenda-item">
          <span className="leyenda-color declinado"></span>
          <span>Declinados</span>
        </div>
        <div className="leyenda-item">
          <span className="leyenda-color pendiente"></span>
          <span>Pendientes</span>
        </div>
      </div>

      {/* Estadísticas de Tendencias */}
      <div className="tendencias-stats">
        <div className="stat-tendencia">
          <span className="stat-label">Total Incidentes (7 días):</span>
          <span className="stat-value">{tendencias.reduce((acc, d) => acc + d.incidentes, 0)}</span>
        </div>
        <div className="stat-tendencia">
          <span className="stat-label">Promedio Diario:</span>
          <span className="stat-value">
            {(tendencias.reduce((acc, d) => acc + d.incidentes, 0) / 7).toFixed(1)}
          </span>
        </div>
        <div className="stat-tendencia">
          <span className="stat-label">Total Respuestas:</span>
          <span className="stat-value">{tendencias.reduce((acc, d) => acc + d.total, 0)}</span>
        </div>
      </div>
    </div>
  )
}

export default TendenciasGrafico

