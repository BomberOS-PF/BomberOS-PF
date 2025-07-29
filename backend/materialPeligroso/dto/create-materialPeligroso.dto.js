export function crearMaterialPeligrosoDto(body) {
  if (!body) {
    throw new Error('El cuerpo de la petición está vacío')
  }

  // 🔹 Validaciones de campos obligatorios
  if (!body.idIncidente || isNaN(parseInt(body.idIncidente))) {
    throw new Error('El idIncidente es obligatorio y debe ser un número válido')
  }

  if (!body.idCategoria || isNaN(parseInt(body.idCategoria))) {
    throw new Error('El idCategoria es obligatorio y debe ser un número válido')
  }

  // 🔹 Validar cantidad de materiales (puede ser opcional pero debe ser número >= 0)
  const cantidadMateriales = parseInt(body.cantidadMateriales)
  if (isNaN(cantidadMateriales) || cantidadMateriales < 0) {
    throw new Error('La cantidad de materiales debe ser un número mayor o igual a 0')
  }

  // 🔹 Arrays (relaciones many-to-many)
  const tiposMateriales = Array.isArray(body.tiposMateriales)
    ? body.tiposMateriales.map(id => {
        const parsed = parseInt(id)
        if (isNaN(parsed)) {
          throw new Error(`Tipo de material inválido: ${id}`)
        }
        return parsed
      })
    : []

  const accionesMaterial = Array.isArray(body.accionesMaterial)
    ? body.accionesMaterial.map(id => {
        const parsed = parseInt(id)
        if (isNaN(parsed)) {
          throw new Error(`Acción sobre material inválida: ${id}`)
        }
        return parsed
      })
    : []

  const accionesPersona = Array.isArray(body.accionesPersona)
    ? body.accionesPersona.map(id => {
        const parsed = parseInt(id)
        if (isNaN(parsed)) {
          throw new Error(`Acción sobre persona inválida: ${id}`)
        }
        return parsed
      })
    : []

  // 🔹 Validaciones adicionales opcionales
  if (
    tiposMateriales.length === 0 &&
    accionesMaterial.length === 0 &&
    accionesPersona.length === 0
  ) {
    throw new Error('Debe seleccionar al menos un tipo de material, acción sobre material o acción sobre persona')
  }

  // 🔹 Devolver el DTO final
  return {
    idIncidente: parseInt(body.idIncidente),
    idCategoria: parseInt(body.idCategoria),
    cantidadMateriales: cantidadMateriales || 0,
    otraAccionMaterial: body.otraAccionMaterial?.trim() || null,
    otraAccionPersona: body.otraAccionPersona?.trim() || null,
    detalleOtrasAccionesPersona: body.detalleOtrasAccionesPersona?.trim() || null,
    cantidadSuperficieEvacuada: body.cantidadSuperficieEvacuada?.trim() || null,
    detalle: body.detalle?.trim() || null,

    tiposMateriales,
    accionesMaterial,
    accionesPersona
  }
}
