// internal/repositories/mysql/denunciante.repository.js (o ruta equivalente)
import { getConnection } from '../../platform/database/connection.js'
import { logger } from '../../platform/logger/logger.js'

export class MySQLDenuncianteRepository {
  constructor() {
    this.tableName = 'denunciante'
  }

  /**
   * @param {{ nombre?:string, apellido?:string, telefono?:string, dni?:string|number, idIncidente?: number|null }} denunciante
   * @returns {Promise<number>} insertId
   */
  async crear(denunciante) {
    const query = `
      INSERT INTO ${this.tableName} (nombre, apellido, telefono, dni, idIncidente)
      VALUES (?, ?, ?, ?, ?)
    `

    const params = [
      denunciante.nombre ?? null,
      denunciante.apellido ?? null,
      denunciante.telefono ?? null,
      denunciante.dni ?? null,
      denunciante.idIncidente ?? null
    ]

    const connection = getConnection()

    try {
      const [result] = await connection.execute(query, params)
      const nuevoId = result.insertId
      logger.debug('📌 Denunciante insertado correctamente', { id: nuevoId, idIncidente: denunciante.idIncidente ?? null })
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
