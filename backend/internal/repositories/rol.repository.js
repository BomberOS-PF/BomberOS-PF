import { getConnection } from '../platform/database/connection.js'
import { Rol } from '../../domain/models/rol.js'
import { logger } from '../platform/logger/logger.js'

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
      logger.info('Rol insertado correctamente', { idRol: result.insertId })
      return new Rol({ idRol: result.insertId, nombreRol: rol.nombreRol, descripcion: rol.descripcion })
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
    const query = `SELECT * FROM ${this.table} WHERE idRol = ?`
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
    const query = `UPDATE ${this.table} SET nombreRol = ?, descripcion = ? WHERE idRol = ?`
    const values = [datos.nombreRol, datos.descripcion, id]
    const conn = getConnection()
    await conn.execute(query, values)
    return new Rol({ idRol: id, nombreRol: datos.nombreRol, descripcion: datos.descripcion })
  }

  async eliminarPorId(id) {
    const query = `DELETE FROM ${this.table} WHERE idRol = ?`
    const conn = getConnection()
    await conn.execute(query, [id])
    return { idRol: id }
  }

  async buscarConPaginado({ pagina, limite, busqueda }) {
    const offset = (pagina - 1) * limite
    const params = []
    let whereSql = ''

    if (busqueda) {
      whereSql = 'WHERE nombreRol LIKE ?'
      params.push(`%${busqueda}%`)
    }

    const sqlDatos = `
      SELECT idRol, nombreRol, descripcion
      FROM roles
      ${whereSql}
      ORDER BY nombreRol ASC
      LIMIT ? OFFSET ?
    `

    const sqlTotal = `
      SELECT COUNT(*) AS total
      FROM roles
      ${whereSql}
    `

    try {
      const [rows] = await this.connection.execute(sqlDatos, [...params, limite, offset])
      const [rowsTotal] = await this.connection.execute(sqlTotal, params)

      const total = rowsTotal[0]?.total || 0

      return {
        data: rows,
        total
      }
    } catch (error) {
      this.logger.error('Error en buscarConPaginado de roles', { error })
      throw error
    }
  }

}
