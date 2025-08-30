import { logger } from '../../internal/platform/logger/logger.js'

export class AccionMaterialHandler {
  constructor(service) {
    this.service = service
  }

  async listar(res) {
    try {
      const acciones = await this.service.obtenerTodas()
      res.status(200).json({ success: true, data: acciones })
    } catch (error) {
      logger.error('❌ Error al listar acciones sobre el material:', error)
      res.status(500).json({ success: false, message: 'Error interno' })
    }
  }

  async obtenerPorId(req, res) {
    try {
      const id = parseInt(req.params.id)
      if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' })

      const accion = await this.service.obtenerPorId(id)
      if (!accion) return res.status(404).json({ success: false, message: 'No encontrada' })

      res.status(200).json({ success: true, data: accion })
    } catch (error) {
      logger.error('❌ Error al obtener acción sobre el material:', error)
      res.status(500).json({ success: false, message: 'Error interno' })
    }
  }
}
