import { getConnection } from '../../platform/database/connection.js'
import { logger } from '../../platform/logger/logger.js'

export class MySQLAccidenteVehiculoRepository {
  constructor() {
    this.tableName = 'accidenteVehiculoInvolucrado'
  }

  async asociar(idAccidente, idVehiculo) {
    const query = `
      INSERT INTO ${this.tableName} (idAccidenteTransito, idVehiculoInvolucrado)
      VALUES (?, ?)
    `
    const connection = getConnection()
    try {
      await connection.execute(query, [idAccidente, idVehiculo])
      logger.debug('✅ Asociación accidente-vehiculo creada', { idAccidente, idVehiculo })
    } catch (error) {
      logger.error('❌ Error al asociar accidente y vehículo', { error: error.message })
      throw new Error('Error al asociar accidente y vehículo')
    }
  }
}
