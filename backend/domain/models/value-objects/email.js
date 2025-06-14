/**
 * Value Object para Email
 * Inmutable y con validaciones de dominio
 */
export class Email {
  constructor(value) {
    this._value = this._validate(value)
    Object.freeze(this) // Inmutable
  }

  _validate(email) {
    if (!email || typeof email !== 'string') {
      throw new Error('Email es requerido y debe ser un string')
    }

    const trimmedEmail = email.trim().toLowerCase()
    
    if (trimmedEmail.length === 0) {
      throw new Error('Email no puede estar vacío')
    }

    // Validación básica de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      throw new Error('Formato de email inválido')
    }

    // Validación de longitud
    if (trimmedEmail.length > 254) {
      throw new Error('Email demasiado largo (máximo 254 caracteres)')
    }

    return trimmedEmail
  }

  get value() {
    return this._value
  }

  toString() {
    return this._value
  }

  equals(other) {
    return other instanceof Email && this._value === other._value
  }
} 