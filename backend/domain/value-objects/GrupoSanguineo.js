export class GrupoSanguineo {
  static GRUPOS_VALIDOS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

  constructor(value) {
    this.value = this.validate(value)
  }

  validate(grupo) {
    if (!grupo || typeof grupo !== 'string') {
      throw new Error('Grupo sanguíneo es requerido')
    }

    const grupoLimpio = grupo.trim().toUpperCase()
    if (!GrupoSanguineo.GRUPOS_VALIDOS.includes(grupoLimpio)) {
      throw new Error(`Grupo sanguíneo inválido. Debe ser uno de: ${GrupoSanguineo.GRUPOS_VALIDOS.join(', ')}`)
    }

    return grupoLimpio
  }

  toString() {
    return this.value
  }

  equals(other) {
    return other instanceof GrupoSanguineo && this.value === other.value
  }

  // Métodos de dominio
  esDonadorUniversal() {
    return this.value === 'O-'
  }

  esReceptorUniversal() {
    return this.value === 'AB+'
  }

  puedeDonarA(otroGrupo) {
    const compatibilidad = {
      'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
      'O+': ['O+', 'A+', 'B+', 'AB+'],
      'A-': ['A-', 'A+', 'AB-', 'AB+'],
      'A+': ['A+', 'AB+'],
      'B-': ['B-', 'B+', 'AB-', 'AB+'],
      'B+': ['B+', 'AB+'],
      'AB-': ['AB-', 'AB+'],
      'AB+': ['AB+']
    }

    return compatibilidad[this.value]?.includes(otroGrupo.toString()) || false
  }
} 