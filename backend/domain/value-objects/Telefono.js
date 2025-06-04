export class Telefono {
  constructor(value) {
    this.value = this.validate(value)
  }

  validate(telefono) {
    if (!telefono || typeof telefono !== 'string') {
      throw new Error('Teléfono es requerido')
    }

    // Limpiar el teléfono (remover espacios, guiones, paréntesis)
    const cleanTelefono = telefono.replace(/[\s\-\(\)]/g, '')
    
    // Validar que solo contenga números y tenga longitud apropiada
    if (!/^\d{8,15}$/.test(cleanTelefono)) {
      throw new Error('Teléfono debe contener entre 8 y 15 dígitos')
    }

    return cleanTelefono
  }

  toString() {
    return this.value
  }

  equals(other) {
    return other instanceof Telefono && this.value === other.value
  }
} 