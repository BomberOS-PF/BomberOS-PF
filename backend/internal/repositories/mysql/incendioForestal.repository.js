import { getConnection } from '../../platform/database/connection.js'
import { logger } from '../../platform/logger/logger.js'

export class MySQLIncendioForestalRepository {
  constructor() {
    this.tableName = 'forestal'
  }

  async insertarIncendioForestal({ idIncidente, caracteristicasLugar, areaAfectada, cantidadAfectada, causaProbable, detalle }) {
    const query = `
      INSERT INTO ${this.tableName} (idIncidente, caracteristicasLugar, areaAfectada, cantidad, idCausaProbable, detalle)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    const params = [idIncidente, caracteristicasLugar, areaAfectada, cantidadAfectada, causaProbable, detalle]
    const connection = getConnection()
    try {
      const [result] = await connection.execute(query, params)
      logger.debug('🔥 Incendio forestal insertado', { idForestal: result.insertId })
      return result.insertId
    } catch (error) {
      logger.error('❌ Error al insertar incendio forestal', { error: error.message })
      throw new Error('Error al insertar incendio forestal')
    }
  }
} 