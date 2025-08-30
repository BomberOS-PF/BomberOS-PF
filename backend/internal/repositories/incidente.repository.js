import { getConnection } from '../platform/database/connection.js'
import { logger } from '../platform/logger/logger.js'
import { Incidente } from '../../domain/models/incidente.js'
const toInt = (v, def) => {
  const n = parseInt(v, 10)
  return Number.isFinite(n) && n >= 0 ? n : def
}

export class MySQLIncidenteRepository {
  constructor() {
    this.tableName = 'incidente'
  }


  // ==========================
  // Listado básico (compat)
  // ==========================
  async findAll() {
    const query = `
      SELECT 
        i.*,
        l.direccion AS localizacion,
        d.nombre AS denuncianteNombre,
        d.apellido AS denuncianteApellido,
        d.dni AS denuncianteDni,
        d.telefono AS denuncianteTelefono,
        ti.nombre AS tipo
      FROM ${this.tableName} i
      LEFT JOIN localizacion l ON l.idLocalizacion = i.idLocalizacion
      LEFT JOIN denunciante d ON d.idDenunciante = i.idDenunciante
      LEFT JOIN tipoIncidente ti ON ti.idTipoIncidente = i.idTipoIncidente
      ORDER BY i.fecha DESC
    `
    const connection = await getConnection()

    try {
      const [rows] = await connection.execute(query)
      logger.debug('Incidentes obtenidos', { count: rows.length })
      return rows.map(row => new Incidente(row))
    } catch (error) {
      logger.error('Error al obtener incidentes', { error: error.message })
      throw new Error(`Error al obtener incidentes: ${error.message}`)
    }
  }

  async findById(id) {
    const query = `
      SELECT 
        i.*,
        l.direccion AS localizacion,
        d.nombre AS denuncianteNombre,
        d.apellido AS denuncianteApellido,
        d.dni AS denuncianteDni,
        d.telefono AS denuncianteTelefono,
        ti.nombre AS tipo
      FROM ${this.tableName} i
      LEFT JOIN localizacion l ON l.idLocalizacion = i.idLocalizacion
      LEFT JOIN denunciante d ON d.idDenunciante = i.idDenunciante
      LEFT JOIN tipoIncidente ti ON ti.idTipoIncidente = i.idTipoIncidente
      WHERE i.idIncidente = ?
    `
    const connection = await getConnection()

    try {
      const [rows] = await connection.execute(query, [id])
      return rows.length > 0 ? new Incidente(rows[0]) : null
    } catch (error) {
      logger.error('Error al obtener incidente por ID', { id, error: error.message })
      throw new Error(`Error al obtener incidente: ${error.message}`)
    }
  }

  async obtenerPorId(id) {
    return this.findById(id)
  }

  async obtenerTodos() {
    return this.findAll()
  }

  // ==========================
  // Crear / Actualizar / Eliminar
  // ==========================
  async create(incidente) {
    const query = `
      INSERT INTO ${this.tableName} 
        (idTipoIncidente, fecha, idLocalizacion, descripcion, idDenunciante)
      VALUES (?, ?, ?, ?, ?)
    `
    const params = [
      incidente.idTipoIncidente,
      incidente.fecha,
      incidente.idLocalizacion,
      incidente.descripcion,
      incidente.idDenunciante ?? null
    ]

    logger.debug('Datos del incidente a insertar', { incidente })

    const connection = await getConnection()

    try {
      const [result] = await connection.execute(query, params)
      logger.debug('Incidente creado', { id: result.insertId })
      return this.findById(result.insertId)
    } catch (error) {
      logger.error('Error al crear incidente', { error: error.message })
      throw new Error(`Error al crear incidente: ${error.message}`)
    }
  }

  async update(id, incidente) {
    const query = `
      UPDATE ${this.tableName} SET 
        idTipoIncidente = ?, 
        fecha = ?, 
        idLocalizacion = ?, 
        descripcion = ?,
        idDenunciante = ?
      WHERE idIncidente = ?
    `
    const params = [
      incidente.idTipoIncidente,
      incidente.fecha,
      incidente.idLocalizacion,
      incidente.descripcion,
      incidente.idDenunciante ?? null,
      id
    ]

    const connection = await getConnection()

    try {
      const [result] = await connection.execute(query, params)
      logger.debug('Incidente actualizado', { id })
      return result.affectedRows > 0 ? this.findById(id) : null
    } catch (error) {
      logger.error('Error al actualizar incidente', { id, error: error.message })
      throw new Error(`Error al actualizar incidente: ${error.message}`)
    }
  }

  async actualizar(id, data) {
    return this.update(id, data)
  }

  async delete(id) {
    const query = `DELETE FROM ${this.tableName} WHERE idIncidente = ?`
    const connection = await getConnection()

    try {
      const [result] = await connection.execute(query, [id])
      logger.debug('Incidente eliminado', { id })
      return result.affectedRows > 0
    } catch (error) {
      logger.error('Error al eliminar incidente', { id, error: error.message })
      throw new Error(`Error al eliminar incidente: ${error.message}`)
    }
  }

  async eliminar(id) {
    return this.delete(id)
  }


  // ==========================
  // 🔎 Listado con filtros + paginado
  // ==========================
  async buscarConFiltros({ pagina = 1, limite = 10, busqueda = '', tipo = '', desde = '', hasta = '' }) {
    const toInt = (v, d) => (Number.isFinite(parseInt(v, 10)) ? parseInt(v, 10) : d)
    const page = Math.max(1, toInt(pagina, 1))
    const size = Math.max(1, toInt(limite, 10))
    const offset = (page - 1) * size

    const params = []
    let where = 'WHERE 1=1'

    if (busqueda) {
      const b = busqueda.trim()
      if (/^\d+$/.test(b)) {
        where += ' AND (i.idIncidente = ? OR i.descripcion LIKE ? OR l.direccion LIKE ?)'
        params.push(b, `%${b}%`, `%${b}%`)
      } else {
        where += ' AND (i.descripcion LIKE ? OR l.direccion LIKE ? OR ti.nombre LIKE ?)'
        params.push(`%${b}%`, `%${b}%`, `%${b}%`)
      }
    }
    if (tipo) { where += ' AND i.idTipoIncidente = ?'; params.push(tipo) }
    if (desde) { where += ' AND DATE(i.fecha) >= ?'; params.push(desde) }
    if (hasta) { where += ' AND DATE(i.fecha) <= ?'; params.push(hasta) }

    const sql = `
SELECT
  i.idIncidente,
  DATE_FORMAT(i.fecha, '%Y-%m-%d %H:%i') AS fecha,
  i.idTipoIncidente,
  ti.nombre AS tipoDescripcion,
  i.descripcion,                          -- 👈 descripción del incidente
  i.idLocalizacion,
  l.descripcion AS localizacion           -- 👈 descripción de la localización
FROM incidente i
JOIN tipoIncidente ti ON ti.idTipoIncidente = i.idTipoIncidente
JOIN localizacion   l ON l.idLocalizacion   = i.idLocalizacion
    ${where}
    ORDER BY i.fecha DESC
    LIMIT ${size} OFFSET ${offset}
  `
    const conn = await getConnection()
    const [rows] = await conn.execute(sql, params)
    return rows                 // 👈 devuelve raw rows (no new Incidente)
  }


  async contarConFiltros({ busqueda = '', tipo = '', desde = '', hasta = '' }) {
    const params = []
    let where = 'WHERE 1=1'

    if (busqueda) {
      const b = busqueda.trim()
      if (/^\d+$/.test(b)) {
        where += ' AND (i.idIncidente = ? OR i.descripcion LIKE ? OR l.direccion LIKE ?)'
        params.push(b, `%${b}%`, `%${b}%`)
      } else {
        where += ' AND (i.descripcion LIKE ? OR l.direccion LIKE ? OR ti.nombre LIKE ?)'
        params.push(`%${b}%`, `%${b}%`, `%${b}%`)
      }
    }
    if (tipo) { where += ' AND i.idTipoIncidente = ?'; params.push(tipo) }
    if (desde) { where += ' AND DATE(i.fecha) >= ?'; params.push(desde) }
    if (hasta) { where += ' AND DATE(i.fecha) <= ?'; params.push(hasta) }

    const sql = `
    SELECT COUNT(*) AS total
    FROM incidente i
    JOIN tipoIncidente ti ON ti.idTipoIncidente = i.idTipoIncidente
    JOIN localizacion   l ON l.idLocalizacion   = i.idLocalizacion
    ${where}
  `
    const conn = await getConnection()
    const [rows] = await conn.execute(sql, params)
    return rows[0]?.total || 0
  }

  // 🧩 Detalle por ID (con joins y extras útiles)
  async obtenerDetallePorId(id) {
    const sql = `
    SELECT
  i.idIncidente,
  DATE_FORMAT(i.fecha, '%Y-%m-%d %H:%i') AS fecha,
  i.idTipoIncidente,
  ti.nombre AS tipoDescripcion,
  i.descripcion,                          -- 👈 descripción del incidente
  i.idLocalizacion,
  l.descripcion AS localizacion           -- 👈 descripción de la localización
FROM incidente i
JOIN tipoIncidente ti ON ti.idTipoIncidente = i.idTipoIncidente
JOIN localizacion   l ON l.idLocalizacion   = i.idLocalizacion
    WHERE i.idIncidente = ?
    LIMIT 1
  `
    const conn = await getConnection()
    const [rows] = await conn.execute(sql, [id])
    return rows[0] || null      // 👈 raw row
  }

}
