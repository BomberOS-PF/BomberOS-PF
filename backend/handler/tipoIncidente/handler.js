import { logger } from '../../internal/platform/logger/logger.js'

export class TipoIncidenteHandler {
  constructor(tipoIncidenteService) {
    this.tipoIncidenteService = tipoIncidenteService
  }

  /**
   * GET /api/tipos-incidente
   * Obtener todos los tipos de incidente
   */
  async listarTiposIncidente(req, res) {
    try {
      logger.info('Solicitud: Obtener tipos de incidente')

      const tipos = await this.tipoIncidenteService.listarTiposIncidente()

      logger.info('✅ Tipos de incidente obtenidos', { count: tipos.length })

      res.status(200).json({
        success: true,
        message: `${tipos.length} tipos de incidente encontrados`,
        data: tipos
      })
    } catch (error) {
      logger.error('❌ Error al obtener tipos de incidente', {
        error: error.message
      })
      res.status(500).json({
        success: false,
        message: 'Error al obtener tipos de incidente',
        error: error.message
      })
    }
  }

  /**
   * GET /api/tipos-incidente/:id
   * Obtener tipo de incidente por ID
   */
  async obtenerTipoIncidentePorId(req, res) {
    try {
      const { id } = req.params
      logger.info('Solicitud: Obtener tipo de incidente por ID', { id })

      const tipo = await this.tipoIncidenteService.obtenerTipoIncidentePorId(id)

      if (!tipo) {
        logger.warn('⚠️ Tipo de incidente no encontrado', { id })
        return res.status(404).json({
          success: false,
          message: 'Tipo de incidente no encontrado'
        })
      }

      logger.info('✅ Tipo de incidente encontrado', { id })

      res.status(200).json({
        success: true,
        message: 'Tipo de incidente encontrado',
        data: tipo
      })
    } catch (error) {
      logger.error('❌ Error al obtener tipo de incidente por ID', {
        id: req.params.id,
        error: error.message
      })
      res.status(500).json({
        success: false,
        message: 'Error al obtener tipo de incidente',
        error: error.message
      })
    }
  }
} 