export function crearAccidenteTransitoDto(data) {
  if (!data.idIncidente) {
    throw new Error('Falta el ID del incidente')
  }

  if (!data.detalle || typeof data.detalle !== 'string') {
    throw new Error('El detalle es requerido y debe ser un texto')
  }

  // Validación de vehículos
  if (!Array.isArray(data.vehiculos) || data.vehiculos.length === 0) {
    throw new Error('Debe incluir al menos un vehículo involucrado')
  }

  // Validación de damnificados (opcional)
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
    detalle: data.detalle,
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
