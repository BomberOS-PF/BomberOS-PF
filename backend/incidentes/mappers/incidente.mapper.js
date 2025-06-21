export function mapToIncidenteResponse(incidente) {
  return {
    idIncidente: incidente.idIncidente,
    DNI: incidente.DNI,
    idTipoIncidente: incidente.idTipoIncidente,
    fecha: incidente.fecha,
    idDenunciante: incidente.idDenunciante,
    idLocalizacion: incidente.idLocalizacion,
    descripcion: incidente.descripcion,

    tipoIncidente: incidente.tipoIncidenteNombre || null,
    localizacion: incidente.localizacionDescripcion || null,
    bomberoNombre: incidente.bomberoNombre || null,
    denunciante: incidente.denunciante || null
  }
}
