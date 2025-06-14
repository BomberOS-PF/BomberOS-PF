/**
 * Value Object para Nombre Completo
 * Inmutable y con validaciones de dominio
 */
export class NombreCompleto {
  constructor(nombreCompleto) {
    const parsed = this._parseNombre(nombreCompleto)
    this._nombre = parsed.nombre
    this._apellido = parsed.apellido
    this._value = `${this._nombre} ${this._apellido}`
    Object.freeze(this) // Inmutable
  }

  _parseNombre(nombreCompleto) {
    if (!nombreCompleto || typeof nombreCompleto !== 'string') {
      throw new Error('Nombre completo es requerido y debe ser un string')
    }

    const trimmedNombre = nombreCompleto.trim()
    
    if (trimmedNombre.length < 3) {
      throw new Error('Nombre completo debe tener al menos 3 caracteres')
    }

    // Separar nombre y apellido
    const parts = trimmedNombre.split(' ').filter(part => part.length > 0)
    
    if (parts.length < 2) {
      throw new Error('Debe proporcionar nombre y apellido')
    }

    const nombre = parts[0]
    const apellido = parts.slice(1).join(' ')

    // Validar cada parte
    if (nombre.length < 2) {
      throw new Error('Nombre debe tener al menos 2 caracteres')
    }

    if (apellido.length < 2) {
      throw new Error('Apellido debe tener al menos 2 caracteres')
    }

    // Validar caracteres válidos (solo letras, espacios, acentos y guiones)
    const validNameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-']+$/
    if (!validNameRegex.test(trimmedNombre)) {
      throw new Error('Nombre solo puede contener letras, espacios, acentos y guiones')
    }

    return {
      nombre: this._capitalize(nombre),
      apellido: this._capitalize(apellido)
    }
  }

  _capitalize(str) {
    return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }

  get nombre() {
    return this._nombre
  }

  get apellido() {
    return this._apellido
  }

  get value() {
    return this._value
  }

  toString() {
    return this._value
  }

  equals(other) {
    return other instanceof NombreCompleto && this._value === other._value
  }
} 