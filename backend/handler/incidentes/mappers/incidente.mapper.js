export function mapToIncidenteResponse(incidente) {
  return {
    success: true,
    data: {
      idIncidente: incidente.idIncidente,
      dni: incidente.dni,
      idTipoIncidente: incidente.idTipoIncidente,
      fecha: incidente.fecha,
      idDenunciante: incidente.idDenunciante,
      idLocalizacion: incidente.idLocalizacion,
      localizacion: incidente.localizacion, // Incluir localizacion para el frontend
      descripcion: incidente.descripcion
    }
  }
}
