export default class Rol {
  constructor({ idRol, nombreRol, descripcion }) {
    if (!nombreRol || typeof nombreRol !== 'string' || nombreRol.trim().length < 3) {
      throw new Error('El nombre del rol es requerido y debe tener al menos 3 caracteres')
    }

    this.idRol = idRol
    this.nombreRol = nombreRol.trim()
    this.descripcion = descripcion?.trim() || ''
  }

  toPlainObject() {
    return {
      idRol: this.idRol,
      nombreRol: this.nombreRol,
      descripcion: this.descripcion
    }
  }
}
