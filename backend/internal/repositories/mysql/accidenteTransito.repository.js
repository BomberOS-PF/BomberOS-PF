import { getConnection } from '../../platform/database/connection.js'
import { logger } from '../../platform/logger/logger.js'

export class MySQLAccidenteTransitoRepository {
  constructor() {
    this.tableName = 'accidenteTransito'
  }

  async insertarAccidente(idIncidente, detalle) {
    const query = `
      INSERT INTO ${this.tableName} (idIncidente, detalle)
      VALUES (?, ?)
    `
    const params = [idIncidente, detalle]

    const connection = getConnection()
    try {
      const [result] = await connection.execute(query, params)
      logger.debug('📌 Accidente de tránsito insertado', { idAccidenteTransito: result.insertId })
      return result.insertId
    } catch (error) {
      logger.error('❌ Error al insertar accidente de tránsito', { error: error.message })
      throw new Error('Error al insertar el accidente en la base de datos')
    }
  }

  async obtenerAccidenteCompleto(idIncidente) {
    const connection = getConnection()

    // 1. Buscar accidente por idIncidente
    const [accidenteRows] = await connection.execute(`
      SELECT * FROM ${this.tableName}
      WHERE idIncidente = ?
    `, [idIncidente])

    if (accidenteRows.length === 0) return null

    const accidente = accidenteRows[0]

    // 2. Vehículos involucrados
    const [vehiculos] = await connection.execute(`
      SELECT v.*
      FROM vehiculoInvolucrado v
      JOIN accidenteVehiculoInvolucrado av ON v.idVehiculo = av.idVehiculoInvolucrado
      WHERE av.idAccidenteTransito = ?
    `, [accidente.idAccidenteTransito])

    // 3. Damnificados
    const [damnificados] = await connection.execute(`
      SELECT d.*
      FROM damnificado d
      JOIN accidenteDamnificado ad ON d.idDamnificado = ad.idDamnificado
      WHERE ad.idAccidenteTransito = ?
    `, [accidente.idAccidenteTransito])

    return {
      ...accidente,
      vehiculos,
      damnificados
    }
  }

  async obtenerTodosAccidentesCompletos() {
  const connection = getConnection()

  try {
    const [accidentes] = await connection.execute(`
      SELECT * FROM accidenteTransito
    `)

    const resultados = []

    for (const acc of accidentes) {
      const [vehiculos] = await connection.execute(`
        SELECT v.*
        FROM vehiculoInvolucrado v
        JOIN accidenteVehiculoInvolucrado av ON v.idVehiculo = av.idVehiculoInvolucrado
        WHERE av.idAccidenteTransito = ?
      `, [acc.idAccidenteTransito])

      const [damnificados] = await connection.execute(`
        SELECT d.*
        FROM damnificado d
        JOIN accidenteDamnificado ad ON d.idDamnificado = ad.idDamnificado
        WHERE ad.idAccidenteTransito = ?
      `, [acc.idAccidenteTransito])

      resultados.push({
        ...acc,
        vehiculos,
        damnificados
      })
    }

    return resultados
  } catch (error) {
    logger.error('❌ Error en obtenerTodosAccidentesCompletos', { error: error.message })
    throw error
  }
}



}
