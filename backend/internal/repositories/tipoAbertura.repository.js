import { getConnection } from '../platform/database/connection.js'

export class MySQLTipoAberturaRepository {
  constructor() {
    this.tableName = 'tipoAbertura'
  }

  async getAll() {
    const connection = getConnection()
    const query = `SELECT idTipoAbertura as value, descripcion as label FROM ${this.tableName} ORDER BY idTipoAbertura`
    const [rows] = await connection.execute(query)
    return rows
  }
}
