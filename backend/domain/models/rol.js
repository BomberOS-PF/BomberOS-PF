export class Rol {
  constructor(data) {
    this.id = data.id || data.idRol || null
    this.nombreRol = this.validateNombre(data.nombreRol)
    this.descripcion = this.validateDescripcion(data.descripcion)
  }

  validateNombre(nombre) {
    if (!nombre || typeof nombre !== 'string' || nombre.trim().length < 2) {
      return 'Sin nombre'
    }
    return nombre.trim()
  }

  validateDescripcion(desc) {
    if (!desc || typeof desc !== 'string') {
      return ''
    }
    return desc.trim()
  }

  toPlainObject() {
    return {
      id: this.id,
      nombreRol: this.nombreRol,
      descripcion: this.descripcion
    }
  }

  static fromDatabase(data) {
    return new Rol({
      id: data.idRol,
      nombreRol: data.nombreRol,
      descripcion: data.descripcion
    })
  }
}
