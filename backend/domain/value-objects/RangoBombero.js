export class RangoBombero {
  static RANGOS_VALIDOS = [
    'Bombero',
    'Cabo', 
    'Sargento',
    'Subteniente',
    'Teniente',
    'Oficial'
  ]

  constructor(value) {
    this.value = this.validate(value)
  }

  validate(rango) {
    if (!rango || typeof rango !== 'string') {
      throw new Error('Rango es requerido')
    }

    if (!RangoBombero.RANGOS_VALIDOS.includes(rango)) {
      throw new Error(`Rango inválido. Debe ser uno de: ${RangoBombero.RANGOS_VALIDOS.join(', ')}`)
    }

    return rango
  }

  toString() {
    return this.value
  }

  equals(other) {
    return other instanceof RangoBombero && this.value === other.value
  }

  // Métodos de dominio
  esOficial() {
    return ['Subteniente', 'Teniente', 'Oficial'].includes(this.value)
  }

  esSuboficial() {
    return ['Cabo', 'Sargento'].includes(this.value)
  }

  esBomberoRaso() {
    return this.value === 'Bombero'
  }

  puedeComandor() {
    return this.esOficial()
  }
} 