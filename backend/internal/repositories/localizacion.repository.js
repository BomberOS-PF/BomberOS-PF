import { getConnection } from '../platform/database/connection.js'
import { logger } from '../platform/logger/logger.js'

export class MySQLLocalizacionRepository {
  constructor() {
    this.tableName = 'localizacion'
  }

  async listarLocalizaciones() {
    const query = `SELECT idLocalizacion, direccion, latitud, longitud, descripcion FROM ${this.tableName} ORDER BY idLocalizacion`
    const connection = getConnection()
    try {
      const [rows] = await connection.execute(query)
      logger.debug('📍 Localizaciones obtenidas', { count: rows.length })
      return rows
    } catch (error) {
      logger.error('❌ Error al obtener localizaciones', { error: error.message })
      throw new Error('Error al obtener localizaciones')
    }
  }

  async obtenerLocalizacionPorId(id) {
    const query = `SELECT idLocalizacion, direccion, latitud, longitud, descripcion FROM ${this.tableName} WHERE idLocalizacion = ?`
    const connection = getConnection()
    try {
      const [rows] = await connection.execute(query, [id])
      return rows.length > 0 ? rows[0] : null
    } catch (error) {
      logger.error('❌ Error al obtener localizacion por ID', { error: error.message })
      throw new Error('Error al obtener localizacion')
    }
  }
} 