/**
 * Value Object para Teléfono
 * Inmutable y con validaciones de dominio
 */
export class Telefono {
  constructor(value) {
    this._value = this._validate(value)
    Object.freeze(this) // Inmutable
  }

  _validate(telefono) {
    if (!telefono || typeof telefono !== 'string') {
      throw new Error('Teléfono es requerido y debe ser un string')
    }

    // Remover espacios, guiones y paréntesis
    const cleanedTelefono = telefono.replace(/[\s\-\(\)]/g, '')
    
    if (cleanedTelefono.length === 0) {
      throw new Error('Teléfono no puede estar vacío')
    }

    // Validar que solo contenga números y el símbolo +
    if (!/^[\+]?[0-9]+$/.test(cleanedTelefono)) {
      throw new Error('Teléfono debe contener solo números y opcionalmente el símbolo +')
    }

    // Validar longitud (mínimo 8 dígitos, máximo 15) - ajustado para datos existentes
    const numbersOnly = cleanedTelefono.replace(/\+/g, '')
    if (numbersOnly.length < 8 || numbersOnly.length > 15) {
      throw new Error('Teléfono debe tener entre 8 y 15 dígitos')
    }

    return cleanedTelefono
  }

  get value() {
    return this._value
  }

  toString() {
    return this._value
  }

  equals(other) {
    return other instanceof Telefono && this._value === other._value
  }
} 