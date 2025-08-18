import { logger } from '../platform/logger/logger.js'

export class TipoIncidenteService {
  constructor(tipoIncidenteRepository) {
    this.tipoIncidenteRepository = tipoIncidenteRepository
  }

  async listarTiposIncidente() {
    try {
      logger.debug('Servicio: Listar tipos de incidente')
      const tipos = await this.tipoIncidenteRepository.listarTiposIncidente()
      logger.info('✅ Tipos de incidente obtenidos', { count: tipos.length })
      return tipos
    } catch (error) {
      logger.error('❌ Error al obtener tipos de incidente', { error: error.message })
      throw error
    }
  }

  async obtenerTipoIncidentePorId(id) {
    try {
      logger.debug('Servicio: Obtener tipo de incidente por ID', { id })
      const tipo = await this.tipoIncidenteRepository.obtenerTipoIncidentePorId(id)
      if (!tipo) {
        logger.warn('⚠️ Tipo de incidente no encontrado', { id })
        return null
      }
      logger.info('✅ Tipo de incidente encontrado', { id, nombre: tipo.nombre })
      return tipo
    } catch (error) {
      logger.error('❌ Error al obtener tipo de incidente por ID', { id, error: error.message })
      throw error
    }
  }
} 