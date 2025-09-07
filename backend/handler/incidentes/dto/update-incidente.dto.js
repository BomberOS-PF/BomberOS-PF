export function updateIncidenteDto(data) {
  const resultado = {}

  // Campos que se pueden actualizar directamente
  if (data.idTipoIncidente !== undefined) {
    resultado.idTipoIncidente = data.idTipoIncidente
  }
  
  if (data.fecha !== undefined) {
    resultado.fecha = data.fecha
  }
  
  if (data.descripcion !== undefined) {
    resultado.descripcion = data.descripcion
  }

  // Solo manejar idLocalizacion (campo correcto de la BD)
  if (data.idLocalizacion !== undefined) {
    resultado.idLocalizacion = data.idLocalizacion
  }

  if (Object.keys(resultado).length === 0) {
    throw new Error('No se enviaron campos válidos para actualizar')
  }

  return resultado
}
