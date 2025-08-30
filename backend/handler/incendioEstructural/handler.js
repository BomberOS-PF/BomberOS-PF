import { logger } from '../../internal/platform/logger/logger.js'
import { crearIncendioEstructuralDto } from './dto/create-incendioEstructural.dto.js'

export class IncendioEstructuralHandler {
  constructor(incendioEstructuralService) {
    this.incendioEstructuralService = incendioEstructuralService
  }

  /**
   * POST /api/incendio-estructural
   */
  async registrar(req, res) {
    try {
      logger.info('📩 Datos recibidos en handler:', req.body)

      const datos = crearIncendioEstructuralDto(req.body)
      logger.debug('🛠️ DTO generado en handler:', datos)

      const resultado = await this.incendioEstructuralService.registrarIncendio(datos)

      res.status(201).json({
        success: true,
        message: 'Incendio estructural registrado correctamente',
        data: resultado // { idIncendioEstructural }
      })
    } catch (error) {
      logger.error('❌ Error en IncendioEstructuralHandler.registrar', {
        error: error.message,
        stack: error.stack
      })
      res.status(400).json({ success: false, message: error.message })
    }
  }

  /**
   * GET /api/incendio-estructural/:id
   */
  async obtenerPorIncidente(req, res) {
    try {
      const id = parseInt(req.params.id, 10)
      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        })
      }

      const data = await this.incendioEstructuralService.obtenerPorIncidente(id)

      if (!data) {
        return res.status(404).json({
          success: false,
          message: 'No se encontró el registro de incendio estructural'
        })
      }

      res.status(200).json({ success: true, data })
    } catch (error) {
      logger.error('❌ Error en IncendioEstructuralHandler.obtenerPorIncidente', {
        error: error.message
      })
      res.status(500).json({
        success: false,
        message: 'Error interno al consultar incendio estructural'
      })
    }
  }

  /**
   * GET /api/incendio-estructural
   */
  async listarTodos(req, res) {
    try {
      const lista = await this.incendioEstructuralService.obtenerTodos()
      res.status(200).json({ success: true, data: lista })
    } catch (error) {
      logger.error('❌ Error al listar incendios estructurales', {
        error: error.message
      })
      res.status(500).json({
        success: false,
        message: 'Error interno al listar incendios estructurales'
      })
    }
  }
}
