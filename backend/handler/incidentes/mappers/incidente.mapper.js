export function mapToIncidenteResponse(incidente) {
  return {
    idIncidente: incidente.idIncidente,
    dni: incidente.dni,
    idTipoIncidente: incidente.idTipoIncidente,
    fecha: incidente.fecha,
    idDenunciante: incidente.idDenunciante,
    idLocalizacion: incidente.idLocalizacion,
    descripcion: incidente.descripcion
  }
}
