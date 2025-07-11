import { logger } from '../platform/logger/logger.js'

export class DamnificadoService {
  constructor(damnificadoRepository) {
    this.damnificadoRepository = damnificadoRepository
  }

  async registrarDamnificado(damnificado) {
    try {
      const id = await this.damnificadoRepository.insertarDamnificado(damnificado)
      logger.debug('🧍 Damnificado registrado correctamente', { id })
      return id
    } catch (error) {
      logger.error('❌ Error en registrarDamnificado', { error: error.message })
      throw new Error('Error al registrar damnificado')
    }
  }
}
