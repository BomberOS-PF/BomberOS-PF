export class Incidente {
  constructor({ idIncidente, dni, idTipoIncidente, fecha, idDenunciante, idLocalizacion, descripcion, bomberoNombre }) {
    this.idIncidente = idIncidente
    this.dni = dni
    this.idTipoIncidente = idTipoIncidente
    this.fecha = fecha
    this.idDenunciante = idDenunciante
    this.idLocalizacion = idLocalizacion
    this.descripcion = descripcion
    this.bomberoNombre = bomberoNombre
  }

  toPlainObject() {
    return {
      idIncidente: this.idIncidente,
      dni: this.dni,
      idTipoIncidente: this.idTipoIncidente,
      fecha: this.fecha,
      idDenunciante: this.idDenunciante,
      idLocalizacion: this.idLocalizacion,
      descripcion: this.descripcion,
      bomberoNombre: this.bomberoNombre
    }
  }
}
