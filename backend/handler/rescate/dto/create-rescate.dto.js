// backend/rescate/dto/create-rescate.dto.js

export function crearRescateDto(body) {
  if (!body.idIncidente) {
    throw new Error('El id del incidente es obligatorio')
  }

  // Validar lugar (ahora es un ID numérico)
  if (!body.lugar) {
    throw new Error('Debe especificar el lugar del rescate')
  }

  // Si lugar es 99 (Otro), validar que otroLugar esté presente
  if (Number(body.lugar) === 99 && (!body.otroLugar || body.otroLugar.trim() === '')) {
    throw new Error('Debe especificar el tipo de lugar cuando selecciona "Otro"')
  }

  return {
    idIncidente: Number(body.idIncidente),
    descripcion: body.detalle?.trim() || null,
    lugar: Number(body.lugar),
    otroLugar: body.otroLugar?.trim() || null,
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
