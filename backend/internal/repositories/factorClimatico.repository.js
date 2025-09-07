import { getConnection } from '../platform/database/connection.js'
import { logger } from '../platform/logger/logger.js'

export class MySQLFactorClimaticoRepository {
  constructor() {
    this.table = 'climatico'
  }

  /**
   * Guardar registro principal de factor climático
   */
  async guardar(datos) {
    const query = `
      INSERT INTO ${this.table} (idIncidente, detalle, superficie, cantidadPersonasAfectadas)
      VALUES (?, ?, ?, ?)
    `
    const values = [
      datos.idIncidente,
      datos.detalle || null,
      datos.superficie,
      datos.cantidadPersonasAfectadas || 0
    ]

    try {
      const conn = await getConnection()
      const [result] = await conn.execute(query, values)
      logger.info('✅ Climático guardado en BD', { idClimatico: result.insertId })
      return result.insertId
    } catch (error) {
      logger.error('❌ Error al guardar en tabla climatico', { error: error.message })
      throw error
    }
  }

  /**
   * Obtener registro climático por ID de incidente
   */
  async obtenerPorIncidente(idIncidente) {
    const query = `SELECT * FROM ${this.table} WHERE idIncidente = ?`

    try {
      const conn = await getConnection()
      const [rows] = await conn.execute(query, [idIncidente])

      return rows.length > 0 ? rows[0] : null
    } catch (error) {
      logger.error('❌ Error al obtener climático por incidente', { error: error.message })
      throw error
    }
  }

  /**
   * Listar todos los registros climáticos
   */
  async obtenerTodos() {
    const query = `SELECT * FROM ${this.table}`

    try {
      const conn = await getConnection()
      const [rows] = await conn.execute(query)
      return rows
    } catch (error) {
      logger.error('❌ Error al listar climáticos', { error: error.message })
      throw error
    }
  }

  /**
   * Actualizar registro climático existente
   */
  async actualizar(idClimatico, datos) {
    const query = `
      UPDATE ${this.table} 
      SET detalle = ?, superficie = ?, cantidadPersonasAfectadas = ?
      WHERE idClimatico = ?
    `
    const values = [
      datos.detalle || null,
      datos.superficie,
      datos.cantidadPersonasAfectadas || 0,
      idClimatico
    ]

    try {
      const conn = await getConnection()
      const [result] = await conn.execute(query, values)
      logger.info('🔄 Climático actualizado en BD', { idClimatico, affectedRows: result.affectedRows })
      return result.affectedRows > 0
    } catch (error) {
      logger.error('❌ Error al actualizar climático', { error: error.message })
      throw error
    }
  }

  /**
   * Obtener factor climático completo con damnificados
   */
  async obtenerClimaticoCompleto(idIncidente) {
    const query = `
      SELECT 
        c.*,
        d.idDamnificado,
        d.nombre,
        d.apellido,
        d.dni,
        d.domicilio,
        d.telefono,
        d.fallecio
      FROM ${this.table} c
      LEFT JOIN damnificado d ON c.idIncidente = d.idIncidente
      WHERE c.idIncidente = ?
    `

    try {
      const conn = await getConnection()
      const [rows] = await conn.execute(query, [idIncidente])
      
      if (rows.length === 0) {
        return null
      }

      // Agrupar damnificados
      const climaticoData = {
        idClimatico: rows[0].idClimatico,
        idIncidente: rows[0].idIncidente,
        superficie: rows[0].superficie,
        cantidadPersonasAfectadas: rows[0].cantidadPersonasAfectadas,
        detalle: rows[0].detalle,
        damnificados: []
      }
      

      // Agregar damnificados si existen
      rows.forEach(row => {
        if (row.idDamnificado) {
          climaticoData.damnificados.push({
            idDamnificado: row.idDamnificado,
            nombre: row.nombre,
            apellido: row.apellido,
            dni: row.dni,
            domicilio: row.domicilio,
            telefono: row.telefono,
            fallecio: row.fallecio
          })
        }
      })

      logger.debug('✅ Factor climático completo obtenido', { 
        idIncidente, 
        damnificados: climaticoData.damnificados.length 
      })
      
      return climaticoData
    } catch (error) {
      logger.error('❌ Error al obtener factor climático completo', { error: error.message })
      throw error
    }
  }
}
