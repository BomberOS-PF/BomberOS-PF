import { getConnection } from '../platform/database/connection.js'
import { logger } from '../platform/logger/logger.js'

export class MySQLTipoMatInvolucradoRepository {
  async obtenerTodos() {
    const connection = await getConnection()
    try {
      const [rows] = await connection.execute(
        `SELECT idTipoMatInvolucrado, nombre FROM tipoMatInvolucrado`
      )
      return rows
    } catch (error) {
      logger.error('❌ Error al obtener tipos de materiales involucrados', error)
      throw error
    }
  }

  async obtenerPorId(id) {
    const connection = await getConnection()
    try {
      const [rows] = await connection.execute(
        `SELECT idTipoMatInvolucrado, nombre FROM tipoMatInvolucrado WHERE idTipoMatInvolucrado = ?`,
        [id]
      )
      return rows[0] || null
    } catch (error) {
      logger.error('❌ Error al obtener tipo de material involucrado', error)
      throw error
    }
  }
}
