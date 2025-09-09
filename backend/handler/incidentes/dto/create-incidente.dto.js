export function crearIncidenteDto(data) {
  if (!data.idTipoIncidente || !data.fecha || !data.idLocalizacion || !data.descripcion) {
    throw new Error('Faltan datos obligatorios para crear el incidente')
  }

  // Soportá ambas formas: objeto {denunciante} o campos aplanados *Denunciante
  const den = data.denunciante && typeof data.denunciante === 'object'
    ? {
        dni: data.denunciante.dni ?? null,
        nombre: data.denunciante.nombre ?? null,
        apellido: data.denunciante.apellido ?? null,
        telefono: data.denunciante.telefono ?? null
      }
    : {
        dni: data.dniDenunciante ?? null,
        nombre: data.nombreDenunciante ?? null,
        apellido: data.apellidoDenunciante ?? null,
        telefono: data.telefonoDenunciante ?? null
      }

  const hayDenunciante = !!(den.dni || den.nombre || den.apellido || den.telefono)

  return {
    idTipoIncidente: data.idTipoIncidente,
    fecha: data.fecha,
    idLocalizacion: data.idLocalizacion,
    descripcion: data.descripcion,
    denunciante: hayDenunciante ? den : undefined,     // 👈 ahora viaja al service
    damnificados: Array.isArray(data.damnificados) ? data.damnificados : undefined
  }
}
