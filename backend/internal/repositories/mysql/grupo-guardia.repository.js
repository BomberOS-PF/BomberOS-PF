import { getConnection } from '../../platform/database/connection.js'
import { logger } from '../../platform/logger/logger.js'
import { GrupoGuardia } from '../../../domain/models/grupo-guardia.js'

export class MySQLGrupoGuardiaRepository {
  constructor() {
    this.tableGrupos = 'grupo_guardia'
    this.tableIntermedia = 'bomberos_grupo'
  }

  async create(grupo) {
    const pool = getConnection()
    const connection = await pool.getConnection()

    const data = grupo.toDatabase()

    try {
      await connection.beginTransaction()

      // Insertar en grupo_guardia
      const [result] = await connection.execute(
        `INSERT INTO ${this.tableGrupos} (nombre) VALUES (?)`,
        [data.nombreGrupo]
      )
      const nuevoId = result.insertId

      // Insertar en bomberos_grupo
      for (const dni of data.bomberos) {
        await connection.execute(
          `INSERT INTO ${this.tableIntermedia} (idGrupo, dniBombero) VALUES (?, ?)`,
          [nuevoId, dni]
        )
      }

      await connection.commit()
      logger.debug('Grupo de guardia creado', { idGrupo: nuevoId })

      return this.findById(nuevoId)
    } catch (error) {
      await connection.rollback()
      logger.error('Error al crear grupo de guardia', { error: error.message })
      throw new Error(`Error al crear grupo: ${error.message}`)
    } finally {
      connection.release()
    }
  }

  async findById(id) {
    const pool = getConnection()
    const connection = await pool.getConnection()

    try {
      const [rowsGrupo] = await connection.execute(
        `SELECT idGrupo, nombre FROM ${this.tableGrupos} WHERE idGrupo = ?`,
        [id]
      )

      if (rowsGrupo.length === 0) return null

      const grupo = rowsGrupo[0]

      const [rowsBomberos] = await connection.execute(
        `SELECT dniBombero FROM ${this.tableIntermedia} WHERE idGrupo = ?`,
        [id]
      )

      const bomberos = rowsBomberos.map(row => row.dniBombero)

      return GrupoGuardia.create({
        idGrupo: grupo.idGrupo,
        nombreGrupo: grupo.nombre,
        bomberos
      })
    } catch (error) {
      logger.error('Error al buscar grupo de guardia por ID', { error: error.message })
      throw new Error(`Error al buscar grupo: ${error.message}`)
    } finally {
      connection.release()
    }
  }

  async findAll() {
    const pool = getConnection()
    const connection = await pool.getConnection()

    try {
      const [grupos] = await connection.execute(
        `SELECT idGrupo, nombre FROM ${this.tableGrupos} ORDER BY nombre ASC`
      )

      const resultados = []

      for (const grupo of grupos) {
        const [rowsBomberos] = await connection.execute(
          `SELECT dniBombero FROM ${this.tableIntermedia} WHERE idGrupo = ?`,
          [grupo.idGrupo]
        )

        const bomberos = rowsBomberos.map(row => row.dniBombero)

        resultados.push(
          GrupoGuardia.create({
            idGrupo: grupo.idGrupo,
            nombreGrupo: grupo.nombre,
            bomberos
          })
        )
      }

      return resultados
    } catch (error) {
      logger.error('Error al listar grupos de guardia', { error: error.message })
      throw new Error(`Error al listar grupos: ${error.message}`)
    } finally {
      connection.release()
    }
  }

  async delete(id) {
    const pool = getConnection()
    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      await connection.execute(
        `DELETE FROM ${this.tableIntermedia} WHERE idGrupo = ?`,
        [id]
      )

      const [result] = await connection.execute(
        `DELETE FROM ${this.tableGrupos} WHERE idGrupo = ?`,
        [id]
      )

      await connection.commit()
      return result.affectedRows > 0
    } catch (error) {
      await connection.rollback()
      logger.error('Error al eliminar grupo de guardia', { error: error.message })
      throw new Error(`Error al eliminar grupo: ${error.message}`)
    } finally {
      connection.release()
    }
  }
}
