import { getConnection } from '../../platform/database/connection.js'
import { logger } from '../../platform/logger/logger.js'
import { Incidente } from '../../../domain/models/incidente.js'

export class MySQLIncidenteRepository {
  constructor() {
    this.tableName = 'incidente'
  }

  async findAll() {
    const query = `
      SELECT i.*, l.direccion as localizacion 
      FROM ${this.tableName} i
      LEFT JOIN localizacion l ON i.idLocalizacion = l.idLocalizacion
      ORDER BY i.fecha DESC
    `
    const connection = getConnection()

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
      SELECT i.*, l.direccion as localizacion 
      FROM ${this.tableName} i
      LEFT JOIN localizacion l ON i.idLocalizacion = l.idLocalizacion
      WHERE i.idIncidente = ?
    `
    const connection = getConnection()

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

  async create(incidente) {
    const query = `
      INSERT INTO ${this.tableName} 
        (idTipoIncidente, fecha, idLocalizacion, descripcion)
      VALUES (?, ?, ?, ?)
    `

    const params = [
      incidente.idTipoIncidente,
      incidente.fecha,
      incidente.idLocalizacion,
      incidente.descripcion
    ]

    logger.debug('Datos del incidente a insertar', { incidente })

    const connection = getConnection()

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
        idTipoIncidente = ?, fecha = ?, 
        idLocalizacion = ?, descripcion = ?
      WHERE idIncidente = ?
    `

    const params = [     
      incidente.idTipoIncidente,
      incidente.fecha,
      incidente.idLocalizacion,
      incidente.descripcion,
      id
    ]

    const connection = getConnection()

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
    const connection = getConnection()

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
}
