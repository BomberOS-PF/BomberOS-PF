
import { logger } from '../internal/platform/logger/logger.js'
import { crearRescateDto } from './dto/create-rescate.dto.js'

export class RescateHandler {
  constructor(rescateService) {
    this.rescateService = rescateService
  }

  /**
   * POST /api/rescate
   */
  async registrar(req, res) {
    console.log('🚨 [HANDLER] Entrando a registrar rescate')
    try {
      console.log('📥 BODY recibido:', JSON.stringify(req.body, null, 2))
      const datos = crearRescateDto(req.body)
      console.log('✅ DTO generado:', datos)
      const resultado = await this.rescateService.registrarRescate(datos)
      console.log('✅ Resultado service:', resultado)
      return res.status(201).json({
        success: true,
        message: 'Rescate registrado correctamente',
        data: resultado
      })
    } catch (error) {
      console.error('❌ [HANDLER] Error:', error.message, error.stack)
      return res.status(500).json({ error: 'Error en handler', detalle: error.message })
    }
  }

  /**
   * GET /api/rescate/:idIncidente
   */
  async obtenerPorIncidente(req, res) {
    try {
      const idIncidente = parseInt(req.params.idIncidente, 10)
      if (!idIncidente) {
        return res.status(400).json({
          success: false,
          message: 'ID de incidente inválido'
        })
      }

      const data = await this.rescateService.obtenerPorIncidente(idIncidente)

      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'No se encontró registro de rescate para este incidente'
        })
      }

      res.status(200).json({ success: true, data })
    } catch (error) {
      logger.error('❌ Error en RescateHandler.obtenerPorIncidente', {
        error: error.message
      })
      res.status(500).json({
        success: false,
        message: 'Error interno al consultar el rescate'
      })
    }
  }

  /**
   * GET /api/rescate
   */
  async listarTodos(req, res) {
    try {
      const lista = await this.rescateService.obtenerTodos()
      res.status(200).json({ success: true, data: lista })
    } catch (error) {
      logger.error('❌ Error en RescateHandler.listarTodos', {
        error: error.message
      })
      res.status(500).json({
        success: false,
        message: 'Error interno al listar rescates'
      })
    }
  }
}
