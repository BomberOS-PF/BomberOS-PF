import { getConnection } from '../../platform/database/connection.js'
import { logger } from '../../platform/logger/logger.js'

export class MySQLDenuncianteRepository {
  constructor() {
    this.tableName = 'denunciante'
  }

  async crear(denunciante) {
    const query = `
      INSERT INTO ${this.tableName} (nombre, apellido, telefono, dni)
      VALUES (?, ?, ?, ?)
    `

    const params = [
      denunciante.nombre ?? null,
      denunciante.apellido ?? null,
      denunciante.telefono ?? null,
      denunciante.dni ?? null
    ]

    const connection = getConnection()

    try {
      const [result] = await connection.execute(query, params)
      const nuevoId = result.insertId
      logger.debug('📌 Denunciante insertado correctamente', { id: nuevoId })
      return nuevoId
    } catch (error) {
      logger.error('❌ Error al insertar denunciante', {
        error: error.message,
        code: error.code
      })
      throw new Error(`Error al insertar denunciante: ${error.message}`)
    }
  }
}
