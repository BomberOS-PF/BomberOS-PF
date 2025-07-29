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
      const datos = crearMaterialPeligrosoDto(req.body)
      const resultado = await this.materialPeligrosoService.registrarMaterialPeligroso(datos)
      res.status(201).json({
        success: true,
        message: 'Material peligroso registrado correctamente',
        data: resultado
      })
    } catch (error) {
      logger.error('❌ Error en MaterialPeligrosoHandler.registrar', { error: error.message })
      res.status(400).json({ success: false, message: error.message })
    }
  }

  /**
   * GET /api/materiales-peligrosos/:id
   */
  async obtenerPorIncidente(req, res) {
    try {
      const id = parseInt(req.params.id)
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID inválido' })
      }

      const data = await this.materialPeligrosoService.obtenerPorIncidente(id)
      if (!data) {
        return res.status(404).json({ success: false, message: 'No se encontró el registro' })
      }

      res.status(200).json({ success: true, data })
    } catch (error) {
      logger.error('❌ Error en MaterialPeligrosoHandler.obtenerPorIncidente', { error: error.message })
      res.status(500).json({ success: false, message: 'Error interno al consultar el material peligroso' })
    }
  }

  /**
   * GET /api/materiales-peligrosos
   */
  async listarTodos(req, res) {
    try {
      const lista = await this.materialPeligrosoService.obtenerTodos()
      res.status(200).json({ success: true, data: lista })
    } catch (error) {
      logger.error('❌ Error al listar materiales peligrosos', { error: error.message })
      res.status(500).json({ success: false, message: 'Error interno al listar materiales peligrosos' })
    }
  }
}
