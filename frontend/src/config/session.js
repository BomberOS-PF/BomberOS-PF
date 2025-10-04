export const getUsuarioSesion = () => {
  try {
    const raw = localStorage.getItem('usuario')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const getRol = () => getUsuarioSesion()?.rol || null
export const getDni = () => getUsuarioSesion()?.dni || null
