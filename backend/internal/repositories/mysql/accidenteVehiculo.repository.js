import { getConnection } from '../../platform/database/connection.js'
import { logger } from '../../platform/logger/logger.js'

export class MySQLAccidenteVehiculoRepository {
  constructor() {
    this.tableName = 'accidenteVehiculo'
  }

  async insertarRelacion(idAccidente, idVehiculo) {
    const query = `
      INSERT INTO ${this.tableName} (idAccidenteTransito, idVehiculo)
      VALUES (?, ?)
    `
    const params = [idAccidente, idVehiculo]

    const connection = getConnection()
    try {
      const [result] = await connection.execute(query, params)
      logger.debug('✅ Relación accidente-vehículo insertada', { id: result.insertId })
      return result.insertId
    } catch (error) {
      logger.error('❌ Error al insertar relación accidente-vehículo', { error: error.message })
      throw new Error('Error al insertar relación accidente-vehículo')
    }
  }
}
