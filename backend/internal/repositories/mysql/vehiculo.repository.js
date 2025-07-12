
import { getConnection } from '../../platform/database/connection.js'
import { logger } from '../../platform/logger/logger.js'

export class MySQLVehiculoRepository {
  constructor() {
    this.tableName = 'vehiculo'
  }

  async insertarVehiculo(vehiculo) {
    const query = `
      INSERT INTO ${this.tableName} 
        (patente, modelo, marca, anio, aseguradora, poliza)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    const params = [
      vehiculo.patente || null,
      vehiculo.modelo || null,
      vehiculo.marca || null,
      vehiculo.anio || null,
      vehiculo.aseguradora || null,
      vehiculo.poliza || null
    ]

    const connection = getConnection()
    try {
      const [result] = await connection.execute(query, params)
      logger.debug('🚗 Vehículo  insertado', { idVehiculo: result.insertId })
      return result.insertId
    } catch (error) {
      logger.error('❌ Error al insertar vehículo ', { error: error.message })
      throw new Error('Error al insertar el vehículo ')
    }
  }
}