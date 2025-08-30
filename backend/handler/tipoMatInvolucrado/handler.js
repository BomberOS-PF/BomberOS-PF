import { logger } from '../../internal/platform/logger/logger.js'

export class TipoMatInvolucradoHandler {
  constructor(service) {
    this.service = service
  }

  async listar(req, res) {
    try {
      const tipos = await this.service.obtenerTodos()
      res.status(200).json({ success: true, data: tipos })
    } catch (error) {
      logger.error('❌ Error al listar tipos de materiales involucrados:', error)
      res.status(500).json({ success: false, message: 'Error interno' })
    }
  }

  async obtenerPorId(req, res) {
    try {
      const id = parseInt(req.params.id)
      if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' })

      const tipo = await this.service.obtenerPorId(id)
      if (!tipo) return res.status(404).json({ success: false, message: 'No encontrado' })

      res.status(200).json({ success: true, data: tipo })
    } catch (error) {
      logger.error('❌ Error al obtener tipo de material involucrado:', error)
      res.status(500).json({ success: false, message: 'Error interno' })
    }
  }
}
