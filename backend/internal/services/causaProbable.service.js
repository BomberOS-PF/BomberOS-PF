import { logger } from '../platform/logger/logger.js'

export class CausaProbableService {
  constructor(causaProbableRepository) {
    this.causaProbableRepository = causaProbableRepository
  }

  async listarCausasProbables() {
    try {
      logger.debug('Servicio: Listar causas probables')
      const causas = await this.causaProbableRepository.listarCausasProbables()
      logger.info('✅ Causas probables obtenidas', { count: causas.length })
      return causas
    } catch (error) {
      logger.error('❌ Error al obtener causas probables', { error: error.message })
      throw error
    }
  }

  async obtenerCausaProbablePorId(id) {
    try {
      logger.debug('Servicio: Obtener causa probable por ID', { id })
      const causa = await this.causaProbableRepository.obtenerCausaProbablePorId(id)
      if (!causa) {
        logger.warn('⚠️ Causa probable no encontrada', { id })
        return null
      }
      logger.info('✅ Causa probable encontrada', { id, descripcion: causa.descripcion })
      return causa
    } catch (error) {
      logger.error('❌ Error al obtener causa probable por ID', { id, error: error.message })
      throw error
    }
  }
} 