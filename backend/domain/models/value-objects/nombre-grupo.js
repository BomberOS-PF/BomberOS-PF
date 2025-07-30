export class NombreGrupo {
  constructor(valor) {
    if (!valor || typeof valor !== 'string') {
      throw new Error('El nombre del grupo debe ser una cadena de texto')
    }

    const nombre = valor.trim()

    if (nombre.length < 3) {
      throw new Error('El nombre del grupo debe tener al menos 3 caracteres')
    }

    if (nombre.length > 20) {
      throw new Error('El nombre del grupo no puede exceder los 100 caracteres')
    }

    const regex = /^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ\-_.()]+$/
    if (!regex.test(nombre)) {
      throw new Error('El nombre del grupo contiene caracteres no permitidos')
    }

    this._valor = nombre
  }

  get valor() {
    return this._valor
  }

  toString() {
    return this._valor
  }
}

