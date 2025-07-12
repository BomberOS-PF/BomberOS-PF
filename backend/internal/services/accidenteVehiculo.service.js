import { logger } from '../platform/logger/logger.js'

export class AccidenteVehiculoService {
  constructor(accidenteVehiculoRepository) {
    this.accidenteVehiculoRepository = accidenteVehiculoRepository
  }

  async asociarAccidenteVehiculo(idAccidente, idVehiculo) {
    try {
      await this.accidenteVehiculoRepository.asociar(idAccidente, idVehiculo)
      logger.debug('🚗 Vehículo asociado al accidente', { idAccidente, idVehiculo })
    } catch (error) {
      logger.error('❌ Error al asociar vehículo al accidente', { error: error.message })
      throw new Error('Error al asociar vehículo al accidente')
    }
  }
}
