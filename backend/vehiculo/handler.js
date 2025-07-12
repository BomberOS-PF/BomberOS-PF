import { logger } from '../internal/platform/logger/logger.js'

export class VehiculoHandler {
  constructor(vehiculoService) {
    this.vehiculoService = vehiculoService
  }

  async registrar(req, res) {
    try {
      const data = req.body
      const resultado = await this.vehiculoService.registrarVehiculo(data)
      res.status(201).json({ success: true, data: resultado })
    } catch (error) {
      logger.error('❌ Error en VehiculoHandler.registrar:', { error: error.message })
      res.status(500).json({ success: false, message: error.message })
    }
  }
}
