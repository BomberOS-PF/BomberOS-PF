/**
 * Value Object para Rango de Bombero
 * Inmutable y con validaciones de dominio
 */
export class RangoBombero {
  constructor(nombre, id = null) {
    this._id = id
    this._nombre = this._validate(nombre)
    this._jerarquia = this._getJerarquia(this._nombre)
    Object.freeze(this) // Inmutable
  }

  _validate(nombre) {
    if (!nombre || typeof nombre !== 'string') {
      throw new Error('Nombre del rango es requerido y debe ser un string')
    }

    const trimmedNombre = nombre.trim()
    
    if (trimmedNombre.length === 0) {
      throw new Error('Nombre del rango no puede estar vacío')
    }

    const rangosValidos = [
      'Bombero',
      'Cabo',
      'Sargento',
      'Sargento Primero',
      'Suboficial',
      'Suboficial Principal',
      'Suboficial Mayor',
      'Oficial',
      'Teniente',
      'Capitán',
      'Mayor',
      'Teniente Coronel',
      'Coronel',
      'Jefe'
    ]

    if (!rangosValidos.includes(trimmedNombre)) {
      throw new Error(`Rango inválido. Debe ser uno de: ${rangosValidos.join(', ')}`)
    }

    return trimmedNombre
  }

  _getJerarquia(nombre) {
    const jerarquias = {
      'Bombero': 1,
      'Cabo': 2,
      'Sargento': 3,
      'Sargento Primero': 4,
      'Suboficial': 5,
      'Suboficial Principal': 6,
      'Suboficial Mayor': 7,
      'Oficial': 8,
      'Teniente': 9,
      'Capitán': 10,
      'Mayor': 11,
      'Teniente Coronel': 12,
      'Coronel': 13,
      'Jefe': 14
    }

    return jerarquias[nombre] || 1
  }

  get id() {
    return this._id
  }

  get nombre() {
    return this._nombre
  }

  get jerarquia() {
    return this._jerarquia
  }

  toString() {
    return this._nombre
  }

  equals(other) {
    return other instanceof RangoBombero && this._nombre === other._nombre
  }
} 