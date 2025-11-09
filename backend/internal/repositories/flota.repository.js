import { getConnection } from '../platform/database/connection.js'

export class MovilRepository {
  async crear({ interno, dominio, marca, modelo, anio }) {
    const conn = await getConnection()
    const [res] = await conn.execute(
      `INSERT INTO movil (interno, dominio, marca, modelo, anio, activo)
       VALUES (?,?,?,?,?,1)`,
      [interno, dominio, marca, modelo, anio]
    )
    return { idMovil: res.insertId, interno, dominio, marca, modelo, anio, activo: 1 }
  }

  async actualizar(idMovil, parcial) {
    const campos = []
    const vals = []
    for (const k of ['interno','dominio','marca','modelo','anio','activo']) {
      if (parcial[k] !== undefined) { campos.push(`${k}=?`); vals.push(parcial[k]) }
    }
    if (!campos.length) return this.obtenerPorId(idMovil)
    vals.push(idMovil)
    const conn = await getConnection()
    await conn.execute(`UPDATE movil SET ${campos.join(', ')} WHERE idMovil=?`, vals)
    return this.obtenerPorId(idMovil)
  }

  async bajaLogica(idMovil) {
    const conn = await getConnection()
    await conn.execute(`UPDATE movil SET activo=0 WHERE idMovil=?`, [idMovil])
    return { ok: true }
  }

  async obtenerPorId(idMovil) {
    const conn = await getConnection()
    const [rows] = await conn.execute(`SELECT * FROM movil WHERE idMovil=?`, [idMovil])
    return rows[0] || null
  }

  async buscar({ texto, activo }) {
    const where = []
    const vals = []
    if (texto) {
      where.push(`(interno LIKE ? OR dominio LIKE ? OR marca LIKE ? OR modelo LIKE ?)`)
      vals.push(`%${texto}%`,`%${texto}%`,`%${texto}%`,`%${texto}%`)
    }
    if (activo !== undefined) { where.push(`activo=?`); vals.push(activo ? 1 : 0) }
    const sql = `SELECT * FROM movil ${where.length ? 'WHERE '+where.join(' AND ') : ''} ORDER BY interno`
    const conn = await getConnection()
    const [rows] = await conn.execute(sql, vals)
    return rows
  }
}
