import { getConnection } from '../platform/database/connection.js'
import { logger } from '../platform/logger/logger.js'

export class MySQLIncendioForestalRepository {
  constructor() {
    this.tableName = 'forestal'
  }

  async insertarIncendioForestal({ idIncidente, caracteristicasLugar, areaAfectada, cantidadAfectada, causaProbable, detalle }) {
    const connection = getConnection()
    
    try {
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
        const params = [caracteristicasLugar, areaAfectada, cantidadAfectada, causaProbable, detalle, idIncidente]
        await connection.execute(query, params)
        logger.debug('🔥 Incendio forestal actualizado', { idIncidente })
        return existing[0].idForestal
      } else {
        // Insertar nuevo registro
        const query = `
          INSERT INTO ${this.tableName} (idIncidente, caracteristicasLugar, areaAfectada, cantidad, idCausaProbable, detalle)
          VALUES (?, ?, ?, ?, ?, ?)
        `
        const params = [idIncidente, caracteristicasLugar, areaAfectada, cantidadAfectada, causaProbable, detalle]
        const [result] = await connection.execute(query, params)
        logger.debug('🔥 Incendio forestal insertado', { idForestal: result.insertId })
        return result.insertId
      }
    } catch (error) {
      logger.error('❌ Error al insertar/actualizar incendio forestal', { error: error.message })
      throw new Error('Error al insertar/actualizar incendio forestal')
    }
  }
} 