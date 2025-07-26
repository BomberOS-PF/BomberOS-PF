import { logger } from '../platform/logger/logger.js'

export class LocalizacionService {
  constructor(localizacionRepository) {
    this.localizacionRepository = localizacionRepository
  }

  async listarLocalizaciones() {
    try {
      logger.debug('Servicio: Listar localizaciones')
      const localizaciones = await this.localizacionRepository.listarLocalizaciones()
      logger.info('✅ Localizaciones obtenidas', { count: localizaciones.length })
      return localizaciones
    } catch (error) {
      logger.error('❌ Error al obtener localizaciones', { error: error.message })
      throw error
    }
  }

  async obtenerLocalizacionPorId(id) {
    try {
      logger.debug('Servicio: Obtener localizacion por ID', { id })
      const localizacion = await this.localizacionRepository.obtenerLocalizacionPorId(id)
      if (!localizacion) {
        logger.warn('⚠️ Localizacion no encontrada', { id })
        return null
      }
      logger.info('✅ Localizacion encontrada', { id, nombre: localizacion.nombre })
      return localizacion
    } catch (error) {
      logger.error('❌ Error al obtener localizacion por ID', { id, error: error.message })
      throw error
    }
  }
} 