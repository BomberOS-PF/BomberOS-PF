import { getConnection } from '../../platform/database/connection.js'
import { logger } from '../../platform/logger/logger.js'

export class MySQLMaterialPeligrosoRepository {
  /**
   * Guarda un registro de material peligroso
   */
  async guardar(data) {
    const connection = await getConnection()
    try {
      const [result] = await connection.execute(
        `INSERT INTO materialPeligroso (
          idIncidente, idCategoria, cantidadMateriales, otraAccionMaterial,
          otraAccionPersona, detalleOtrasAccionesPersona, cantidadSuperficieEvacuada, detalle
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.idIncidente,
          data.idCategoria,
          data.cantidadMateriales,
          data.otraAccionMaterial,
          data.otraAccionPersona,
          data.detalleOtrasAccionesPersona,
          data.cantidadSuperficieEvacuada,
          data.detalle
        ]
      )
      logger.debug(`🧯 MaterialPeligroso guardado. ID: ${result.insertId}`)
      return result.insertId
    } catch (error) {
      logger.error('❌ Error al guardar material peligroso', error)
      throw error
    }
  }

  /**
   * Obtiene un material peligroso por idIncidente
   */
  async obtenerPorIncidente(idIncidente) {
    const connection = await getConnection()
    try {
      const [rows] = await connection.execute(
        `SELECT * FROM materialPeligroso WHERE idIncidente = ?`,
        [idIncidente]
      )
      return rows.length ? rows[0] : null
    } catch (error) {
      logger.error('❌ Error al obtener material peligroso por incidente', error)
      throw error
    }
  }

  /**
   * Lista todos los materiales peligrosos
   */
  async obtenerTodos() {
    const connection = await getConnection()
    try {
      const [rows] = await connection.execute(`SELECT * FROM materialPeligroso`)
      return rows
    } catch (error) {
      logger.error('❌ Error al listar materiales peligrosos', error)
      throw error
    }
  }
}
