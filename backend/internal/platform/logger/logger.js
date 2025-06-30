/**
 * Sistema de logging simplificado
 * Aplicando principio KISS
 */
class Logger {
  constructor() {
    this.level = process.env.LOG_LEVEL || 'info'
    this.format = process.env.LOG_FORMAT || 'json'
  }

  _shouldLog(level) {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 }
    return levels[level] <= levels[this.level]
  }

  _formatMessage(level, message, meta = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      ...meta
    }

    if (this.format === 'json') {
      return JSON.stringify(logEntry)
    }
    
    return `${logEntry.timestamp} [${logEntry.level}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`
  }

  error(message, meta = {}) {
    if (this._shouldLog('error')) {
      console.error(this._formatMessage('error', message, meta))
    }
  }

  warn(message, meta = {}) {
    if (this._shouldLog('warn')) {
      console.warn(this._formatMessage('warn', message, meta))
    }
  }

  info(message, meta = {}) {
    if (this._shouldLog('info')) {
      console.info(this._formatMessage('info', message, meta))
    }
  }

  debug(message, meta = {}) {
    if (this._shouldLog('debug')) {
      console.debug(this._formatMessage('debug', message, meta))
    }
  }
}

// Instancia singleton del logger
export const logger = new Logger() 