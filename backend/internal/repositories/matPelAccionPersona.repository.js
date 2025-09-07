import { getConnection } from '../platform/database/connection.js'
import { logger } from '../platform/logger/logger.js'

export class MySQLMatPelAccionPersonaRepository {
  /**
   * Inserta las relaciones entre MaterialPeligroso y Acciones sobre Personas
   */
  async asociarAcciones(idMatPel, accionesIds = []) {
    if (!accionesIds.length) return

    const connection = await getConnection()
    const placeholders = accionesIds.map(() => '(?, ?)').join(', ')
    const flatValues = accionesIds.flatMap(idAccion => [idMatPel, idAccion])

    try {
      await connection.execute(
        `INSERT INTO matPelAccionPersona (idMatPel, idAccionPersona) VALUES ${placeholders}`,
        flatValues
      )
      logger.debug('✅ Asociadas acciones sobre personas:', { idMatPel, accionesIds })
    } catch (error) {
      logger.error('❌ Error al asociar acciones sobre personas:', error)
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
        `SELECT a.idAccionPersona, a.nombre
         FROM accionPersona a
         INNER JOIN matPelAccionPersona mpap 
           ON mpap.idAccionPersona = a.idAccionPersona
         WHERE mpap.idMatPel = ?`,
        [idMatPel]
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
  async eliminarPorMaterialPeligroso(idMatPel) {
    const connection = await getConnection()
    try {
      await connection.execute(
        'DELETE FROM matPelAccionPersona WHERE idMatPel = ?',
        [idMatPel]
      )
      logger.debug('🗑️ Eliminadas relaciones de acciones sobre personas', { idMatPel })
    } catch (error) {
      logger.error('❌ Error al eliminar acciones sobre personas:', error)
      throw error
    }
  }
}
