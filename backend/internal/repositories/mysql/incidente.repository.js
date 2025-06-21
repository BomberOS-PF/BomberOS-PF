import { getConnection } from '../../platform/database/connection.js'
import { logger } from '../../platform/logger/logger.js'
import { Incidente } from '../../../domain/models/incidente.js'

export class MySQLIncidenteRepository {
  constructor() {
    this.tableName = 'incidente'
  }

  async findAll() {
    const query = `SELECT * FROM ${this.tableName} ORDER BY fecha DESC`
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
      SELECT 
        i.idIncidente, 
        i.DNI AS dni, 
        i.idTipoIncidente, 
        i.fecha, 
        i.idDenunciante, 
        i.idLocalizacion, 
        i.descripcion,
        ti.nombre AS tipoIncidenteNombre,
        l.descripcion AS localizacionDescripcion,
        d.nombre AS denuncianteNombre,
        d.apellido AS denuncianteApellido,
        b.nombreCompleto AS bomberoNombre
      FROM incidente i
      LEFT JOIN tipoIncidente ti ON i.idTipoIncidente = ti.idTipoIncidente
      LEFT JOIN localizacion l ON i.idLocalizacion = l.idLocalizacion
      LEFT JOIN denunciante d ON i.idDenunciante = d.idDenunciante
      LEFT JOIN bombero b ON i.DNI = b.DNI
      WHERE i.idIncidente = ?
    `
    
    const connection = getConnection()

    try {
      const [rows] = await connection.execute(query, [id])
      if (rows.length === 0) return null

      const incidente = {
        idIncidente: rows[0].idIncidente,
        dni: rows[0].dni ?? rows[0].DNI,
        idTipoIncidente: rows[0].idTipoIncidente,
        fecha: rows[0].fecha,
        idDenunciante: rows[0].idDenunciante,
        idLocalizacion: rows[0].idLocalizacion,
        descripcion: rows[0].descripcion,
        tipoIncidente: rows[0].tipoIncidenteNombre,
        localizacion: rows[0].localizacionDescripcion,
        denunciante: (rows[0].denuncianteNombre || rows[0].denuncianteApellido)
          ? {
              nombre: rows[0].denuncianteNombre || '',
              apellido: rows[0].denuncianteApellido || ''
            }
          : null,
        bomberoNombre: rows[0].bomberoNombre || null
      }

      console.log('📦 Objeto formado para retornar:', incidente)

      return incidente
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
        (dni, idTipoIncidente, fecha, idDenunciante, idLocalizacion, descripcion)
      VALUES (?, ?, ?, ?, ?, ?)
    `

    const params = [
      incidente.dni,
      incidente.idTipoIncidente,
      incidente.fecha,
      incidente.idDenunciante ?? null, // 🔑 Asegura que sea null si es undefined
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
        dni = ?, idTipoIncidente = ?, fecha = ?, 
        idDenunciante = ?, idLocalizacion = ?, descripcion = ?
      WHERE idIncidente = ?
    `

    const params = [
      incidente.dni,
      incidente.idTipoIncidente,
      incidente.fecha,
      incidente.idDenunciante ?? null,
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
