import { getConnection } from '../../platform/database/connection.js'
import { Rol } from '../../../domain/models/rol.js'
import { logger } from '../../platform/logger/logger.js'

export class MySQLRolRepository {
  constructor() {
    this.table = 'rol'
  }

  async guardar(rol) {
    const query = `INSERT INTO ${this.table} (nombreRol, descripcion) VALUES (?, ?)`
    const values = [rol.nombreRol, rol.descripcion]

    try {
      const conn = getConnection()
      const [result] = await conn.execute(query, values)
      logger.info('Rol insertado correctamente', { id: result.insertId })
      return { id: result.insertId, ...rol }
    } catch (err) {
      logger.error('Error al insertar rol', { error: err.message })
      throw err
    }
  }

  async obtenerTodos() {
    const query = `SELECT * FROM ${this.table}`
    const conn = getConnection()
    const [rows] = await conn.execute(query)
    return rows.map(Rol.fromDatabase)
  }

  async obtenerPorId(id) {
    const query = `SELECT * FROM ${this.table} WHERE id = ?`
    const conn = getConnection()
    const [rows] = await conn.execute(query, [id])
    return rows[0] ? Rol.fromDatabase(rows[0]) : null
  }

  async obtenerPorNombre(nombreRol) {
    const query = `SELECT * FROM ${this.table} WHERE nombreRol = ?`
    const conn = getConnection()
    const [rows] = await conn.execute(query, [nombreRol])
    return rows[0] ? Rol.fromDatabase(rows[0]) : null
  }

  async actualizarPorId(id, datos) {
    const query = `UPDATE ${this.table} SET nombreRol = ?, descripcion = ? WHERE id = ?`
    const values = [datos.nombreRol, datos.descripcion, id]
    const conn = getConnection()
    await conn.execute(query, values)
    return { id, ...datos }
  }

  async eliminarPorId(id) {
    const query = `DELETE FROM ${this.table} WHERE id = ?`
    const conn = getConnection()
    await conn.execute(query, [id])
    return { id }
  }
}
