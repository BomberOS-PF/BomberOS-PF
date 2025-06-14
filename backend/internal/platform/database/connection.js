import mysql from 'mysql2/promise'
import { logger } from '../logger/logger.js'

let connection = null

/**
 * Crear conexión a la base de datos
 * Implementa el patrón Singleton para la conexión
 */
export async function createConnection(config) {
  if (connection) {
    return connection
  }

  try {
    connection = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      connectionLimit: config.connectionLimit || 10,
      acquireTimeout: config.acquireTimeout || 60000,
      timeout: config.timeout || 60000,
      multipleStatements: false,
      charset: 'utf8mb4'
    })

    // Probar la conexión
    const testConnection = await connection.getConnection()
    await testConnection.ping()
    testConnection.release()

    logger.info('📊 Conexión a base de datos establecida', {
      host: config.host,
      port: config.port,
      database: config.database,
      connectionLimit: config.connectionLimit
    })

    return connection
  } catch (error) {
    logger.error('❌ Error al conectar con la base de datos:', {
      error: error.message,
      code: error.code,
      host: config.host,
      port: config.port,
      database: config.database
    })
    throw error
  }
}

/**
 * Obtener conexión existente
 */
export function getConnection() {
  if (!connection) {
    throw new Error('Database connection not initialized. Call createConnection first.')
  }
  return connection
}

/**
 * Cerrar conexión
 */
export async function closeConnection() {
  if (connection) {
    try {
      await connection.end()
      connection = null
      logger.info('📊 Conexión a base de datos cerrada')
    } catch (error) {
      logger.error('❌ Error al cerrar conexión de base de datos:', error)
      throw error
    }
  }
}

/**
 * Ejecutar query con logging y manejo de errores
 */
export async function executeQuery(query, params = []) {
  const conn = getConnection()
  const startTime = Date.now()
  
  try {
    const [results] = await conn.execute(query, params)
    const duration = Date.now() - startTime
    
    logger.debug('📊 Query ejecutada', {
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      duration: `${duration}ms`,
      rowsAffected: results.affectedRows || results.length
    })
    
    return results
  } catch (error) {
    const duration = Date.now() - startTime
    
    logger.error('❌ Error en query de base de datos', {
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      params: params,
      duration: `${duration}ms`,
      error: error.message,
      code: error.code
    })
    
    throw error
  }
}

/**
 * Ejecutar transacción
 */
export async function executeTransaction(callback) {
  const conn = getConnection()
  const transactionConnection = await conn.getConnection()
  
  try {
    await transactionConnection.beginTransaction()
    
    const result = await callback(transactionConnection)
    
    await transactionConnection.commit()
    logger.debug('📊 Transacción completada exitosamente')
    
    return result
  } catch (error) {
    await transactionConnection.rollback()
    logger.error('❌ Error en transacción, rollback realizado:', error)
    throw error
  } finally {
    transactionConnection.release()
  }
} 