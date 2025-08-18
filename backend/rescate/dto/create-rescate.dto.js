// backend/rescate/dto/create-rescate.dto.js

export function crearRescateDto(body) {
  if (!body.idIncidente) {
    throw new Error('El id del incidente es obligatorio')
  }

  let lugar = body.lugar
  if (lugar === 'Otro' && body.otroLugar) {
    lugar = body.otroLugar
  }
  if (!lugar || lugar.trim() === '') {
    throw new Error('Debe especificar el lugar del rescate')
  }

  return {
    idIncidente: Number(body.idIncidente),
    descripcion: body.detalle?.trim() || null,
    lugar: lugar?.trim() || null,
    // damnificados se procesa en otro repositorio
    damnificados: Array.isArray(body.damnificados)
      ? body.damnificados.map((d) => ({
          nombre: d.nombre?.trim() || null,
          apellido: d.apellido?.trim() || null,
          domicilio: d.domicilio?.trim() || null,
          telefono: d.telefono?.trim() || null,
          dni: d.dni?.trim() || null,
          fallecio: d.fallecio === true || d.fallecio === 'true'
        }))
      : []
  }
}
