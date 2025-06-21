export const crearRolDTO = (body) => {
  const { nombreRol, descripcion } = body

  if (!nombreRol || typeof nombreRol !== 'string' || nombreRol.trim().length < 3) {
    throw new Error('El nombre del rol es requerido y debe tener al menos 3 caracteres')
  }

  return {
    nombreRol: nombreRol.trim(),
    descripcion: descripcion?.trim() || ''
  }
}

export const actualizarRolDTO = (body) => {
  const { nombreRol, descripcion } = body

  if (!nombreRol || typeof nombreRol !== 'string' || nombreRol.trim().length < 3) {
    throw new Error('El nombre del rol es requerido para actualizar y debe tener al menos 3 caracteres')
  }

  return {
    nombreRol: nombreRol.trim(),
    descripcion: descripcion?.trim() || ''
  }
}
