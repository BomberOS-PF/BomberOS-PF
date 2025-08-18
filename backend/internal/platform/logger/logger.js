/**
 * Sistema de logging estético para BomberOS
 * Aplicando principio KISS con mejor UX
 */
class Logger {
  constructor() {
    this.level = process.env.LOG_LEVEL || 'info'
    this.format = process.env.LOG_FORMAT || 'pretty'
  }

  _shouldLog(level) {
    const levels = { error: 0, warn: 1, info: 2, debug: 3 }
    return levels[level] <= levels[this.level]
  }

  _getLevelEmoji(level) {
    const emojis = {
      error: '❌',
      warn: '⚠️',
      info: 'ℹ️',
      debug: '🔍'
    }
    return emojis[level] || '📝'
  }

  _getLevelColor(level) {
    const colors = {
      error: '\x1b[31m', // Rojo
      warn: '\x1b[33m',  // Amarillo
      info: '\x1b[36m',  // Cyan
      debug: '\x1b[35m'  // Magenta
    }
    return colors[level] || '\x1b[37m' // Blanco por defecto
  }

  _formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString()
    const emoji = this._getLevelEmoji(level)
    const color = this._getLevelColor(level)
    const reset = '\x1b[0m'

    if (this.format === 'json') {
      const logEntry = {
        timestamp,
        level: level.toUpperCase(),
        message,
        ...meta
      }
      return JSON.stringify(logEntry)
    }
    
    // Formato estético
    const timeStr = timestamp.split('T')[1].split('.')[0] // Solo HH:MM:SS
    const levelStr = `[${level.toUpperCase()}]`
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : ''
    
    return `${color}${timeStr} ${emoji} ${levelStr}${reset} ${message}${metaStr}`
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

  // Método especial para logs de éxito
  success(message, meta = {}) {
    if (this._shouldLog('info')) {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
      const color = '\x1b[32m' // Verde
      const reset = '\x1b[0m'
      const levelStr = '[SUCCESS]'
      const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : ''
      
      console.info(`${color}${timestamp} ✅ ${levelStr}${reset} ${message}${metaStr}`)
    }
  }

  // Método para logs de sistema
  system(message, meta = {}) {
    if (this._shouldLog('info')) {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
      const color = '\x1b[34m' // Azul
      const reset = '\x1b[0m'
      const levelStr = '[SYSTEM]'
      const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : ''
      
      console.info(`${color}${timestamp} 🔧 ${levelStr}${reset} ${message}${metaStr}`)
    }
  }
}

// Instancia singleton del logger
export const logger = new Logger() 