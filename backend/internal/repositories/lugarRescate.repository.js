import { getConnection } from '../platform/database/connection.js'

export class MySQLLugarRescateRepository {
  constructor() {
    this.tableName = 'lugarRescate'
  }

  async getAll() {
    const connection = getConnection()
    const query = `SELECT idLugarRescate as value, descripcion as label FROM ${this.tableName} ORDER BY idLugarRescate`
    const [rows] = await connection.execute(query)
    return rows
  }
}


