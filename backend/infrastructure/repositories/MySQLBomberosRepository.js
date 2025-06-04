import { IBomberosRepository } from '../../domain/repositories/IBomberosRepository.js'
import { Bombero } from '../../domain/entities/Bombero.js'
import pool from '../../db.js'

/**
 * Implementación MySQL del repositorio de bomberos
 * Adaptado a la estructura real de la tabla bombero (ABMC básico)
 */
export class MySQLBomberosRepository extends IBomberosRepository {

  async save(bombero) {
    const data = bombero.toPlainObject()
    const [result] = await pool.query(`
      INSERT INTO bombero (
        DNI, nombreCompleto, domicilio, correo, telefono, legajo, antiguedad, 
        idRango, esDelPlan, fechaFichaMedica, aptoPsicologico, grupoSanguineo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.dni || data.id, data.nombreCompleto || `${data.nombre} ${data.apellido}`, 
      data.domicilio, data.correo || data.email, data.telefono,
      data.legajo, data.antiguedad, data.idRango || 1, 
      data.esDelPlan || data.esPlan, data.fechaFichaMedica || data.fechaFicha,
      data.aptoPsicologico || data.aptoPsico, data.grupoSanguineo
    ])

    return result.insertId
  }

  async findById(dni) {
    const [rows] = await pool.query('SELECT * FROM bombero WHERE DNI = ?', [dni])
    return rows.length > 0 ? this.mapFromDatabase(rows[0]) : null
  }

  async findByEmail(correo) {
    const [rows] = await pool.query('SELECT * FROM bombero WHERE correo = ?', [correo])
    return rows.length > 0 ? this.mapFromDatabase(rows[0]) : null
  }

  async findByEmailExcludingId(correo, dni) {
    const [rows] = await pool.query(
      'SELECT * FROM bombero WHERE correo = ? AND DNI != ?', 
      [correo, dni]
    )
    return rows.length > 0 ? this.mapFromDatabase(rows[0]) : null
  }

  async findAll() {
    const [rows] = await pool.query(`
      SELECT DNI, nombreCompleto, domicilio, correo, telefono, legajo, 
             antiguedad, idRango, esDelPlan, fechaFichaMedica, aptoPsicologico, 
             grupoSanguineo, idUsuario
      FROM bombero 
      ORDER BY nombreCompleto
    `)
    return rows.map(row => this.mapFromDatabase(row))
  }

  async update(bombero) {
    const data = bombero.toPlainObject()
    const [result] = await pool.query(`
      UPDATE bombero SET 
        nombreCompleto = ?, domicilio = ?, correo = ?, telefono = ?, 
        legajo = ?, antiguedad = ?, idRango = ?, esDelPlan = ?, 
        fechaFichaMedica = ?, aptoPsicologico = ?, grupoSanguineo = ?
      WHERE DNI = ?
    `, [
      data.nombreCompleto || `${data.nombre} ${data.apellido}`, data.domicilio, 
      data.correo || data.email, data.telefono, data.legajo, data.antiguedad, 
      data.idRango || 1, data.esDelPlan || data.esPlan, 
      data.fechaFichaMedica || data.fechaFicha, data.aptoPsicologico || data.aptoPsico, 
      data.grupoSanguineo, data.dni || data.id
    ])

    return result.affectedRows > 0
  }

  async delete(dni) {
    const [result] = await pool.query('DELETE FROM bombero WHERE DNI = ?', [dni])
    return result.affectedRows > 0
  }

  async count() {
    const [rows] = await pool.query('SELECT COUNT(*) as total FROM bombero')
    return rows[0].total
  }

  async exists(dni) {
    const [rows] = await pool.query('SELECT 1 FROM bombero WHERE DNI = ? LIMIT 1', [dni])
    return rows.length > 0
  }

  // Mapear desde la base de datos a la entidad Bombero
  mapFromDatabase(row) {
    return new Bombero({
      id: row.DNI,
      dni: row.DNI,
      nombreCompleto: row.nombreCompleto,
      nombre: row.nombreCompleto?.split(' ')[0] || '',
      apellido: row.nombreCompleto?.split(' ').slice(1).join(' ') || '',
      domicilio: row.domicilio,
      email: row.correo,
      correo: row.correo,
      telefono: row.telefono,
      legajo: row.legajo,
      antiguedad: row.antiguedad,
      rango: this.mapRangoFromId(row.idRango),
      idRango: row.idRango,
      esPlan: row.esDelPlan,
      esDelPlan: row.esDelPlan,
      fechaFicha: row.fechaFichaMedica,
      fechaFichaMedica: row.fechaFichaMedica,
      aptoPsico: row.aptoPsicologico,
      aptoPsicologico: row.aptoPsicologico,
      grupoSanguineo: row.grupoSanguineo,
      idUsuario: row.idUsuario
    })
  }

  // Mapear ID de rango a texto (solo maneja rango básico)
  mapRangoFromId(idRango) {
    return idRango === 1 ? 'Bombero' : 'Bombero' // Por ahora solo manejamos rango básico
  }
} 