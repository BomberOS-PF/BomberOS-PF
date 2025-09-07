export function crearIncendioForestalDto(data) {
  // Si es una actualización (tiene idIncidente), algunos campos pueden ser opcionales
  const esActualizacion = !!data.idIncidente
  
  if (!esActualizacion) {
    // Para nuevos incidentes, validar campos obligatorios
    if (!data.caracteristicasLugar || !data.areaAfectada) {
      throw new Error('Faltan datos obligatorios para incendio forestal')
    }
    if (!data.fecha || !data.idLocalizacion || !data.descripcion) {
      throw new Error('Faltan datos obligatorios del incidente')
    }
  } else {
    // Para actualizaciones, solo validar que existan los datos específicos del incendio forestal
    if (!data.caracteristicasLugar && !data.areaAfectada && !data.detalle) {
      throw new Error('Debe proporcionar al menos un dato específico del incendio forestal')
    }
  }
  
  return {
    idIncidente: data.idIncidente || null,
    fecha: data.fecha,
    idLocalizacion: data.idLocalizacion,
    descripcion: data.descripcion,
    caracteristicasLugar: data.caracteristicasLugar,
    areaAfectada: data.areaAfectada,
    cantidadAfectada: data.cantidadAfectada,
    causaProbable: data.causaProbable,
    detalle: data.detalle || data.descripcion, // Usar detalle específico si existe, sino la descripción
    damnificados: Array.isArray(data.damnificados) ? data.damnificados : []
  }
} 