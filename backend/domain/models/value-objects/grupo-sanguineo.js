/**
 * Value Object para Grupo Sanguíneo
 * Inmutable y con validaciones de dominio
 */
export class GrupoSanguineo {
  constructor(value) {
    this._value = this._validate(value)
    Object.freeze(this) // Inmutable
  }

  _validate(grupoSanguineo) {
    if (!grupoSanguineo || typeof grupoSanguineo !== 'string') {
      throw new Error('Grupo sanguíneo es requerido y debe ser un string')
    }

    const trimmedGrupo = grupoSanguineo.trim().toUpperCase()
    
    if (trimmedGrupo.length === 0) {
      throw new Error('Grupo sanguíneo no puede estar vacío')
    }

    const gruposValidos = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

    if (!gruposValidos.includes(trimmedGrupo)) {
      throw new Error(`Grupo sanguíneo inválido. Debe ser uno de: ${gruposValidos.join(', ')}`)
    }

    return trimmedGrupo
  }

  get value() {
    return this._value
  }

  toString() {
    return this._value
  }

  equals(other) {
    return other instanceof GrupoSanguineo && this._value === other._value
  }
} 