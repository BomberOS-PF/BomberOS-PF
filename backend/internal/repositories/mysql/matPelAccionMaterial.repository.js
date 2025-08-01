import { getConnection } from '../../platform/database/connection.js'
import { logger } from '../../platform/logger/logger.js'

export class MySQLMatPelAccionMaterialRepository {
  /**
   * Inserta las relaciones entre MaterialPeligroso y Acciones sobre el Material
   */
  async asociarAcciones(idMatPel, accionesIds = []) {
    if (!accionesIds.length) return

    const connection = await getConnection()
    const values = accionesIds.map(idAccion => [idMatPel, idAccion])

    try {
      await connection.query(
        'INSERT INTO matPelAccionMaterial (idMatPel, idAccionMaterial) VALUES ?',
        [values]
      )
      logger.debug('✅ Asociadas acciones sobre el material:', {
        idMatPel,
        accionesIds
      })
    } catch (error) {
      logger.error('❌ Error al asociar acciones sobre el material:', error)
      throw error
    }
  }

  /**
   * Obtiene las acciones asociadas a un material peligroso
   */
  async obtenerPorMaterialPeligroso(idMatPel) {
    const connection = await getConnection()
    try {
      const [rows] = await connection.execute(
        `SELECT a.idAccionMaterial, a.nombre
         FROM accionMaterial a
         INNER JOIN matPelAccionMaterial mpam ON mpam.idAccionMaterial = a.idAccionMaterial
         WHERE mpam.idMatPel = ?`,
        [idMatPel]
      )
      return rows
    } catch (error) {
      logger.error('❌ Error al obtener acciones sobre el material:', error)
      throw error
    }
  }

  /**
   * Elimina todas las relaciones de un material peligroso
   */
  async eliminarPorMaterialPeligroso(idMatPel) {
    const connection = await getConnection()
    try {
      await connection.execute(
        'DELETE FROM matPelAccionMaterial WHERE idMatPel = ?',
        [idMatPel]
      )
      logger.debug('🗑️ Eliminadas relaciones de acciones sobre el material', { idMatPel })
    } catch (error) {
      logger.error('❌ Error al eliminar acciones sobre el material:', error)
      throw error
    }
  }
}
