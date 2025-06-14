import { logger } from '../../internal/platform/logger/logger.js'

/**
 * Middleware centralizado de manejo de errores
 */
export function errorHandler(error, req, res, next) {
  // Log del error
  logger.error('Error no manejado en la aplicación', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body
  })

  if (res.headersSent) {
    return next(error)
  }

  const errorResponse = determineErrorResponse(error)
  
  res.status(errorResponse.statusCode).json({
    success: false,
    error: errorResponse.error,
    message: errorResponse.message,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error
    })
  })
}


function determineErrorResponse(error) {
  // Errores de validación
  if (error.name === 'ValidationError') {
    return {
      statusCode: 400,
      error: 'Datos de entrada inválidos',
      message: error.message
    }
  }

  if (error.code) {
    return handleDatabaseError(error)
  }

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return {
      statusCode: 400,
      error: 'JSON inválido',
      message: 'El cuerpo de la petición contiene JSON malformado'
    }
  }

  if (error.message.includes('no encontrado') || error.message.includes('not found')) {
    return {
      statusCode: 404,
      error: 'Recurso no encontrado',
      message: error.message
    }
  }

  if (error.message.includes('ya existe') || error.message.includes('duplicado')) {
    return {
      statusCode: 409,
      error: 'Conflicto de datos',
      message: error.message
    }
  }

  if (error.message.includes('unauthorized') || error.message.includes('no autorizado')) {
    return {
      statusCode: 401,
      error: 'No autorizado',
      message: error.message
    }
  }

  if (error.message.includes('forbidden') || error.message.includes('sin permisos')) {
    return {
      statusCode: 403,
      error: 'Acceso denegado',
      message: error.message
    }
  }

  return {
    statusCode: 500,
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'production' 
      ? 'Ha ocurrido un error interno' 
      : error.message
  }
}


function handleDatabaseError(error) {
  switch (error.code) {
    case 'ER_DUP_ENTRY':
      return {
        statusCode: 409,
        error: 'Datos duplicados',
        message: 'Ya existe un registro con estos datos'
      }
    
    case 'ER_NO_REFERENCED_ROW_2':
      return {
        statusCode: 400,
        error: 'Referencia inválida',
        message: 'Uno o más valores hacen referencia a registros que no existen'
      }
    
    case 'ER_ROW_IS_REFERENCED_2':
      return {
        statusCode: 409,
        error: 'Registro en uso',
        message: 'No se puede eliminar porque está siendo referenciado por otros registros'
      }
    
    case 'ER_BAD_NULL_ERROR':
      return {
        statusCode: 400,
        error: 'Campo requerido',
        message: 'Uno o más campos requeridos están vacíos'
      }
    
    case 'ER_DATA_TOO_LONG':
      return {
        statusCode: 400,
        error: 'Datos demasiado largos',
        message: 'Uno o más campos exceden la longitud máxima permitida'
      }
    
    case 'ECONNREFUSED':
      return {
        statusCode: 503,
        error: 'Servicio no disponible',
        message: 'No se puede conectar con la base de datos'
      }
    
    case 'ER_ACCESS_DENIED_ERROR':
      return {
        statusCode: 503,
        error: 'Error de configuración',
        message: 'Error de acceso a la base de datos'
      }
    
    default:
      logger.error('Error de base de datos no manejado', {
        code: error.code,
        sqlMessage: error.sqlMessage,
        sql: error.sql
      })
      
      return {
        statusCode: 500,
        error: 'Error de base de datos',
        message: process.env.NODE_ENV === 'production' 
          ? 'Error al procesar la operación en la base de datos'
          : error.sqlMessage || error.message
      }
  }
}


export function notFoundHandler(req, res) {
  logger.warn('Ruta no encontrada', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  })

  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    message: `La ruta ${req.method} ${req.originalUrl} no existe`,
    timestamp: new Date().toISOString()
  })
}


export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
} 