import { getConnection } from '../../platform/database/connection.js'
import { logger } from '../../platform/logger/logger.js'

export class MySQLVehiculoInvolucradoRepository {
  constructor() {
    this.tableName = 'vehiculoInvolucrado'
  }

  async insertarVehiculo(vehiculo) {
    const query = `
      INSERT INTO ${this.tableName} 
        (tipo, dominio, cantidad, modelo, anio, aseguradora, poliza)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    const params = [
      vehiculo.tipo || null,
      vehiculo.dominio || null,
      vehiculo.cantidad || 1,
      vehiculo.modelo || null,
      vehiculo.anio || null,
      vehiculo.aseguradora || null,
      vehiculo.poliza || null
    ]

    const connection = getConnection()
    try {
      const [result] = await connection.execute(query, params)
      logger.debug('🚗 Vehículo involucrado insertado', { idVehiculo: result.insertId })
      return result.insertId
    } catch (error) {
      logger.error('❌ Error al insertar vehículo involucrado', { error: error.message })
      throw new Error('Error al insertar el vehículo involucrado')
    }
  }
}
