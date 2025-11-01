import { logger } from '../../internal/platform/logger/logger.js'

export class RespuestaIncidenteHandler {
  constructor(respuestaService) {
    this.respuestaService = respuestaService
  }

  /**
   * Obtener respuestas de un incidente específico
   * GET /api/incidentes/:id/respuestas
   */
  async obtenerRespuestasIncidente(req, res) {
    try {
      const { id } = req.params
      
      logger.info('📊 Obteniendo respuestas del incidente', { incidenteId: id })
      
      const respuestas = await this.respuestaService.obtenerRespuestasIncidente(id)
      const estadisticas = await this.respuestaService.obtenerEstadisticasIncidente(id)
      
      res.json({
        success: true,
        data: {
          incidenteId: parseInt(id),
          estadisticas,
          respuestas
        }
      })
      
    } catch (error) {
      logger.error('❌ Error al obtener respuestas del incidente', {
        error: error.message,
        incidenteId: req.params.id
      })
      
      res.status(500).json({
        success: false,
        message: 'Error al obtener respuestas del incidente',
        error: error.message
      })
    }
  }

  /**
   * Obtener estadísticas de respuestas de un incidente
   * GET /api/incidentes/:id/estadisticas
   */
  async obtenerEstadisticasIncidente(req, res) {
    try {
      const { id } = req.params
      
      logger.info('📈 Obteniendo estadísticas del incidente', { incidenteId: id })
      
      const estadisticas = await this.respuestaService.obtenerEstadisticasIncidente(id)
      
      res.json({
        success: true,
        data: estadisticas
      })
      
    } catch (error) {
      logger.error('❌ Error al obtener estadísticas del incidente', {
        error: error.message,
        incidenteId: req.params.id
      })
      
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas del incidente',
        error: error.message
      })
    }
  }

  /**
   * Obtener resumen de todos los incidentes con respuestas
   * GET /api/incidentes/resumen-respuestas
   */
  async obtenerResumenIncidentes(req, res) {
    try {
      logger.info('📋 Obteniendo resumen de incidentes con respuestas')
      
      const resumen = await this.respuestaService.obtenerResumenIncidentes()
      
      res.json({
        success: true,
        data: resumen
      })
      
    } catch (error) {
      logger.error('❌ Error al obtener resumen de incidentes', {
        error: error.message
      })
      
      res.status(500).json({
        success: false,
        message: 'Error al obtener resumen de incidentes',
        error: error.message
      })
    }
  }

  /**
   * Dashboard de respuestas en tiempo real
   * GET /api/dashboard/respuestas
   */
  async obtenerDashboardRespuestas(req, res) {
    try {
      logger.info('📊 Obteniendo dashboard de respuestas')
      
      const resumen = await this.respuestaService.obtenerResumenIncidentes()
      
      // Calcular estadísticas generales
      const estadisticasGenerales = resumen.reduce((acc, incidente) => {
        acc.totalIncidentes++
        acc.totalRespuestas += incidente.totalRespuestas
        acc.totalConfirmados += incidente.confirmados
        acc.totalRechazados += incidente.rechazados
        acc.totalDemorados += incidente.demorados || 0
        return acc
      }, {
        totalIncidentes: 0,
        totalRespuestas: 0,
        totalConfirmados: 0,
        totalRechazados: 0,
        totalDemorados: 0
      })
      
      res.json({
        success: true,
        data: {
          estadisticasGenerales,
          incidentesRecientes: resumen.slice(0, 10),
          timestamp: new Date().toISOString()
        }
      })
      
    } catch (error) {
      logger.error('❌ Error al obtener dashboard de respuestas', {
        error: error.message
      })
      
      res.status(500).json({
        success: false,
        message: 'Error al obtener dashboard de respuestas',
        error: error.message
      })
    }
  }
}
