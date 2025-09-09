export function crearMaterialPeligrosoDto(body) {
  if (!body) {
    throw new Error('El cuerpo de la petición está vacío')
  }

  const idIncidente = Number(body.idIncidente)
  if (!idIncidente || isNaN(idIncidente)) {
    throw new Error('El idIncidente es obligatorio y debe ser un número válido')
  }

  const categoria = Number(body.idCategoria || body.categoria)
  if (!categoria || isNaN(categoria)) {
    throw new Error('La categoría es obligatoria y debe ser un número válido')
  }

  const cantidadMateriales = Number(body.cantidadMateriales)
  if (isNaN(cantidadMateriales) || cantidadMateriales < 0) {
    throw new Error('La cantidad de materiales debe ser un número mayor o igual a 0')
  }

  // Arrays
  const tiposMateriales = Array.isArray(body.tiposMateriales) ? body.tiposMateriales.map(Number) : []
  const accionesMaterial = Array.isArray(body.accionesMaterial) ? body.accionesMaterial.map(Number) : []
  const accionesPersona = Array.isArray(body.accionesPersona) ? body.accionesPersona.map(Number) : []

  return {
    idIncidente,
    categoria, // 👈 ahora coincide con la columna
    cantidadMatInvolucrado: cantidadMateriales, // 👈 mapear al nombre correcto de la columna
    otraAccionMaterial: body.otraAccionMaterial ?? null,
    otraAccionPersona: body.otraAccionPersona ?? null,
    detalleOtrasAccionesPersona: body.detalleOtrasAccionesPersona ?? null,
    cantidadSuperficieEvacuada: body.cantidadSuperficieEvacuada ?? null,
    detalle: body.detalle ?? null,
    tiposMateriales,
    accionesMaterial,
    accionesPersona,
    damnificados: body.damnificados || []
  }
}
