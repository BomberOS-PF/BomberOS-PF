import { getConnection } from '../../platform/database/connection.js'
import { logger } from '../../platform/logger/logger.js'

export class MySQLDamnificadoRepository {
  constructor() {
    this.tableName = 'damnificado'
  }

  async insertarDamnificado(damnificado) {
    const query = `
      INSERT INTO ${this.tableName} 
        (nombre, apellido, idIncidente, dni, domicilio, telefono, fallecio)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `

    const params = [
      damnificado.nombre ?? null,
      damnificado.apellido ?? null,
      damnificado.idIncidente,
      damnificado.dni ?? null,
      damnificado.domicilio ?? null,
      damnificado.telefono ?? null,
      damnificado.fallecio === true ? 1 : 0
    ]

    const connection = getConnection()
    try {
      const [result] = await connection.execute(query, params)
      logger.debug('🧍 Damnificado insertado', { idDamnificado: result.insertId })
      return result.insertId
    } catch (error) {
      logger.error('❌ Error al insertar damnificado', { error: error.message })
      throw new Error('Error al insertar damnificado')
    }
  }
}
