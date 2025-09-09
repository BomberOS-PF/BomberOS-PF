import { logger } from '../../internal/platform/logger/logger.js'

export class LocalizacionHandler {
  constructor(localizacionService) {
    this.localizacionService = localizacionService
  }

  /**
   * GET /api/localizaciones
   * Obtener todas las localizaciones
   */
  async listarLocalizaciones(req, res) {
    try {
      logger.info('Solicitud: Obtener localizaciones')

      const localizaciones = await this.localizacionService.listarLocalizaciones()

      logger.info('✅ Localizaciones obtenidas', { count: localizaciones.length })

      res.status(200).json({
        success: true,
        message: `${localizaciones.length} localizaciones encontradas`,
        data: localizaciones
      })
    } catch (error) {
      logger.error('❌ Error al obtener localizaciones', {
        error: error.message
      })
      res.status(500).json({
        success: false,
        message: 'Error al obtener localizaciones',
        error: error.message
      })
    }
  }

  /**
   * GET /api/localizaciones/:id
   * Obtener localizacion por ID
   */
  async obtenerLocalizacionPorId(req, res) {
    try {
      const { id } = req.params
      logger.info('Solicitud: Obtener localizacion por ID', { id })

      const localizacion = await this.localizacionService.obtenerLocalizacionPorId(id)

      if (!localizacion) {
        logger.warn('⚠️ Localizacion no encontrada', { id })
        return res.status(404).json({
          success: false,
          message: 'Localizacion no encontrada'
        })
      }

      logger.info('✅ Localizacion encontrada', { id })

      res.status(200).json({
        success: true,
        message: 'Localizacion encontrada',
        data: localizacion
      })
    } catch (error) {
      logger.error('❌ Error al obtener localizacion por ID', {
        id: req.params.id,
        error: error.message
      })
      res.status(500).json({
        success: false,
        message: 'Error al obtener localizacion',
        error: error.message
      })
    }
  }
} 