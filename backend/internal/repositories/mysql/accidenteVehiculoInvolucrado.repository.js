import { getConnection } from '../../platform/database/connection.js'
import { logger } from '../../platform/logger/logger.js'

export class MySQLAccidenteVehiculoRepository {
  constructor() {
    this.tableName = 'accidenteVehiculoInvolucrado'
  }

  async asociar(idAccidenteTransito, idVehiculoInvolucrado) {
    const query = `
      INSERT INTO ${this.tableName} (idAccidenteTransito, idVehiculoInvolucrado)
      VALUES (?, ?)
    `
    const connection = getConnection()

    try {
      await connection.execute(query, [idAccidenteTransito, idVehiculoInvolucrado])
      logger.debug('🔗 Vehículo asociado a accidente', { idAccidenteTransito, idVehiculoInvolucrado })
    } catch (error) {
      logger.error('❌ Error al asociar vehículo al accidente', { error: error.message })
      throw new Error('Error al asociar vehículo al accidente')
    }
  }
}
