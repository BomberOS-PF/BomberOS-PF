import { logger } from '../platform/logger/logger.js'

export class VehiculoService {
  constructor(vehiculoRepository) {
    this.vehiculoRepository = vehiculoRepository
  }

  async registrarVehiculo(data) {
    try {
      logger.info('🚗 Registrando vehículo...', data)
      const id = await this.vehiculoRepository.insertarVehiculo(data)
      logger.info('✅ Vehículo registrado con ID:', id)
      return { idVehiculo: id }
    } catch (error) {
      logger.error('❌ Error al registrar vehículo:', { error: error.message })
      throw new Error('Error al registrar el vehículo')
    }
  }
}
