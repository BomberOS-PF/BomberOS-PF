import { getConnection } from '../../platform/database/connection.js'
import { logger } from '../../platform/logger/logger.js'

export class MySQLDamnificadoRepository {
  constructor() {
    this.tableName = 'damnificado'
  }

  async insertarDamnificado(damnificado) {
    const query = `
      INSERT INTO ${this.tableName} 
        (nombre, apellido, edad, tipoDamnificado, dni, domicilio, telefono, fallecio, idIncidente)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    const params = [
      damnificado.nombre || null,
      damnificado.apellido || null,
      damnificado.edad || null,
      damnificado.tipoDamnificado || null,
      damnificado.dni || null,
      damnificado.domicilio || null,
      damnificado.telefono || null,
      damnificado.fallecio === true ? 1 : 0,
      damnificado.idIncidente
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
