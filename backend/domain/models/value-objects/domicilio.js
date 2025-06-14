/**
 * Value Object para Domicilio
 * Inmutable y con validaciones de dominio
 */
export class Domicilio {
  constructor(value) {
    this._value = this._validate(value)
    Object.freeze(this) // Inmutable
  }

  _validate(domicilio) {
    if (!domicilio || typeof domicilio !== 'string') {
      throw new Error('Domicilio es requerido y debe ser un string')
    }

    const trimmedDomicilio = domicilio.trim()
    
    if (trimmedDomicilio.length === 0) {
      throw new Error('Domicilio no puede estar vacío')
    }

    if (trimmedDomicilio.length < 5) {
      throw new Error('Domicilio debe tener al menos 5 caracteres')
    }

    if (trimmedDomicilio.length > 200) {
      throw new Error('Domicilio no puede exceder 200 caracteres')
    }

    // Validar caracteres básicos
    const validAddressRegex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-\.,#°º]+$/
    if (!validAddressRegex.test(trimmedDomicilio)) {
      throw new Error('Domicilio contiene caracteres no válidos')
    }

    return trimmedDomicilio
  }

  get value() {
    return this._value
  }

  toString() {
    return this._value
  }

  equals(other) {
    return other instanceof Domicilio && this._value === other._value
  }
} 