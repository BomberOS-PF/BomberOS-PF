// Config API
const API_BASE_URL = 'http://localhost:3000/api'

export const API_URLS = {
  // Bomberos
  bomberos: {
    getAll: `${API_BASE_URL}/bomberos`,
    buscar: `${API_BASE_URL}/bomberos/buscar`,
    getById: (id) => `${API_BASE_URL}/bomberos/${id}`,
    create: `${API_BASE_URL}/bomberos`,
    createFull: `${API_BASE_URL}/bomberos/full`,
    update: (id) => `${API_BASE_URL}/bomberos/${id}`,
    delete: (id) => `${API_BASE_URL}/bomberos/${id}`,
    getPlan: `${API_BASE_URL}/bomberos/plan`
  },

  // Usuarios
  usuarios: {
    getAll: `${API_BASE_URL}/usuarios`,
    getById: (id) => `${API_BASE_URL}/usuarios/${id}`,
    create: `${API_BASE_URL}/usuarios`,
    update: (id) => `${API_BASE_URL}/usuarios/${id}`,
    delete: (id) => `${API_BASE_URL}/usuarios/${id}`,
    getByRol: (rol) => `${API_BASE_URL}/usuarios/rol/${rol}`,
    authenticate: `${API_BASE_URL}/usuarios/auth`,
    libresBombero: `${API_BASE_URL}/usuarios/bomberos/libres`
  },

  // Grupos
  grupos: {
    create: `${API_BASE_URL}/grupos`,
    buscar: `${API_BASE_URL}/grupos/buscar`,
    delete: (id) => `${API_BASE_URL}/grupos/${id}`,
    obtenerBomberosDelGrupo: (id) => `${API_BASE_URL}/grupos/${id}/bomberos`,
    update: (id) => `${API_BASE_URL}/grupos/${id}`,
    guardias: {
      crear: (idGrupo) => `${API_BASE_URL}/grupos/${idGrupo}/guardias`,
      listar: (idGrupo, start, end) =>
        `${API_BASE_URL}/grupos/${idGrupo}/guardias?start=${start}&end=${end}`,
      eliminar: (idGrupo) => `${API_BASE_URL}/grupos/${idGrupo}/guardias`,
      // opcional
      reemplazarDia: (idGrupo) => `${API_BASE_URL}/grupos/${idGrupo}/guardias/dia`
    }
  },

  // Roles
  roles: {
    getAll: `${API_BASE_URL}/roles`,
    getById: (id) => `${API_BASE_URL}/roles/${id}`,
    create: `${API_BASE_URL}/roles`,
    update: (id) => `${API_BASE_URL}/roles/${id}`,
    delete: (id) => `${API_BASE_URL}/roles/${id}`
  },

  // Rangos
  rangos: {
    getAll: `${API_BASE_URL}/rangos`
  },

  // Incidentes
  incidentes: {
    create: `${API_BASE_URL}/incidentes`,
    getAll: `${API_BASE_URL}/incidentes`,
    getById: (id) => `${API_BASE_URL}/incidentes/${id}`,
    createIncendioForestal: `${API_BASE_URL}/incidentes/incendio-forestal`,
    createFactorClimatico: `${API_BASE_URL}/factor-climatico`,
    createIncendioEstructural: `${API_BASE_URL}/incendio-estructural`,
    createMaterialPeligroso: `${API_BASE_URL}/materiales-peligrosos`,
    createRescate: `${API_BASE_URL}/rescate`
  },

  categoriasMaterialPeligroso: `${API_BASE_URL}/categorias-material-peligroso`,
  tiposMaterialesInvolucrados: `${API_BASE_URL}/tipos-materiales-involucrados`,
  accionesMaterial: `${API_BASE_URL}/acciones-material`,
  accionesPersona: `${API_BASE_URL}/acciones-persona`,
  caracteristicasLugar: `${API_BASE_URL}/caracteristicas-lugar`,
  areasAfectadas: `${API_BASE_URL}/areas-afectadas`,
  tiposIncidente: `${API_BASE_URL}/tipos-incidente`,
  localizaciones: `${API_BASE_URL}/localizaciones`,
  causasProbables: `${API_BASE_URL}/causas-probables`,
  recuperarClave: `${API_BASE_URL}/recuperar-clave`,

  // Health check
  health: 'http://localhost:3000/health'
}

// Headers por defecto
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

// Helper fetch robusto
export const apiRequest = async (url, options = {}) => {
  const config = {
    headers: DEFAULT_HEADERS,
    ...options
  }

  try {
    const response = await fetch(url, config)

    // 204 No Content
    if (response.status === 204) {
      return { success: true, data: null }
    }

    // Intentar texto y luego parsear JSON si corresponde
    const raw = await response.text()
    let data = null
    try {
      data = raw ? JSON.parse(raw) : null
    } catch {
      // si no es JSON, dejamos data como null y seguimos
    }

    if (!response.ok) {
      const error = new Error(
        (data && (data.error || data.message)) || `Error en la solicitud (${response.status})`
      )
      error.status = response.status
      error.response = data || raw
      throw error
    }

    // Devolver lo que haya: objeto JSON o texto
    return data ?? { success: true, data: raw }
  } catch (error) {
    console.error('❌ API Error:', error)
    throw error
  }
}
