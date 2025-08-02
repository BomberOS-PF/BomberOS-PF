import { getConnection } from '../../platform/database/connection.js'
import { logger } from '../../platform/logger/logger.js'

export class MySQLMatPelTipoMatPelRepository {
  /**
   * Inserta las relaciones entre MaterialPeligroso y Tipos de Materiales
   * @param {number} idMatPel 
   * @param {number[]} tiposIds 
   */
  async asociarTipos(idMatPel, tiposIds = []) {
    if (!tiposIds.length) return

    const connection = await getConnection()
    const placeholders = tiposIds.map(() => '(?, ?)').join(', ')
    const flatValues = tiposIds.flatMap(idTipo => [idMatPel, idTipo])

    try {
      await connection.execute(
        `INSERT INTO matPelTipoMatPel (idMatPel, idTipoMatInvolucrado) VALUES ${placeholders}`,
        flatValues
      )
      logger.debug('✅ Asociados tipos de material:', { idMatPel, tiposIds })
    } catch (error) {
      logger.error('❌ Error al asociar tipos de material peligroso:', error)
      throw error
    }
  }


  /**
   * Obtiene todos los tipos asociados a un material peligroso
   */
  async obtenerPorMaterialPeligroso(idMatPel) {
    const connection = await getConnection()
    try {
      const [rows] = await connection.execute(
        `SELECT t.idTipoMatInvolucrado, t.nombre 
         FROM tipoMatInvolucrado t
         INNER JOIN matPelTipoMatPel mtt 
           ON mtt.idTipoMatInvolucrado = t.idTipoMatInvolucrado
         WHERE mtt.idMatPel = ?`,
        [idMatPel]
      )
      return rows
    } catch (error) {
      logger.error('❌ Error al obtener tipos asociados al material peligroso:', error)
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
        'DELETE FROM matPelTipoMatPel WHERE idMatPel = ?',
        [idMatPel]
      )
      logger.debug('🗑️ Eliminadas relaciones de tipos de material', { idMatPel })
    } catch (error) {
      logger.error('❌ Error al eliminar tipos asociados al material peligroso:', error)
      throw error
    }
  }
}
