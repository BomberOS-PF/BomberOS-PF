import { getConnection } from '../../platform/database/connection.js'
import { logger } from '../../platform/logger/logger.js'

export class MySQLCategoriaMaterialPeligrosoRepository {
  constructor() {
    this.table = 'categoria'
  }

  async obtenerTodas() {
    const connection = await getConnection()
    try {
      const [rows] = await connection.execute(`SELECT idCategoria, descripcion FROM ${this.table}`)
      return rows
    } catch (error) {
      logger.error('❌ Error al obtener todas las categorías', error)
      throw error
    }
  }

  async obtenerPorId(idCategoria) {
    const connection = await getConnection()
    try {
      const [rows] = await connection.execute(
        `SELECT idCategoria, descripcion FROM ${this.table} WHERE idCategoria = ?`,
        [idCategoria]
      )
      return rows[0] || null
    } catch (error) {
      logger.error('❌ Error al obtener categoría por ID', error)
      throw error
    }
  }
}
