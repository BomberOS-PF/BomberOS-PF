export class Rol {
  constructor(data) {
    this.idRol = data.idRol || data.id || null
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
      idRol: this.idRol,
      nombreRol: this.nombreRol,
      descripcion: this.descripcion
    }
  }

  static fromDatabase(data) {
    if (!data) throw new Error('No se puede crear Rol desde datos vacíos')
    return new Rol({
      idRol: data.idRol,
      nombreRol: data.nombreRol,
      descripcion: data.descripcion
    })
  }
}
