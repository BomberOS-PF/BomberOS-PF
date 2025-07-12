export class Incidente {
  constructor({ idIncidente, idTipoIncidente, fecha, idLocalizacion, descripcion }) {
    this.idIncidente = idIncidente
    this.idTipoIncidente = idTipoIncidente
    this.fecha = fecha
    this.idLocalizacion = idLocalizacion
    this.descripcion = descripcion
  }

  toPlainObject() {
    return {
      idIncidente: this.idIncidente,
      idTipoIncidente: this.idTipoIncidente,
      fecha: this.fecha,
      idLocalizacion: this.idLocalizacion,
      descripcion: this.descripcion
    }
  }
}
