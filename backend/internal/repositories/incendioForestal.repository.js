import { getConnection } from '../platform/database/connection.js'
import { logger } from '../platform/logger/logger.js'

export class MySQLIncendioForestalRepository {
  constructor() {
    this.tableName = 'forestal'
  }

  async insertarIncendioForestal({ idIncidente, caracteristicasLugar, areaAfectada, cantidadAfectada, causaProbable, detalle }) {
    const connection = getConnection()
    
    try {
      // DEBUG: Log parámetros de entrada
      
      // Verificar si ya existe un registro para este incidente
      const [existing] = await connection.execute(
        `SELECT idForestal FROM ${this.tableName} WHERE idIncidente = ?`,
        [idIncidente]
      )

      if (existing.length > 0) {
        // Actualizar registro existente
        const query = `
          UPDATE ${this.tableName} 
          SET caracteristicasLugar = ?, areaAfectada = ?, cantidad = ?, idCausaProbable = ?, detalle = ?
          WHERE idIncidente = ?
        `
        const params = [caracteristicasLugar ?? null, areaAfectada ?? null, cantidadAfectada ?? null, causaProbable ?? null, detalle ?? null, idIncidente]
        await connection.execute(query, params)
        logger.debug('🔥 Incendio forestal actualizado', { idIncidente })
        return existing[0].idForestal
      } else {
        // Insertar nuevo registro
        const query = `
          INSERT INTO ${this.tableName} (idIncidente, caracteristicasLugar, areaAfectada, cantidad, idCausaProbable, detalle)
          VALUES (?, ?, ?, ?, ?, ?)
        `
        const params = [idIncidente, caracteristicasLugar ?? null, areaAfectada ?? null, cantidadAfectada ?? null, causaProbable ?? null, detalle ?? null]
        const [result] = await connection.execute(query, params)
        logger.debug('🔥 Incendio forestal insertado', { idForestal: result.insertId })
        return result.insertId
      }
    } catch (error) {
      logger.error('❌ Error al insertar/actualizar incendio forestal', { error: error.message })
      throw new Error('Error al insertar/actualizar incendio forestal')
    }
  }

  async obtenerPorIdIncidente(idIncidente) {
    const connection = getConnection()
    try {
      const [rows] = await connection.execute(
        `SELECT * FROM ${this.tableName} WHERE idIncidente = ? LIMIT 1`,
        [idIncidente]
      )
      return rows[0] || null
    } catch (error) {
      logger.error('❌ Error al obtener incendio forestal por idIncidente', { error: error.message })
      throw error
    }
  }

  async obtenerIncendioCompleto(idIncidente) {
    const connection = getConnection()

    // 1. Buscar incendio forestal por idIncidente
    const [forestalRows] = await connection.execute(`
      SELECT * FROM ${this.tableName}
      WHERE idIncidente = ?
    `, [idIncidente])

    if (forestalRows.length === 0) return null

    const forestal = forestalRows[0]

    // 2. Damnificados (relación directa por idIncidente)
    const [damnificados] = await connection.execute(`
      SELECT *
      FROM damnificado
      WHERE idIncidente = ?
    `, [idIncidente])

    return {
      ...forestal,
      damnificados: damnificados || []
    }
  }

  async actualizarIncendioForestal(idForestal, { caracteristicasLugar, areaAfectada, cantidadAfectada, causaProbable, detalle }) {
    const connection = getConnection()
    try {
      // DEBUG: Log detallado de parámetros
      logger.debug('🔍 DEBUG actualizarIncendioForestal - Parámetros recibidos:', {
        idForestal,
        caracteristicasLugar,
        areaAfectada,
        cantidadAfectada,
        causaProbable,
        detalle
      })
      
      const params = [
        caracteristicasLugar ?? null, 
        areaAfectada ?? null, 
        cantidadAfectada ?? null, 
        causaProbable ?? null, 
        detalle ?? null, 
        idForestal
      ]
      
      
      const query = `
        UPDATE ${this.tableName} 
        SET caracteristicasLugar = ?, areaAfectada = ?, cantidad = ?, idCausaProbable = ?, detalle = ?
        WHERE idForestal = ?
      `
      const [result] = await connection.execute(query, params)
      logger.debug('🔄 Incendio forestal actualizado', { idForestal, affectedRows: result.affectedRows })
      return result.affectedRows > 0
    } catch (error) {
      logger.error('❌ Error al actualizar incendio forestal', { error: error.message })
      throw error
    }
  }
} 