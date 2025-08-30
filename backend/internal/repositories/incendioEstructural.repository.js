import { getConnection } from '../platform/database/connection.js'
import { logger } from '../platform/logger/logger.js'

export class MySQLIncendioEstructuralRepository {
  constructor() {
    this.tableName = 'incendioEstructural'
    this.damnificadoTable = 'damnificado'
  }

  /**
   * Inserta un incendio estructural
   */
  async insertarIncendio({
    idIncidente,
    tipoTecho,
    tipoAbertura,
    descripcion,
    superficie,
    cantPisos,
    cantAmbientes
  }) {
    const connection = getConnection()

    const query = `
      INSERT INTO ${this.tableName} 
      (idIncidente, tipoTecho, tipoAbertura, descripcion, superficie, cantPisos, cantAmbientes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `

    const params = [
      idIncidente,
      tipoTecho || null,
      tipoAbertura || null,
      descripcion || null,
      superficie || null,
      cantPisos || null,
      cantAmbientes || null
    ]

    try {
      const [result] = await connection.execute(query, params)
      logger.debug('🔥 Incendio estructural insertado en DB', { id: result.insertId })
      return result.insertId
    } catch (error) {
      console.error('❌ Error MySQL insertar incendio estructural:', error)
      throw error
    }
  }

  /**
   * Inserta un damnificado vinculado al incidente
   */
  async insertarDamnificado({
    idIncidente,
    nombre,
    apellido,
    domicilio,
    telefono,
    dni,
    fallecio
  }) {
    const connection = getConnection()

    const query = `
      INSERT INTO ${this.damnificadoTable}
      (idIncidente, nombre, apellido, domicilio, telefono, dni, fallecio)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    const params = [
      idIncidente,
      nombre || null,
      apellido || null,
      domicilio || null,
      telefono || null,
      dni || null,
      fallecio === true ? 1 : 0
    ]

    try {
      const [result] = await connection.execute(query, params)
      logger.debug('➕ Damnificado insertado en DB', { id: result.insertId })
      return result.insertId
    } catch (error) {
      console.error('❌ Error MySQL insertar damnificado:', error)
      throw error
    }
  }

  /**
   * Obtiene un incendio estructural por idIncidente con damnificados
   */
  async obtenerPorIncidente(idIncidente) {
    const connection = getConnection()

    const [incendioRows] = await connection.execute(
      `SELECT * FROM ${this.tableName} WHERE idIncidente = ?`,
      [idIncidente]
    )

    if (incendioRows.length === 0) return null
    const incendio = incendioRows[0]

    const [damnificados] = await connection.execute(
      `SELECT * FROM ${this.damnificadoTable} WHERE idIncidente = ?`,
      [idIncidente]
    )

    return {
      ...incendio,
      damnificados
    }
  }

  /**
   * Lista todos los incendios estructurales con damnificados por incidente
   */
  async obtenerTodos() {
    const connection = getConnection()

    try {
      const [incendios] = await connection.execute(`SELECT * FROM ${this.tableName}`)
      const resultados = []

      for (const inc of incendios) {
        const [damnificados] = await connection.execute(
          `SELECT * FROM ${this.damnificadoTable} WHERE idIncidente = ?`,
          [inc.idIncidente]
        )

        resultados.push({
          ...inc,
          damnificados
        })
      }

      return resultados
    } catch (error) {
      logger.error('❌ Error en obtenerTodos incendios estructurales', { error: error.message })
      throw new Error('Error al obtener los incendios estructurales')
    }
  }
}
