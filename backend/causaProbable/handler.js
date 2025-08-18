import { logger } from '../internal/platform/logger/logger.js'

export class CausaProbableHandler {
  constructor(causaProbableService) {
    this.causaProbableService = causaProbableService
  }

  /**
   * GET /api/causas-probables
   * Obtener todas las causas probables
   */
  async listarCausasProbables(req, res) {
    try {
      logger.info('Solicitud: Obtener causas probables')

      const causas = await this.causaProbableService.listarCausasProbables()

      logger.info('✅ Causas probables obtenidas', { count: causas.length })

      res.status(200).json({
        success: true,
        message: `${causas.length} causas probables encontradas`,
        data: causas
      })
    } catch (error) {
      logger.error('❌ Error al obtener causas probables', {
        error: error.message
      })
      res.status(500).json({
        success: false,
        message: 'Error al obtener causas probables',
        error: error.message
      })
    }
  }

  /**
   * GET /api/causas-probables/:id
   * Obtener causa probable por ID
   */
  async obtenerCausaProbablePorId(req, res) {
    try {
      const { id } = req.params
      logger.info('Solicitud: Obtener causa probable por ID', { id })

      const causa = await this.causaProbableService.obtenerCausaProbablePorId(id)

      if (!causa) {
        logger.warn('⚠️ Causa probable no encontrada', { id })
        return res.status(404).json({
          success: false,
          message: 'Causa probable no encontrada'
        })
      }

      logger.info('✅ Causa probable encontrada', { id })

      res.status(200).json({
        success: true,
        message: 'Causa probable encontrada',
        data: causa
      })
    } catch (error) {
      logger.error('❌ Error al obtener causa probable por ID', {
        id: req.params.id,
        error: error.message
      })
      res.status(500).json({
        success: false,
        message: 'Error al obtener causa probable',
        error: error.message
      })
    }
  }
} 