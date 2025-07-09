export function crearIncidenteDto(data) {
  if (!data.idTipoIncidente || !data.fecha || !data.idLocalizacion || !data.descripcion) {
    throw new Error('Faltan datos obligatorios para crear el incidente')
  }

  const dto = {
    idTipoIncidente: data.idTipoIncidente,
    fecha: data.fecha,
    idLocalizacion: data.idLocalizacion,
    descripcion: data.descripcion
  }

  return dto
}
