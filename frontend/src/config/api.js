const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  if (import.meta.env.PROD) {
    return 'https://bomberos-pf.onrender.com/api'
  }
  
  return '/api'
}

const API_BASE_URL = getApiBaseUrl()

/**
 * @param {string} path - Ruta del endpoint (ej: '/incidentes' o 'incidentes' o '/api/incidentes')
 * @returns {string} URL completa para fetch
 */
export const buildApiUrl = (path) => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  
  let cleanPath = path
  if (cleanPath.startsWith('/api/')) {
    cleanPath = cleanPath.substring(5)
  } else if (cleanPath.startsWith('api/')) {
    cleanPath = cleanPath.substring(4)
  }
  
  if (cleanPath.startsWith('/')) {
    cleanPath = cleanPath.substring(1)
  }
  
  if (import.meta.env.PROD) {
    return `${API_BASE_URL}/${cleanPath}`
  }
  
  return `/api/${cleanPath}`
}

const toQS = (params) => {
  if (!params || Object.keys(params).length === 0) return ''
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value)
    }
  })
  const qs = searchParams.toString()
  return qs ? `?${qs}` : ''
}

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

    // Guardias (consulta por usuario/DNI para el CalendarioGuardias)
 guardias: {
   // Ajustá la ruta si tu backend usa otro path
  // Ejemplo con query params:
  //   GET /api/guardias/por-dni?dni=12345678&start=YYYY-MM-DD&end=YYYY-MM-DD
  porDni: (dni, start, end) =>
     `${API_BASE_URL}/guardias/por-dni?dni=${encodeURIComponent(dni)}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`

   // Si en tu backend la ruta es distinta, dejá una de estas variantes y borra la otra:
   // porDni: (dni, start, end) => `${API_BASE_URL}/guardias?dni=${dni}&start=${start}&end=${end}`,
   // porDni: (dni, start, end) => `${API_BASE_URL}/usuarios/${dni}/guardias?start=${start}&end=${end}`,
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
    getDetalle: (id) => `${API_BASE_URL}/incidentes/${id}/detalle`,
    update: (id) => `${API_BASE_URL}/incidentes/${id}`,
    listar: params => `${API_BASE_URL}/incidentes${toQS(params)}`,
    
    // Tipos específicos de incidente - CREATE
    createAccidenteTransito: `${API_BASE_URL}/accidentes`,
    createFactorClimatico: `${API_BASE_URL}/factor-climatico`,
    createIncendioEstructural: `${API_BASE_URL}/incendio-estructural`,
    createIncendioForestal: `${API_BASE_URL}/incidentes/incendio-forestal`,
    createMaterialPeligroso: `${API_BASE_URL}/materiales-peligrosos`,
    createRescate: `${API_BASE_URL}/rescate`,
    
    // Tipos específicos de incidente - UPDATE
    updateAccidenteTransito: `${API_BASE_URL}/incidentes/accidente-transito`,
    updateFactorClimatico: `${API_BASE_URL}/incidentes/factor-climatico`,
    updateIncendioEstructural: `${API_BASE_URL}/incidentes/incendio-estructural`,
    updateIncendioForestal: `${API_BASE_URL}/incidentes/incendio-forestal`,
    updateMaterialPeligroso: `${API_BASE_URL}/incidentes/material-peligroso`,
    updateRescate: `${API_BASE_URL}/incidentes/rescate`,
    
    // Detalles por tipo
    detallePorTipo: {
      accidenteTransito: (idIncidente) => `${API_BASE_URL}/accidentes/${idIncidente}`,
      factorClimatico: (idIncidente) => `${API_BASE_URL}/factor-climatico/${idIncidente}`,
      incendioEstructural: (idIncidente) => `${API_BASE_URL}/incendio-estructural/${idIncidente}`,
      incendioForestal: (idIncidente) => `${API_BASE_URL}/incendio-forestal/${idIncidente}`,
      materialesPeligrosos: (idIncidente) => `${API_BASE_URL}/materiales-peligrosos/${idIncidente}`,
      rescate: (idIncidente) => `${API_BASE_URL}/rescate/${idIncidente}`
    }
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
  causasAccidente: `${API_BASE_URL}/causa-accidente`,
  recuperarClave: `${API_BASE_URL}/recuperar-clave`,

  // Health check
  health: '/health'
}

// Headers por defecto
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}
export const apiRequest = async (url, options = {}) => {
  const config = {
    headers: DEFAULT_HEADERS,
    ...options
  }

  if (!import.meta.env.PROD) {
    console.log('🌐 API Request:', { url, method: config.method || 'GET' })
  }

  try {
    const response = await fetch(url, config)

    if (!import.meta.env.PROD) {
      console.log(`📊 API Response: ${response.status} ${response.statusText}`)
    }

    if (response.status === 204) {
      return { success: true, data: null }
    }

    const raw = await response.text()
    
    if (!raw || raw.trim().length === 0) {
      if (!response.ok) {
        throw new Error(`Error ${response.status}: El servidor no devolvió contenido`)
      }
      console.warn('⚠️ Respuesta vacía del servidor')
      return { success: true, data: null }
    }

    let data = null
    try {
      data = JSON.parse(raw)
    } catch (parseError) {
      console.error('❌ Error al parsear JSON:', {
        error: parseError.message,
        raw: raw.substring(0, 200),
        url,
        status: response.status
      })
      
      if (!response.ok) {
        throw new Error(
          `Error ${response.status}: El servidor devolvió una respuesta no válida. ` +
          `Contenido: ${raw.substring(0, 100)}`
        )
      }
      
      return { success: true, data: raw }
    }

    if (!response.ok) {
      const errorMessage = 
        (data && (data.error || data.message)) || 
        `Error en la solicitud (${response.status})`
      
      const error = new Error(errorMessage)
      error.status = response.status
      error.response = data
      throw error
    }

    return data
  } catch (error) {
    if (!import.meta.env.PROD) {
      console.error('❌ API Error completo:', {
        message: error.message,
        url,
        method: config.method || 'GET',
        status: error.status
      })
    }
    
    throw error
  }
}