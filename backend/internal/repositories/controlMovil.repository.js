import { getConnection } from '../platform/database/connection.js'

export class ControlMovilRepository {
  async crearControl({ idMovil, fecha, realizadoPorDNI, observaciones }) {
    const conn = await getConnection()
    const [res] = await conn.execute(
      `INSERT INTO control_movil (idMovil, fecha, realizadoPorDNI, observaciones, finalizado)
     VALUES (?,?,?,?,0)`,
      [Number(idMovil), fecha, Number(realizadoPorDNI), observaciones ?? null]
    )
    return {
      idControl: res.insertId,
      idMovil: Number(idMovil),
      fecha,
      realizadoPorDNI: Number(realizadoPorDNI),
      observaciones: observaciones ?? null,
      finalizado: 0
    }
  }


  async obtenerControlCompleto(idControl) {
    const conn = await getConnection()
    const [[h]] = await conn.query(
      `SELECT c.*, m.interno, m.dominio, m.marca, m.modelo, m.anio
       FROM control_movil c
       JOIN movil m ON m.idMovil=c.idMovil
       WHERE c.idControl=?`, [idControl]
    )
    if (!h) return null

    const [det] = await conn.query(
      `SELECT r.idRespuesta, r.idItem, r.valorTexto, r.valorNumero, d.clave, d.grupo, d.etiqueta
       FROM control_movil_item_resp r
       JOIN control_movil_item_def d ON d.idItem=r.idItem
       WHERE r.idControl=?`, [idControl]
    )

    return {
      header: {
        idControl: h.idControl,
        idMovil: h.idMovil,
        fecha: h.fecha,
        realizadoPorDNI: h.realizadoPorDNI,
        observaciones: h.observaciones,
        finalizado: h.finalizado,
        creadoEn: h.creadoEn,
        vehiculo: {
          idMovil: h.idMovil,
          interno: h.interno,
          dominio: h.dominio,
          marca: h.marca,
          modelo: h.modelo,
          anio: h.anio
        }
      },
      respuestas: det
    }
  }

  async actualizarHeader(idControl, parcial) {
    const sets = []
    const vals = []
    for (const k of ['observaciones', 'finalizado', 'fecha', 'realizadoPorDNI']) {
      if (parcial[k] !== undefined) { sets.push(`${k}=?`); vals.push(parcial[k]) }
    }
    if (!sets.length) return this.obtenerControlCompleto(idControl)
    vals.push(idControl)
    const conn = await getConnection()
    await conn.execute(`UPDATE control_movil SET ${sets.join(', ')} WHERE idControl=?`, vals)
    return this.obtenerControlCompleto(idControl)
  }

  async listarItemDefs() {
    const conn = await getConnection()
    const [rows] = await conn.query(`SELECT * FROM control_movil_item_def ORDER BY grupo, idItem`)
    return rows
  }

  async mapClaveToId() {
    const conn = await getConnection()
    const [rows] = await conn.query(`SELECT idItem, clave FROM control_movil_item_def`)
    const map = new Map()
    rows.forEach(r => map.set(r.clave, r.idItem))
    return map
  }

  async upsertRespuestas(idControl, respuestas) {
    if (!respuestas?.length) return { ok: true }
    const conn = await getConnection()
    const map = await this.mapClaveToId()
    const values = []
    for (const r of respuestas) {
      const idItem = r.idItem || map.get(r.clave)
      if (!idItem) continue
      values.push([idControl, idItem, r.valorTexto ?? null, r.valorNumero ?? null])
    }
    if (!values.length) return { ok: true }
    await conn.query(
      `INSERT INTO control_movil_item_resp (idControl, idItem, valorTexto, valorNumero)
       VALUES ?
       ON DUPLICATE KEY UPDATE valorTexto=VALUES(valorTexto), valorNumero=VALUES(valorNumero)`,
      [values]
    )
    return { ok: true }
  }

  async listarControles({ idMovil, desde, hasta }) {
    const where = []
    const vals = []
    if (idMovil) { where.push('c.idMovil=?'); vals.push(idMovil) }
    if (desde) { where.push('c.fecha>=?'); vals.push(desde) }
    if (hasta) { where.push('c.fecha<=?'); vals.push(hasta) }
    const sql = `
      SELECT c.*, m.interno
      FROM control_movil c
      JOIN movil m ON m.idMovil=c.idMovil
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY c.fecha DESC, c.idControl DESC`
    const conn = await getConnection()
    const [rows] = await conn.query(sql, vals)
    return rows
  }
}
