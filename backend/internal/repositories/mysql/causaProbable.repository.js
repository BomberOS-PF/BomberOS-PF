import { getConnection } from '../../platform/database/connection.js'
import { logger } from '../../platform/logger/logger.js'

export class MySQLCausaProbableRepository {
  constructor() {
    this.tableName = 'causaProbable'
  }

  async listarCausasProbables() {
    const query = `SELECT idCausaProbable, descripcion FROM ${this.tableName} ORDER BY idCausaProbable`
    const connection = getConnection()
    try {
      const [rows] = await connection.execute(query)
      logger.debug('🔥 Causas probables obtenidas', { count: rows.length })
      return rows
    } catch (error) {
      logger.error('❌ Error al obtener causas probables', { error: error.message })
      throw new Error('Error al obtener causas probables')
    }
  }

  async obtenerCausaProbablePorId(id) {
    const query = `SELECT idCausaProbable, descripcion FROM ${this.tableName} WHERE idCausaProbable = ?`
    const connection = getConnection()
    try {
      const [rows] = await connection.execute(query, [id])
      return rows.length > 0 ? rows[0] : null
    } catch (error) {
      logger.error('❌ Error al obtener causa probable por ID', { error: error.message })
      throw new Error('Error al obtener causa probable')
    }
  }
} 