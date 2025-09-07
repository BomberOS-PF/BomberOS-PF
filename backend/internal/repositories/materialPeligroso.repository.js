import { getConnection } from '../platform/database/connection.js'
import { logger } from '../platform/logger/logger.js'

export class MySQLMaterialPeligrosoRepository {
  constructor() {
    this.tableName = 'materialPeligroso'
    this.damnificadoTable = 'damnificado'
  }

  /**
   * Guarda un registro de material peligroso
   */
  async guardar(data) {
    const connection = await getConnection()
    try {
      const [result] = await connection.execute(
        `INSERT INTO ${this.tableName} (
        idIncidente, categoria, cantidadMatInvolucrado, otraAccionMaterial,
        otraAccionPersona, detalleOtrasAccionesPersona, cantidadSuperficieEvacuada, detalle
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.idIncidente,
          data.categoria ?? null,
          data.cantidadMatInvolucrado ?? 0,
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
        `SELECT * FROM ${this.tableName} WHERE idIncidente = ?`,
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
      const [rows] = await connection.execute(`SELECT * FROM ${this.tableName}`)
      return rows
    } catch (error) {
      logger.error('❌ Error al listar materiales peligrosos', error)
      throw error
    }
  }

  /**
   * Actualizar material peligroso existente
   */
  async actualizar(idMatPel, data) {
    const connection = await getConnection()
    try {
      const [result] = await connection.execute(
        `UPDATE ${this.tableName} SET 
        categoria = ?, cantidadMatInvolucrado = ?, otraAccionMaterial = ?,
        otraAccionPersona = ?, detalleOtrasAccionesPersona = ?, cantidadSuperficieEvacuada = ?, detalle = ?
        WHERE idMatPel = ?`,
        [
          data.categoria ?? null,
          data.cantidadMatInvolucrado ?? 0,
          data.otraAccionMaterial ?? null,
          data.otraAccionPersona ?? null,
          data.detalleOtrasAccionesPersona ?? null,
          data.cantidadSuperficieEvacuada ?? null,
          data.detalle ?? null,
          idMatPel
        ]
      )
      logger.debug('🔄 Material peligroso actualizado', { idMatPel, affectedRows: result.affectedRows })
      return result.affectedRows > 0
    } catch (error) {
      logger.error('❌ Error al actualizar material peligroso', { error: error.message })
      throw error
    }
  }

  /**
   * Obtiene material peligroso completo con damnificados
   */
  async obtenerMaterialCompleto(idIncidente) {
    const connection = getConnection()

    // 1. Buscar material peligroso por idIncidente
    const [materialRows] = await connection.execute(`
      SELECT * FROM ${this.tableName}
      WHERE idIncidente = ?
    `, [idIncidente])

    if (materialRows.length === 0) return null

    const material = materialRows[0]

    // 2. Obtener damnificados del incidente
    const [damnificados] = await connection.execute(`
      SELECT * FROM damnificado
      WHERE idIncidente = ?
    `, [idIncidente])

    return {
      ...material,
      damnificados: damnificados || []
    }
  }
}
