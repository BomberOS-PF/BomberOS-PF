// backend/factorClimatico/dto/create-factorClimatico.dto.js

export function crearFactorClimaticoDto(body) {
  // Validar idIncidente
  if (!body.idIncidente) {
    throw new Error('El id del incidente es obligatorio')
  }

  // Validar superficie
  if (!body.superficie || body.superficie.trim() === '') {
    throw new Error('Debe especificar la superficie')
  }

  // Validar cantidad de personas afectadas
  if (
    body.cantidadPersonasAfectadas != null &&
    isNaN(Number(body.cantidadPersonasAfectadas))
  ) {
    throw new Error(
      'La cantidad de personas afectadas debe ser un número válido'
    )
  }

  // Validar damnificados (si existen)
  if (Array.isArray(body.damnificados)) {
    body.damnificados.forEach((dam, index) => {
      if ((dam.nombre || dam.apellido) && !dam.dni) {
        throw new Error(
          `El damnificado #${index + 1} tiene nombre o apellido pero no DNI`
        )
      }
    })
  }

  return {
    idIncidente: Number(body.idIncidente),
    superficie: body.superficie.trim(),
    cantidadPersonasAfectadas: body.cantidadPersonasAfectadas
      ? Number(body.cantidadPersonasAfectadas)
      : 0,
    detalle: body.detalle?.trim() || null,
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
