import { getConnection } from '../platform/database/connection.js'
import { logger } from '../platform/logger/logger.js'

export class MySQLRangoRepository {
  async obtenerTodos() {
    const connection = await getConnection()
    try {
      const [rows] = await connection.execute('SELECT * FROM rango')
      return rows
    } catch (error) {
      logger.error('❌ Error al obtener rangos:', error)
      throw error
    }
  }
}
