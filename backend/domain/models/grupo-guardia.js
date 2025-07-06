/**
 * Entidad de dominio GrupoGuardia
 */
export class GrupoGuardia {
  constructor(data) {
    this._id = data.id || data.idGrupo || null
    this._nombre = this._validateNombre(data.nombre || data.nombreGrupo)
    this._bomberos = this._validateBomberos(data.bomberos)
  }

  static create(data) {
    return new GrupoGuardia(data)
  }

  get id() {
    return this._id
  }

  get nombre() {
    return this._nombre
  }

  get bomberos() {
    return this._bomberos
  }

  agregarBombero(dni) {
    if (!this._bomberos.includes(dni)) {
      this._bomberos.push(dni)
    }
  }

  quitarBombero(dni) {
    this._bomberos = this._bomberos.filter(b => b !== dni)
  }

  // Para persistencia en base de datos
  toDatabase() {
    return {
      idGrupo: this._id,
      nombreGrupo: this._nombre,
      bomberos: this._bomberos // Se usará en tabla intermedia
    }
  }

  // Para respuestas API
  toJSON() {
    return {
      idGrupo: this._id,
      nombreGrupo: this._nombre,
      bomberos: this._bomberos
    }
  }

  // Validaciones internas
  _validateNombre(nombre) {
    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
      throw new Error('El nombre del grupo es requerido y debe ser un string')
    }
    return nombre.trim()
  }

  _validateBomberos(bomberos) {
    if (!Array.isArray(bomberos)) {
      throw new Error('La lista de bomberos debe ser un array')
    }
    for (const dni of bomberos) {
      if (typeof dni !== 'number') {
        throw new Error('Cada bombero debe tener un DNI numérico')
      }
    }
    return bomberos
  }
}
