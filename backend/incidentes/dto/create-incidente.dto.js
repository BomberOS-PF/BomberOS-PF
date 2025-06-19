export function crearIncidenteDto(data) {
  if (!data.DNI || !data.idTipoIncidente || !data.fecha || !data.idLocalizacion || !data.descripcion) {
    throw new Error('Faltan datos obligatorios para crear el incidente')
  }

  const dto = {
    dni: data.DNI,
    idTipoIncidente: data.idTipoIncidente,
    fecha: data.fecha,
    idLocalizacion: data.idLocalizacion,
    descripcion: data.descripcion
  }

  // Solo agregar los campos del denunciante si existen
  if (data.nombreDenunciante || data.apellidoDenunciante || data.telefonoDenunciante || data.dniDenunciante) {
    dto.nombreDenunciante = data.nombreDenunciante || null
    dto.apellidoDenunciante = data.apellidoDenunciante || null
    dto.telefonoDenunciante = data.telefonoDenunciante || null
    dto.dniDenunciante = data.dniDenunciante || null
  }

  return dto
}
