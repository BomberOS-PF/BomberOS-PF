import { getConnection } from '../../platform/database/connection.js'
import { logger } from '../../platform/logger/logger.js'

export class MySQLMatPelAccionPersonaRepository {
  /**
   * Inserta las relaciones entre MaterialPeligroso y Acciones sobre Personas
   */
  async asociarAcciones(idMaterialPeligroso, accionesIds = []) {
    if (!accionesIds.length) return

    const connection = await getConnection()
    const values = accionesIds.map(idAccion => [idMaterialPeligroso, idAccion])

    try {
      await connection.query(
        'INSERT INTO matPelAccionPersona (idMaterialPeligroso, idAccionPersona) VALUES ?',
        [values]
      )
      logger.debug('✅ Asociadas acciones sobre personas:', {
        idMaterialPeligroso,
        accionesIds
      })
    } catch (error) {
      logger.error('❌ Error al asociar acciones sobre personas:', error)
      throw error
    }
  }

  /**
   * Obtiene las acciones asociadas a un material peligroso
   */
  async obtenerPorMaterialPeligroso(idMaterialPeligroso) {
    const connection = await getConnection()
    try {
      const [rows] = await connection.execute(
        `SELECT a.idAccionPersona, a.nombre
         FROM accionPersona a
         INNER JOIN matPelAccionPersona mpap ON mpap.idAccionPersona = a.idAccionPersona
         WHERE mpap.idMaterialPeligroso = ?`,
        [idMaterialPeligroso]
      )
      return rows
    } catch (error) {
      logger.error('❌ Error al obtener acciones sobre personas:', error)
      throw error
    }
  }

  /**
   * Elimina todas las relaciones de un material peligroso
   */
  async eliminarPorMaterialPeligroso(idMaterialPeligroso) {
    const connection = await getConnection()
    try {
      await connection.execute(
        'DELETE FROM matPelAccionPersona WHERE idMaterialPeligroso = ?',
        [idMaterialPeligroso]
      )
      logger.debug('🗑️ Eliminadas relaciones de acciones sobre personas', { idMaterialPeligroso })
    } catch (error) {
      logger.error('❌ Error al eliminar acciones sobre personas:', error)
      throw error
    }
  }
}
