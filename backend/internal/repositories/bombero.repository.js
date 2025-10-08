import { getConnection } from '../platform/database/connection.js'
import { logger } from '../platform/logger/logger.js'
import { Bombero } from '../../domain/models/bombero.js'

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
      SELECT dni, nombre, apellido, legajo, antiguedad, idRango, correo, telefono, 
            esDelPlan, fichaMedica, fichaMedicaArchivo, fechaFichaMedica, 
            aptoPsicologico, domicilio, grupoSanguineo, idUsuario
      FROM ${this.tableName}
      ORDER BY nombre ASC, apellido ASC
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
      SELECT dni, nombre, apellido, legajo, antiguedad, idRango, correo, telefono, 
            esDelPlan, fichaMedica, fichaMedicaArchivo, fechaFichaMedica, 
            aptoPsicologico, domicilio, grupoSanguineo, idUsuario
      FROM ${this.tableName} 
      WHERE dni = ?
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


async findConPaginado({ pagina = 1, limite = 10, busqueda = '' }) {
  const offset = (pagina - 1) * limite
  const connection = getConnection()

  let whereClause = ''
  let valores = []

  if (busqueda && busqueda.trim() !== '') {
    const valorLike = `%${busqueda.trim()}%`
    whereClause = `WHERE (b.dni LIKE ? OR b.legajo LIKE ? OR b.nombre LIKE ? OR b.apellido LIKE ? OR CONCAT(b.nombre, ' ', b.apellido) LIKE ?)`
    valores = [valorLike, valorLike, valorLike, valorLike, valorLike]
  }

  const limitInt = parseInt(limite, 10)
  const offsetInt = parseInt(offset, 10)

  try {
    const query = `
      SELECT 
        b.dni, b.nombre, b.apellido, b.legajo, b.antiguedad, b.idRango, b.correo, b.telefono, 
        b.esDelPlan, b.fichaMedica, b.fichaMedicaArchivo, b.fechaFichaMedica, 
        b.aptoPsicologico, b.domicilio, b.grupoSanguineo, b.idUsuario,
        r.descripcion AS rangoDescripcion,
        GROUP_CONCAT(g.nombre SEPARATOR ', ') AS grupos
      FROM ${this.tableName} b
      LEFT JOIN rango r ON r.idRango = b.idRango
      LEFT JOIN bomberosGrupo bg ON bg.dni = b.dni
      LEFT JOIN grupoGuardia g ON g.idGrupo = bg.idGrupo
      ${whereClause}
      GROUP BY b.dni, b.nombre, b.apellido, b.legajo, b.antiguedad, b.idRango, b.correo, b.telefono, 
               b.esDelPlan, b.fichaMedica, b.fichaMedicaArchivo, b.fechaFichaMedica, 
               b.aptoPsicologico, b.domicilio, b.grupoSanguineo, b.idUsuario, r.descripcion
      ORDER BY b.apellido ASC, b.nombre ASC
      LIMIT ${limitInt} OFFSET ${offsetInt}
    `

    const [rows] = await connection.execute(query, valores)

    // Hacer un mapeo de los bomberos para acumular los grupos correctamente
    const bomberos = rows.map(row => ({
      dni: row.dni,
      nombre: row.nombre,
      apellido: row.apellido,
      legajo: row.legajo,
      antiguedad: row.antiguedad,
      idRango: row.idRango,
      rango: row.rangoDescripcion,
      correo: row.correo,
      email: row.correo,  
      telefono: row.telefono,
      domicilio: row.domicilio,
      grupoSanguineo: row.grupoSanguineo,
      esDelPlan: Boolean(row.esDelPlan),
      fichaMedica: row.fichaMedica,
      fichaMedicaArchivo: row.fichaMedicaArchivo,
      fechaFichaMedica: row.fechaFichaMedica,
      aptoPsicologico: Boolean(row.aptoPsicologico),
      idUsuario: row.idUsuario,
      grupoGuardia: row.grupos ? row.grupos.split(', ') : [] // Separar los grupos por coma
    }))

    // Consulta para contar el total de bomberos
    const countQuery = `
      SELECT COUNT(DISTINCT b.dni) as total
      FROM ${this.tableName} b
      LEFT JOIN bomberosGrupo bg ON bg.dni = b.dni
      LEFT JOIN grupoGuardia g ON g.idGrupo = bg.idGrupo
      ${whereClause}
    `
    const [countRows] = await connection.execute(countQuery, valores)

    return {
      data: bomberos,
      total: countRows[0].total
    }

  } catch (error) {
    logger.error('Error al buscar bomberos con paginado', {
      error: error.message
    })
    throw new Error('Error interno al buscar bomberos')
  }
}

  async create(bombero) {
    const data = bombero.toDatabase()
    
    // Validar campos obligatorios
    if (!data.dni) throw new Error('El DNI es obligatorio')
    if (!data.nombre) throw new Error('El nombre es obligatorio')
    if (!data.apellido) throw new Error('El apellido es obligatorio')
    if (!data.idRango) throw new Error('El rango es obligatorio')
    if (!data.correo) throw new Error('El correo es obligatorio')
    if (!data.telefono) throw new Error('El teléfono es obligatorio')
    if (!data.domicilio) throw new Error('El domicilio es obligatorio')
    if (!data.grupoSanguineo) throw new Error('El grupo sanguíneo es obligatorio')
    
    const query = `
      INSERT INTO ${this.tableName} (
        dni, nombre, apellido, legajo, antiguedad, idRango, correo, telefono, 
        esDelPlan, fichaMedica, fichaMedicaArchivo, fechaFichaMedica, 
        aptoPsicologico, domicilio, grupoSanguineo, idUsuario
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    
    const params = [
      data.dni, data.nombre, data.apellido, data.legajo || null, data.antiguedad || 0,
      data.idRango, data.correo, data.telefono, data.esDelPlan || false,
      data.fichaMedica || null, data.fichaMedicaArchivo || null, data.fechaFichaMedica || null,
      data.aptoPsicologico || false, data.domicilio, data.grupoSanguineo,
      data.idUsuario || null
    ]
    
    const connection = getConnection()
    
    try {
      await connection.execute(query, params)
      logger.debug('Bombero creado', { dni: data.dni })
      return this.findById(data.dni)
    } catch (error) {
      logger.error('Error al crear bombero', {
        dni: data.dni,
        error: error.message,
        code: error.code
      })
      
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Ya existe un bombero con ese DNI')
      }
      if (error.message.includes('Out of range value for column \'dni\'')) {
        throw new Error('El DNI ingresado es demasiado largo. Debe tener como máximo 8 dígitos')
      }
      if (error.message.includes('Data too long')) {
        throw new Error('Uno de los campos supera la longitud máxima permitida')
      }
      if (error.message.includes('cannot be null')) {
        throw new Error('Faltan campos obligatorios')
      }
      
      throw new Error('Error al crear bombero. Verifique que todos los campos estén completos')
    }
  }

  async update(id, bombero) {
    const data = bombero.toDatabase()
    
    // Validar campos obligatorios
    if (!data.nombre) throw new Error('El nombre es obligatorio')
    if (!data.apellido) throw new Error('El apellido es obligatorio')
    if (!data.idRango) throw new Error('El rango es obligatorio')
    if (!data.correo) throw new Error('El correo es obligatorio')
    if (!data.telefono) throw new Error('El teléfono es obligatorio')
    if (!data.domicilio) throw new Error('El domicilio es obligatorio')
    if (!data.grupoSanguineo) throw new Error('El grupo sanguíneo es obligatorio')
    
    const query = `
      UPDATE ${this.tableName} 
      SET nombre = ?, apellido = ?, legajo = ?, antiguedad = ?, idRango = ?, 
          correo = ?, telefono = ?, esDelPlan = ?, fichaMedica = ?, 
          fechaFichaMedica = ?, aptoPsicologico = ?, 
          domicilio = ?, grupoSanguineo = ?, idUsuario = ?
      WHERE dni = ?
    `
    
    const params = [
      data.nombre, data.apellido, data.legajo || null, data.antiguedad || 0, data.idRango,
      data.correo, data.telefono, data.esDelPlan || false, data.fichaMedica || null,
      data.fechaFichaMedica || null, data.aptoPsicologico || false,
      data.domicilio, data.grupoSanguineo, data.idUsuario || null, id
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
      
      if (error.message.includes('Bind parameters must not contain undefined')) {
        throw new Error('Faltan campos obligatorios. Complete todos los campos requeridos')
      }
      if (error.message.includes('Out of range value')) {
        throw new Error('Uno de los valores ingresados supera el límite permitido')
      }
      if (error.message.includes('Data too long')) {
        throw new Error('Uno de los campos supera la longitud máxima permitida')
      }
      if (error.message.includes('cannot be null')) {
        throw new Error('Faltan campos obligatorios')
      }
      
      throw new Error('Error al actualizar bombero. Verifique que todos los campos estén completos')
    }
  }

  async delete(id) {
    const query = `DELETE FROM ${this.tableName} WHERE dni = ?`
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

  /**
   * Actualizar solo la ficha médica de un bombero (almacena PDF en BD como BLOB)
   */
  async updateFichaMedica(dni, pdfBuffer, nombreArchivo, fechaFichaMedica) {
    const query = `
      UPDATE ${this.tableName} 
      SET fichaMedica = 1,
          fichaMedicaPDF = ?,
          fichaMedicaArchivo = ?,
          fechaFichaMedica = ?
      WHERE dni = ?
    `
    
    const connection = getConnection()
    
    try {
      const [result] = await connection.execute(query, [
        pdfBuffer,
        nombreArchivo,
        fechaFichaMedica,
        dni
      ])
      logger.info('Ficha médica actualizada en BD', { dni, nombreArchivo })
      return result.affectedRows > 0
    } catch (error) {
      logger.error('Error al actualizar ficha médica', {
        dni,
        nombreArchivo,
        error: error.message,
        code: error.code
      })
      throw new Error('Error al actualizar la ficha médica')
    }
  }

  /**
   * Obtener la ficha médica de un bombero (PDF desde BD)
   */
  async getFichaMedica(dni) {
    const query = `
      SELECT fichaMedicaPDF, fechaFichaMedica
      FROM ${this.tableName}
      WHERE dni = ? AND fichaMedicaPDF IS NOT NULL
    `
    
    const connection = getConnection()
    
    try {
      const [rows] = await connection.execute(query, [dni])
      if (rows.length === 0) {
        return null
      }
      
      return {
        pdf: rows[0].fichaMedicaPDF,
        fecha: rows[0].fechaFichaMedica
      }
    } catch (error) {
      logger.error('Error al obtener ficha médica', {
        dni,
        error: error.message,
        code: error.code
      })
      throw new Error('Error al obtener la ficha médica')
    }
  }

  async findByLegajo(legajo) {
    const query = `
      SELECT dni, nombre, apellido, legajo, antiguedad, idRango, correo, telefono, 
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
      SELECT dni, nombre, apellido, legajo, antiguedad, idRango, correo, telefono, 
            esDelPlan, fichaMedica, fichaMedicaArchivo, fechaFichaMedica, 
            aptoPsicologico, domicilio, grupoSanguineo, idUsuario
      FROM ${this.tableName} 
      WHERE esDelPlan = 1
      ORDER BY apellido ASC, nombre ASC
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

  async findByIdUsuario(idUsuario) {
    const query = `
      SELECT dni, nombre, apellido, legajo, antiguedad, idRango, correo, telefono,
            esDelPlan, fichaMedica, fichaMedicaArchivo, fechaFichaMedica,
            aptoPsicologico, domicilio, grupoSanguineo, idUsuario
      FROM ${this.tableName}
      WHERE idUsuario = ?
    `
    const connection = getConnection()
    try {
      const [rows] = await connection.execute(query, [idUsuario])
      return rows.length > 0 ? Bombero.create(rows[0]) : null
    } catch (error) {
      logger.error('Error al buscar bombero por idUsuario', {
        idUsuario,
        error: error.message,
        code: error.code
      })
      throw new Error(`Error al buscar bombero por idUsuario: ${error.message}`)
    }
  }
} 