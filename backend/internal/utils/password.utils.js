import bcrypt from 'bcrypt'
import { logger } from '../platform/logger/logger.js'

/**
 * Utilidades para manejo seguro de contraseñas
 */
export class PasswordUtils {
  static SALT_ROUNDS = 12 // Número de rondas de salt (más alto = más seguro pero más lento)

  /**
   * Hashea una contraseña usando bcrypt
   * @param {string} plainPassword - Contraseña en texto plano
   * @returns {Promise<string>} - Contraseña hasheada
   */
  static async hashPassword(plainPassword) {
    try {
      if (!plainPassword || typeof plainPassword !== 'string') {
        throw new Error('La contraseña debe ser una cadena válida')
      }

      if (plainPassword.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres')
      }

      logger.debug('Hasheando contraseña', { 
        length: plainPassword.length,
        saltRounds: this.SALT_ROUNDS 
      })

      const hashedPassword = await bcrypt.hash(plainPassword, this.SALT_ROUNDS)
      
      logger.debug('Contraseña hasheada exitosamente')
      return hashedPassword

    } catch (error) {
      logger.error('Error al hashear contraseña', { 
        error: error.message 
      })
      throw new Error(`Error al hashear contraseña: ${error.message}`)
    }
  }

  /**
   * Verifica si una contraseña en texto plano coincide con el hash
   * @param {string} plainPassword - Contraseña en texto plano
   * @param {string} hashedPassword - Contraseña hasheada
   * @returns {Promise<boolean>} - true si coinciden, false si no
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      if (!plainPassword || !hashedPassword) {
        logger.debug('Verificación de contraseña fallida: parámetros faltantes')
        return false
      }

      if (typeof plainPassword !== 'string' || typeof hashedPassword !== 'string') {
        logger.debug('Verificación de contraseña fallida: tipos inválidos')
        return false
      }

      logger.debug('Verificando contraseña')
      const isMatch = await bcrypt.compare(plainPassword, hashedPassword)
      
      logger.debug('Resultado de verificación de contraseña', { isMatch })
      return isMatch

    } catch (error) {
      logger.error('Error al verificar contraseña', { 
        error: error.message 
      })
      return false
    }
  }

  /**
   * Verifica si una cadena ya está hasheada con bcrypt
   * @param {string} password - Cadena a verificar
   * @returns {boolean} - true si está hasheada, false si no
   */
  static isHashed(password) {
    if (!password || typeof password !== 'string') {
      return false
    }

    // Los hashes de bcrypt empiezan con $2a$, $2b$, $2x$, o $2y$
    const bcryptPattern = /^\$2[abxy]\$\d{2}\$.{53}$/
    return bcryptPattern.test(password)
  }

  /**
   * Valida la fortaleza de una contraseña
   * @param {string} password - Contraseña a validar
   * @returns {Object} - Objeto con resultado de validación
   */
  static validatePasswordStrength(password) {
    const result = {
      isValid: false,
      errors: [],
      score: 0,
      suggestions: []
    }

    if (!password || typeof password !== 'string') {
      result.errors.push('La contraseña es requerida')
      return result
    }

    // Longitud mínima
    if (password.length < 6) {
      result.errors.push('La contraseña debe tener al menos 6 caracteres')
    } else if (password.length >= 8) {
      result.score += 1
    }

    // Contiene números
    if (/\d/.test(password)) {
      result.score += 1
    } else {
      result.suggestions.push('Incluye al menos un número')
    }

    // Contiene letras minúsculas
    if (/[a-z]/.test(password)) {
      result.score += 1
    } else {
      result.suggestions.push('Incluye al menos una letra minúscula')
    }

    // Contiene letras mayúsculas
    if (/[A-Z]/.test(password)) {
      result.score += 1
    } else {
      result.suggestions.push('Incluye al menos una letra mayúscula')
    }

    // Contiene caracteres especiales
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      result.score += 1
    } else {
      result.suggestions.push('Incluye al menos un carácter especial')
    }

    // No contiene espacios
    if (/\s/.test(password)) {
      result.errors.push('La contraseña no debe contener espacios')
    }

    result.isValid = result.errors.length === 0 && result.score >= 2
    
    return result
  }
}

export default PasswordUtils 