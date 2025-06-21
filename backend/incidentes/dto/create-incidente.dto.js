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

  if (data.denunciante) {
    const { nombre, apellido, telefono, dni } = data.denunciante

    const hayDatosDenunciante = nombre || apellido || telefono || dni
    if (hayDatosDenunciante) {
      dto.denunciante = {
        nombre: nombre || null,
        apellido: apellido || null,
        telefono: telefono || null,
        dni: dni || null
      }
    }
  }

  return dto
}
