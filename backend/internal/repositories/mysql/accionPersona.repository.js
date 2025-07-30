import { getConnection } from '../../platform/database/connection.js'
import { logger } from '../../platform/logger/logger.js'

export class MySQLAccionPersonaRepository {
  async obtenerTodas() {
    const connection = await getConnection()
    try {
      const [rows] = await connection.execute(
        `SELECT idAccionPersona, nombre FROM accionPersona`
      )
      return rows
    } catch (error) {
      logger.error('❌ Error al obtener acciones sobre las personas', error)
      throw error
    }
  }

  async obtenerPorId(id) {
    const connection = await getConnection()
    try {
      const [rows] = await connection.execute(
        `SELECT idAccionPersona, nombre FROM accionPersona WHERE idAccionPersona = ?`,
        [id]
      )
      return rows[0] || null
    } catch (error) {
      logger.error('❌ Error al obtener acción sobre las personas', error)
      throw error
    }
  }
}
