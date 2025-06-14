import { getConnection } from '../../platform/database/connection.js'
import { logger } from '../../platform/logger/logger.js'
import { Bombero } from '../../../domain/models/bombero.js'

/**
 * Repositorio MySQL para Bomberos
 * Ajustado completamente a la estructura real de la tabla
 */
export class MySQLBomberoRepository {
  constructor() {
    this.tableName = 'bombero'
  }

  async findAll() {
    const query = `
      SELECT DNI, nombreCompleto, legajo, antiguedad, idRango, correo, telefono, 
             esDelPlan, fichaMedica, fichaMedicaArchivo, fechaFichaMedica, 
             aptoPsicologico, domicilio, grupoSanguineo, idUsuario
      FROM ${this.tableName}
      ORDER BY nombreCompleto ASC
    `
    
    const connection = getConnection()
    
    try {
      const [rows] = await connection.execute(query)
      logger.debug('Bomberos obtenidos', { count: rows.length })
      return rows.map(row => Bombero.create(row))
    } catch (error) {
      logger.error('Error al obtener bomberos', {
        error: error.message,
        code: error.code
      })
      throw new Error(`Error al obtener bomberos: ${error.message}`)
    }
  }

  async findById(id) {
    const query = `
      SELECT DNI, nombreCompleto, legajo, antiguedad, idRango, correo, telefono, 
             esDelPlan, fichaMedica, fichaMedicaArchivo, fechaFichaMedica, 
             aptoPsicologico, domicilio, grupoSanguineo, idUsuario
      FROM ${this.tableName} 
      WHERE DNI = ?
    `
    
    const connection = getConnection()
    
    try {
      const [rows] = await connection.execute(query, [id])
      return rows.length > 0 ? Bombero.create(rows[0]) : null
    } catch (error) {
      logger.error('Error al obtener bombero por ID', {
        id,
        error: error.message,
        code: error.code
      })
      throw new Error(`Error al obtener bombero: ${error.message}`)
    }
  }

  async create(bombero) {
    const data = bombero.toDatabase()
    const query = `
      INSERT INTO ${this.tableName} (
        DNI, nombreCompleto, legajo, antiguedad, idRango, correo, telefono, 
        esDelPlan, fichaMedica, fichaMedicaArchivo, fechaFichaMedica, 
        aptoPsicologico, domicilio, grupoSanguineo, idUsuario
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    
    const params = [
      data.DNI, data.nombreCompleto, data.legajo, data.antiguedad,
      data.idRango, data.correo, data.telefono, data.esDelPlan,
      data.fichaMedica, data.fichaMedicaArchivo, data.fechaFichaMedica,
      data.aptoPsicologico, data.domicilio, data.grupoSanguineo,
      data.idUsuario
    ]
    
    const connection = getConnection()
    
    try {
      await connection.execute(query, params)
      logger.debug('Bombero creado', { dni: data.DNI })
      return this.findById(data.DNI)
    } catch (error) {
      logger.error('Error al crear bombero', {
        dni: data.DNI,
        error: error.message,
        code: error.code
      })
      throw new Error(`Error al crear bombero: ${error.message}`)
    }
  }

  async update(id, bombero) {
    const data = bombero.toDatabase()
    const query = `
      UPDATE ${this.tableName} 
      SET nombreCompleto = ?, legajo = ?, antiguedad = ?, idRango = ?, 
          correo = ?, telefono = ?, esDelPlan = ?, fichaMedica = ?, 
          fichaMedicaArchivo = ?, fechaFichaMedica = ?, aptoPsicologico = ?, 
          domicilio = ?, grupoSanguineo = ?, idUsuario = ?
      WHERE DNI = ?
    `
    
    const params = [
      data.nombreCompleto, data.legajo, data.antiguedad, data.idRango,
      data.correo, data.telefono, data.esDelPlan, data.fichaMedica,
      data.fichaMedicaArchivo, data.fechaFichaMedica, data.aptoPsicologico,
      data.domicilio, data.grupoSanguineo, data.idUsuario, id
    ]
    
    const connection = getConnection()
    
    try {
      const [result] = await connection.execute(query, params)
      logger.debug('Bombero actualizado', { dni: id })
      return result.affectedRows > 0 ? this.findById(id) : null
    } catch (error) {
      logger.error('Error al actualizar bombero', {
        dni: id,
        error: error.message,
        code: error.code
      })
      throw new Error(`Error al actualizar bombero: ${error.message}`)
    }
  }

  async delete(id) {
    const query = `DELETE FROM ${this.tableName} WHERE DNI = ?`
    const connection = getConnection()
    
    try {
      const [result] = await connection.execute(query, [id])
      logger.debug('Bombero eliminado', { dni: id })
      return result.affectedRows > 0
    } catch (error) {
      logger.error('Error al eliminar bombero', {
        dni: id,
        error: error.message,
        code: error.code
      })
      throw new Error(`Error al eliminar bombero: ${error.message}`)
    }
  }

  async findByLegajo(legajo) {
    const query = `
      SELECT DNI, nombreCompleto, legajo, antiguedad, idRango, correo, telefono, 
             esDelPlan, fichaMedica, fichaMedicaArchivo, fechaFichaMedica, 
             aptoPsicologico, domicilio, grupoSanguineo, idUsuario
      FROM ${this.tableName} 
      WHERE legajo = ?
    `
    
    const connection = getConnection()
    
    try {
      const [rows] = await connection.execute(query, [legajo])
      return rows.length > 0 ? Bombero.create(rows[0]) : null
    } catch (error) {
      logger.error('Error al buscar bombero por legajo', {
        legajo,
        error: error.message,
        code: error.code
      })
      throw new Error(`Error al buscar bombero por legajo: ${error.message}`)
    }
  }

  async findDelPlan() {
    const query = `
      SELECT DNI, nombreCompleto, legajo, antiguedad, idRango, correo, telefono, 
             esDelPlan, fichaMedica, fichaMedicaArchivo, fechaFichaMedica, 
             aptoPsicologico, domicilio, grupoSanguineo, idUsuario
      FROM ${this.tableName} 
      WHERE esDelPlan = 1
      ORDER BY nombreCompleto ASC
    `
    
    const connection = getConnection()
    
    try {
      const [rows] = await connection.execute(query)
      logger.debug('Bomberos del plan obtenidos', { count: rows.length })
      return rows.map(row => Bombero.create(row))
    } catch (error) {
      logger.error('Error al obtener bomberos del plan', {
        error: error.message,
        code: error.code
      })
      throw new Error(`Error al obtener bomberos del plan: ${error.message}`)
    }
  }
} 