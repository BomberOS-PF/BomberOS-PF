import { getConnection } from '../platform/database/connection.js'

function isTxCapable(conn) {
  return conn
    && typeof conn.beginTransaction === 'function'
    && typeof conn.commit === 'function'
    && typeof conn.rollback === 'function'
}

export class MySQLGuardiaAsignacionRepository {
  async hasOverlap({ dni, fecha, desde, hasta }) {
    const conn = await getConnection()
    const [rows] = await conn.execute(
      `SELECT 1 FROM guardiaAsignacion
       WHERE dni = ? AND fecha = ?
         AND NOT (? >= hora_hasta OR ? <= hora_desde)
       LIMIT 1`,
      [dni, fecha, desde, hasta]
    )
    return rows.length > 0
  }

  async createMany({ idGrupo, asignaciones }) {
    if (!asignaciones?.length) return 0
    const conn = await getConnection()
    const tx = isTxCapable(conn)
    try {
      if (tx) await conn.beginTransaction()

      const values = asignaciones.map(a => [idGrupo, a.fecha, a.dni, a.desde, a.hasta])
      await conn.query(
        `INSERT INTO guardiaAsignacion (idGrupo, fecha, dni, hora_desde, hora_hasta)
         VALUES ${values.map(() => '(?, ?, ?, ?, ?)').join(',')}`,
        values.flat()
      )

      if (tx) await conn.commit()
      return asignaciones.length
    } catch (e) {
      if (tx) { try { await conn.rollback() } catch {} }
      throw e
    } finally {
      if (conn && typeof conn.release === 'function') {
        await conn.release()
      }
    }
  }

  async findByGrupoAndRange({ idGrupo, start, end }) {
    const conn = await getConnection()
    const [rows] = await conn.execute(
      `SELECT idAsignacion, idGrupo, fecha, dni, hora_desde, hora_hasta
       FROM guardiaAsignacion
       WHERE idGrupo = ? AND fecha >= ? AND fecha < ?
       ORDER BY fecha, hora_desde`,
      [idGrupo, start, end]
    )
    return rows
  }

  async deleteByIds(ids) {
    if (!ids?.length) return 0
    const conn = await getConnection()
    const [res] = await conn.query(
      `DELETE FROM guardiaAsignacion WHERE idAsignacion IN (${ids.map(() => '?').join(',')})`,
      ids
    )
    return res.affectedRows
  }

  async replaceDay({ idGrupo, fecha, asignaciones }) {
    const conn = await getConnection()
    const tx = isTxCapable(conn)
    try {
      if (tx) await conn.beginTransaction()

      await conn.execute(
        'DELETE FROM guardiaAsignacion WHERE idGrupo = ? AND fecha = ?',
        [idGrupo, fecha]
      )

      if (asignaciones?.length) {
        const values = asignaciones.map(a => [idGrupo, fecha, a.dni, a.desde, a.hasta])
        await conn.query(
          `INSERT INTO guardiaAsignacion (idGrupo, fecha, dni, hora_desde, hora_hasta)
           VALUES ${values.map(() => '(?, ?, ?, ?, ?)').join(',')}`,
          values.flat()
        )
      }

      if (tx) await conn.commit()
      return true
    } catch (e) {
      if (tx) { try { await conn.rollback() } catch {} }
      throw e
    } finally {
      if (conn && typeof conn.release === 'function') {
        await conn.release()
      }
    }
  }

  async findByDniAndRange({ dni, start, end, idGrupo = null }) {
  const conn = await getConnection()
  if (idGrupo != null) {
    const [rows] = await conn.execute(
      `SELECT idAsignacion, idGrupo, fecha, dni, hora_desde, hora_hasta
       FROM guardiaAsignacion
       WHERE dni = ? AND idGrupo = ? AND fecha >= ? AND fecha < ?
       ORDER BY fecha, hora_desde`,
      [dni, idGrupo, start, end]
    )
    return rows
  } else {
    const [rows] = await conn.execute(
      `SELECT idAsignacion, idGrupo, fecha, dni, hora_desde, hora_hasta
       FROM guardiaAsignacion
       WHERE dni = ? AND fecha >= ? AND fecha < ?
       ORDER BY fecha, hora_desde`,
      [dni, start, end]
    )
    return rows
  }
}

}
