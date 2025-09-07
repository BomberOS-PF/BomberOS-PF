import { getConnection } from '../platform/database/connection.js'
import { logger } from '../platform/logger/logger.js'

export class MySQLTipoIncidenteRepository {
  constructor() {
    this.tableName = 'tipoIncidente'
  }

  async listarTiposIncidente() {
    const query = `SELECT idTipoIncidente, nombre FROM ${this.tableName} ORDER BY idTipoIncidente`
    const connection = getConnection()
    try {
      const [rows] = await connection.execute(query)
      logger.debug('📋 Tipos de incidente obtenidos', { count: rows.length })
      return rows
    } catch (error) {
      logger.error('❌ Error al obtener tipos de incidente', { error: error.message })
      throw new Error('Error al obtener tipos de incidente')
    }
  }

  async obtenerTipoIncidentePorId(id) {
    const query = `SELECT idTipoIncidente, nombre FROM ${this.tableName} WHERE idTipoIncidente = ?`
    const connection = getConnection()
    try {
      const [rows] = await connection.execute(query, [id])
      return rows.length > 0 ? rows[0] : null
    } catch (error) {
      logger.error('❌ Error al obtener tipo de incidente por ID', { error: error.message })
      throw new Error('Error al obtener tipo de incidente')
    }
  }
} 