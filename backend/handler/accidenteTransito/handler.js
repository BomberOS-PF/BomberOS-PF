import { logger } from '../../internal/platform/logger/logger.js'
import { crearAccidenteTransitoDto } from './dto/create-accidenteTransito.dto.js'

export class AccidenteTransitoHandler {
  constructor(accidenteTransitoService) {
    this.accidenteTransitoService = accidenteTransitoService
  }

  /**
   * POST /api/accidentes
   */
  async registrar(req, res) {
    try {
      const datos = crearAccidenteTransitoDto(req.body)
      const resultado = await this.accidenteTransitoService.registrarAccidente(datos)
      res.status(201).json({ success: true, message: 'Accidente registrado', data: resultado })
    } catch (error) {
      logger.error('❌ Error en AccidenteTransitoHandler.registrar', { error: error.message })
      res.status(400).json({ success: false, message: error.message })
    }
  }

  /**
   * GET /api/accidentes/:id
   */
  async obtenerPorIncidente(req, res) {
    try {
      const id = parseInt(req.params.id)
      if (!id) return res.status(400).json({ success: false, message: 'ID inválido' })

      const data = await this.accidenteTransitoService.obtenerAccidentePorIncidente(id)
      if (!data) return res.status(404).json({ success: false, message: 'No se encontró el accidente' })

      res.status(200).json({ success: true, data })
    } catch (error) {
      logger.error('❌ Error en AccidenteTransitoHandler.obtenerPorIncidente', { error: error.message })
      res.status(500).json({ success: false, message: 'Error interno al consultar accidente' })
    }
  }

  /**
   * GET /api/accidentes
   */
  async listarTodos(req, res) {
    try {
      const lista = await this.accidenteTransitoService.obtenerTodos()
      res.status(200).json({ success: true, data: lista })
    } catch (error) {
      logger.error('❌ Error al listar accidentes', { error: error.message })
      res.status(500).json({ success: false, message: 'Error interno al listar accidentes' })
    }
  }
}
