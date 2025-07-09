export function crearAccidenteTransitoDto(data) {
  if (!data.idIncidente) {
    throw new Error('Falta el ID del incidente')
  }

  if (!data.descripcion || typeof data.descripcion !== 'string') {
    throw new Error('La descripción es requerida y debe ser un texto')
  }

  // Validación de vehículos
  if (!Array.isArray(data.vehiculos) || data.vehiculos.length === 0) {
    throw new Error('Debe incluir al menos un vehículo involucrado')
  }

  // Validación opcional de causa del accidente
  const idCausaAccidente = data.idCausaAccidente
    ? parseInt(data.idCausaAccidente)
    : null

  // Damnificados (opcional)
  const damnificados = Array.isArray(data.damnificados)
    ? data.damnificados.map((d) => ({
        nombre: d.nombre || null,
        apellido: d.apellido || null,
        domicilio: d.domicilio || null,
        telefono: d.telefono || null,
        dni: d.dni || null,
        fallecio: d.fallecio === true
      }))
    : []

  return {
    idIncidente: data.idIncidente,
    descripcion: data.descripcion,
    idCausaAccidente,
    vehiculos: data.vehiculos.map((v) => ({
      tipo: v.tipo || null,
      dominio: v.dominio || null,
      cantidad: parseInt(v.cantidad) || 1,
      modelo: v.modelo || null,
      anio: v.anio || null,
      aseguradora: v.aseguradora || null,
      poliza: v.poliza || null
    })),
    damnificados
  }
}
