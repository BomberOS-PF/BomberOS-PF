import { getConnection } from '../../platform/database/connection.js'
import { logger } from '../../platform/logger/logger.js'

export class MySQLMaterialPeligrosoRepository {
  constructor() {
    this.damnificadoTable = 'damnificado'
  }

  /**
   * Guarda un registro de material peligroso
   */
  async guardar(data) {
    const connection = await getConnection()
    try {
      const [result] = await connection.execute(
        `INSERT INTO materialPeligroso (
        idIncidente, categoria, cantidadMatInvolucrado, otraAccionMaterial,
        otraAccionPersona, detalleOtrasAccionesPersona, cantidadSuperficieEvacuada, detalle
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.idIncidente,
          data.categoria ?? null,
          data.cantidadMateriales ?? 0,
          data.otraAccionMaterial ?? null,
          data.otraAccionPersona ?? null,
          data.detalleOtrasAccionesPersona ?? null,
          data.cantidadSuperficieEvacuada ?? null,
          data.detalle ?? null
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
