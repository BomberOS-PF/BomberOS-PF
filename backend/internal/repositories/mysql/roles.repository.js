import { getConnection } from '../../platform/database/connection.js'

export class RolesRepositoryMySQL {
  async guardar(rol) {
    const db = getConnection()
    const [result] = await db.execute(
      'INSERT INTO rol (nombreRol, descripcion) VALUES (?, ?)',
      [rol.nombreRol, rol.descripcion]
    )
    return { idRol: result.insertId, ...rol.toPlainObject() }
  }

  async obtenerTodos() {
    const db = getConnection()
    const [rows] = await db.execute('SELECT * FROM rol')
    return rows
  }

  async obtenerPorId(idRol) {
    const db = getConnection()
    const [rows] = await db.execute('SELECT * FROM rol WHERE idRol = ?', [idRol])
    return rows[0] || null
  }

  async actualizar(idRol, rol) {
    const db = getConnection()
    await db.execute(
      'UPDATE rol SET nombreRol = ?, descripcion = ? WHERE idRol = ?',
      [rol.nombreRol, rol.descripcion, idRol]
    )
    return { idRol, ...rol.toPlainObject() }
  }

  async eliminar(idRol) {
    const db = getConnection()
    const [res] = await db.execute('DELETE FROM rol WHERE idRol = ?', [idRol])
    return res.affectedRows > 0
  }

  async obtenerRolPorNombre(nombreRol) {
    const db = getConnection()
    const [rows] = await db.execute('SELECT * FROM rol WHERE nombreRol = ?', [nombreRol])
    return rows[0] || null
  }
}
