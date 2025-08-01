import { logger } from '../internal/platform/logger/logger.js'
import { crearMaterialPeligrosoDto } from './dto/create-materialPeligroso.dto.js'

export class MaterialPeligrosoHandler {
  constructor(materialPeligrosoService) {
    this.materialPeligrosoService = materialPeligrosoService
  }

  /**
   * POST /api/materiales-peligrosos
   */
  async registrar(req, res) {
    try {
      // Validamos la data con el DTO
      const dto = crearMaterialPeligrosoDto(req.body)

      // Guardar material peligroso y sus relaciones (incluye damnificados)
      const idMatPel = await this.materialPeligrosoService.registrarMaterialPeligroso(dto)

      res.status(201).json({
        success: true,
        message: '✅ Material peligroso registrado correctamente',
        idMatPel
      })
    } catch (error) {
      logger.error('❌ Error en registrar material peligroso:', error)
      res.status(400).json({ success: false, message: error.message })
    }
  }

  /**
   * GET /api/materiales-peligrosos/:idIncidente
   */
  async obtenerPorIncidente(req, res) {
    try {
      const idIncidente = parseInt(req.params.idIncidente)
      if (isNaN(idIncidente)) {
        return res.status(400).json({ success: false, message: 'ID inválido' })
      }

      const material = await this.materialPeligrosoService.obtenerPorIncidente(idIncidente)

      if (!material) {
        return res.status(404).json({ success: false, message: 'No encontrado' })
      }

      res.status(200).json({ success: true, data: material })
    } catch (error) {
      logger.error('❌ Error al obtener material peligroso:', error)
      res.status(500).json({ success: false, message: 'Error interno' })
    }
  }

  /**
   * GET /api/materiales-peligrosos
   */
  async listar(req, res) {
    try {
      const materiales = await this.materialPeligrosoService.obtenerTodos()
      res.status(200).json({ success: true, data: materiales })
    } catch (error) {
      logger.error('❌ Error al listar materiales peligrosos:', error)
      res.status(500).json({ success: false, message: 'Error interno' })
    }
  }
}
