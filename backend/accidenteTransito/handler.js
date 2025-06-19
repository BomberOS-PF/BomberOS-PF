import { logger } from '../internal/platform/logger/logger.js'

export class AccidenteTransitoHandler {
  constructor(accidenteTransitoService) {
    this.accidenteTransitoService = accidenteTransitoService
  }

  /**
   * POST /api/accidentes
   * Registrar un accidente de tránsito
   */
  async registrar(req, res) {
    try {
      const datos = req.body

      if (!datos.idIncidente || !datos.detalle) {
        return res.status(400).json({ success: false, message: 'Faltan datos obligatorios' })
      }

      const resultado = await this.accidenteTransitoService.registrarAccidente(datos)
      res.status(201).json({ success: true, message: 'Accidente registrado', data: resultado })
    } catch (error) {
      logger.error('❌ Error en AccidenteTransitoHandler.registrar', { error: error.message })
      res.status(500).json({ success: false, message: 'Error interno al registrar accidente' })
    }
  }
}
