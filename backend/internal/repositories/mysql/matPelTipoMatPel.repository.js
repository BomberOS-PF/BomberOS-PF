import { getConnection } from '../../platform/database/connection.js'
import { logger } from '../../platform/logger/logger.js'

export class MySQLMatPelTipoMatPelRepository {
  /**
   * Inserta las relaciones entre MaterialPeligroso y Tipos de Materiales
   * @param {number} idMaterialPeligroso 
   * @param {number[]} tiposIds 
   */
  async asociarTipos(idMaterialPeligroso, tiposIds = []) {
    if (!tiposIds.length) return

    const connection = await getConnection()
    const values = tiposIds.map(idTipo => [idMaterialPeligroso, idTipo])

    try {
      await connection.query(
        'INSERT INTO matPelTipoMatPel (idMaterialPeligroso, idTipoMaterial) VALUES ?',
        [values]
      )
      logger.debug('✅ Asociados tipos de material:', {
        idMaterialPeligroso,
        tiposIds
      })
    } catch (error) {
      logger.error('❌ Error al asociar tipos de material peligroso:', error)
      throw error
    }
  }

  /**
   * Obtiene todos los tipos asociados a un material peligroso
   */
  async obtenerPorMaterialPeligroso(idMaterialPeligroso) {
    const connection = await getConnection()
    try {
      const [rows] = await connection.execute(
        `SELECT t.idTipoMaterial, t.nombre 
         FROM tipoMatInvolucrado t
         INNER JOIN matPelTipoMatPel mtt ON mtt.idTipoMaterial = t.idTipoMaterial
         WHERE mtt.idMaterialPeligroso = ?`,
        [idMaterialPeligroso]
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
  async eliminarPorMaterialPeligroso(idMaterialPeligroso) {
    const connection = await getConnection()
    try {
      await connection.execute(
        'DELETE FROM matPelTipoMatPel WHERE idMaterialPeligroso = ?',
        [idMaterialPeligroso]
      )
      logger.debug('🗑️ Eliminadas relaciones de tipos de material', { idMaterialPeligroso })
    } catch (error) {
      logger.error('❌ Error al eliminar tipos asociados al material peligroso:', error)
      throw error
    }
  }
}
