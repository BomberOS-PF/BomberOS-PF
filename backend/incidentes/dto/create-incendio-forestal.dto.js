export function crearIncendioForestalDto(data) {
  if (!data.caracteristicasLugar || !data.areaAfectada) {
    throw new Error('Faltan datos obligatorios para incendio forestal')
  }
  if (!data.fecha || !data.idLocalizacion || !data.descripcion) {
    throw new Error('Faltan datos obligatorios del incidente')
  }
  return {
    fecha: data.fecha,
    idLocalizacion: data.idLocalizacion,
    descripcion: data.descripcion,
    caracteristicasLugar: data.caracteristicasLugar,
    areaAfectada: data.areaAfectada,
    cantidadAfectada: data.cantidadAfectada,
    causaProbable: data.causaProbable,
    detalle: data.descripcion, // El detalle va a la tabla forestal
    damnificados: Array.isArray(data.damnificados) ? data.damnificados : []
  }
} 