import { getConnection } from '../../platform/database/connection.js'
import { logger } from '../../platform/logger/logger.js'

export class MySQLAccionMaterialRepository {
  async obtenerTodas() {
    const connection = await getConnection()
    try {
      const [rows] = await connection.execute(
        `SELECT idAccionMaterial, nombre FROM accionMaterial`
      )
      return rows
    } catch (error) {
      logger.error('❌ Error al obtener acciones sobre el material', error)
      throw error
    }
  }

  async obtenerPorId(id) {
    const connection = await getConnection()
    try {
      const [rows] = await connection.execute(
        `SELECT idAccionMaterial, nombre FROM accionMaterial WHERE idAccionMaterial = ?`,
        [id]
      )
      return rows[0] || null
    } catch (error) {
      logger.error('❌ Error al obtener acción sobre el material', error)
      throw error
    }
  }

 async asociarAcciones(idMatPel, acciones) {
    const connection = await getConnection()
    for (const accionId of acciones) {
      await connection.execute(
        `INSERT INTO matPelAccionMaterial (idMatPel, idAccionMaterial)
         VALUES (?, ?)`,
        [idMatPel, accionId]
      )
    }
  }
}
