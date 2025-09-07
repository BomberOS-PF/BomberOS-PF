import { getConnection } from '../platform/database/connection.js'
import { logger } from '../platform/logger/logger.js'

export class MySQLAccidenteDamnificadoRepository {
  constructor() {
    this.tableName = 'accidenteDamnificado'
  }

  async insertarRelacion(idAccidenteTransito, idDamnificado) {
    const query = `
      INSERT INTO ${this.tableName} (idAccidenteTransito, idDamnificado)
      VALUES (?, ?)
    `
    const connection = getConnection()

    try {
      await connection.execute(query, [idAccidenteTransito, idDamnificado])
      logger.debug('🔗 Damnificado asociado a accidente', { idAccidenteTransito, idDamnificado })
    } catch (error) {
      logger.error('❌ Error al asociar damnificado al accidente', { error: error.message })
      throw new Error('Error al asociar damnificado al accidente')
    }
  }

  async eliminarRelacionesPorAccidente(idAccidenteTransito) {
    const query = `
      DELETE FROM ${this.tableName}
      WHERE idAccidenteTransito = ?
    `
    const connection = getConnection()
    try {
      const [result] = await connection.execute(query, [idAccidenteTransito])
      logger.debug('🗑️ Relaciones accidente-damnificado eliminadas', { idAccidenteTransito, affectedRows: result.affectedRows })
      return result.affectedRows
    } catch (error) {
      logger.error('❌ Error al eliminar relaciones accidente-damnificado', { error: error.message })
      throw new Error('Error al eliminar relaciones accidente-damnificado')
    }
  }
}