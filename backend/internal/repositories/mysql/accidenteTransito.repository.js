import { getConnection } from '../../platform/database/connection.js'
import { logger } from '../../platform/logger/logger.js'

export class MySQLAccidenteTransitoRepository {
  constructor() {
    this.tableName = 'accidenteTransito'
  }

  async insertarAccidente(idIncidente, detalle) {
    const query = `
      INSERT INTO ${this.tableName} (idIncidente, detalle)
      VALUES (?, ?)
    `
    const params = [idIncidente, detalle]

    const connection = getConnection()
    try {
      const [result] = await connection.execute(query, params)
      logger.debug('📌 Accidente de tránsito insertado', { idAccidenteTransito: result.insertId })
      return result.insertId
    } catch (error) {
      logger.error('❌ Error al insertar accidente de tránsito', { error: error.message })
      throw new Error('Error al insertar el accidente en la base de datos')
    }
  }
}
