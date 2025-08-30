import { logger } from '../../internal/platform/logger/logger.js'

export class CategoriaMaterialPeligrosoHandler {
  constructor(categoriaRepository) {
    this.categoriaRepository = categoriaRepository
  }

  /**
   * GET /api/categorias-material-peligroso
   */
  async listar(req, res) {
    try {
      const categorias = await this.categoriaRepository.obtenerTodas()
      res.status(200).json({ success: true, data: categorias })
    } catch (error) {
      logger.error('❌ Error al listar categorías de material peligroso:', error)
      res.status(500).json({ success: false, message: 'Error interno al listar categorías' })
    }
  }

  /**
   * GET /api/categorias-material-peligroso/:id
   */
  async obtenerPorId(req, res) {
    try {
      const id = parseInt(req.params.id)
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID inválido' })
      }

      const categoria = await this.categoriaRepository.obtenerPorId(id)
      if (!categoria) {
        return res.status(404).json({ success: false, message: 'Categoría no encontrada' })
      }

      res.status(200).json({ success: true, data: categoria })
    } catch (error) {
      logger.error('❌ Error al obtener categoría de material peligroso por ID:', error)
      res.status(500).json({ success: false, message: 'Error interno' })
    }
  }
}
