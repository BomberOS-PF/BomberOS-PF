import { logger } from '../internal/platform/logger/logger.js'

export class RangoHandler {
  constructor(rangoService) {
    this.rangoService = rangoService
  }

  async getAll(req, res) {
    try {
      const rangos = await this.rangoService.obtenerTodosLosRangos()
      res.status(200).json({
        success: true,
        data: rangos
      })
    } catch (error) {
      logger.error('❌ Error al obtener rangos:', error)
      res.status(500).json({
        success: false,
        error: 'Error al obtener rangos'
      })
    }
  }
}
