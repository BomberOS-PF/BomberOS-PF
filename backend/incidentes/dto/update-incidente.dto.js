export function updateIncidenteDto(data) {
  const camposPermitidos = ['idTipoIncidente', 'fecha', 'idDenunciante', 'idLocalizacion', 'descripcion']
  const resultado = {}

  for (const campo of camposPermitidos) {
    if (data[campo] !== undefined) {
      resultado[campo] = data[campo]
    }
  }

  if (Object.keys(resultado).length === 0) {
    throw new Error('No se enviaron campos válidos para actualizar')
  }

  return resultado
}
