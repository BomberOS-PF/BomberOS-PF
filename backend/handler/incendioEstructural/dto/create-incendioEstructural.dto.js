export function crearIncendioEstructuralDto(data) {
  if (!data.idIncidente) {
    throw new Error('Falta el ID del incidente')
  }

  if (!data.descripcion || typeof data.descripcion !== 'string') {
    throw new Error('La descripción es requerida y debe ser un texto')
  }

  // Mapeos de texto -> IDs
  const tipoTechoMap = {
    "Chapa aislada": 1,
    "Chapa metálica": 2,
    "Madera/paja": 3,
    "Teja": 4,
    "Yeso": 5,
    "Otro": 99
  }

  const tipoAberturaMap = {
    "Acero/Hierro": 1,
    "Aluminio": 2,
    "Madera": 3,
    "Plástico": 4,
    "Otro": 99
  }

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

  // DTO final
  return {
    idIncidente: Number(data.idIncidente),
    tipoTecho: tipoTechoMap[data.tipoTecho] || null,
    tipoAbertura: tipoAberturaMap[data.tipoAbertura] || null,
    descripcion: data.descripcion,
    superficie: data.superficie || null,
    cantPisos: data.cantPisos || null,
    cantAmbientes: data.cantAmbientes || null,
    damnificados
  }
}
