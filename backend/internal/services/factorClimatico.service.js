import { logger } from '../platform/logger/logger.js'

export class FactorClimaticoService {
  constructor(factorClimaticoRepository, damnificadoRepository) {
    this.factorClimaticoRepository = factorClimaticoRepository
    this.damnificadoRepository = damnificadoRepository
  }

  /**
   * Registrar factor climático y sus damnificados
   */
  async registrarFactorClimatico(datos) {
    try {
      logger.info('💾 Registrando factor climático...', datos)

      // Guardar el registro principal en climatico
      const idClimatico = await this.factorClimaticoRepository.guardar(datos)

      // Guardar damnificados (si existen)
      if (datos.damnificados && datos.damnificados.length > 0) {
        for (const dam of datos.damnificados) {
          await this.damnificadoRepository.insertarDamnificado({
            ...dam,
            idIncidente: datos.idIncidente
          })
        }
      }

      logger.info('✅ Factor climático registrado correctamente', { idClimatico })
      return { idClimatico }
    } catch (error) {
      logger.error('❌ Error en FactorClimaticoService.registrarFactorClimatico', {
        error: error.message,
        stack: error.stack
      })
      throw error
    }
  }

  /**
   * Obtener registro climático por idIncidente
   */
  async obtenerPorIncidente(idIncidente) {
    try {
      logger.debug(`🔍 Buscando factor climático por incidente ${idIncidente}`)

      const climatico = await this.factorClimaticoRepository.obtenerPorIncidente(
        idIncidente
      )
      if (!climatico) return null

      return climatico
    } catch (error) {
      logger.error('❌ Error en FactorClimaticoService.obtenerPorIncidente', {
        error: error.message
      })
      throw error
    }
  }

  /**
   * Listar todos los registros climáticos
   */
  async obtenerTodos() {
    try {
      return await this.factorClimaticoRepository.obtenerTodos()
    } catch (error) {
      logger.error('❌ Error en FactorClimaticoService.obtenerTodos', {
        error: error.message
      })
      throw error
    }
  }
}
