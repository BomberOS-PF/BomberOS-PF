// Configuración de URLs de la API
const API_BASE_URL = 'http://localhost:3000/api'

export const API_URLS = {
  // Bomberos
  bomberos: {
    getAll: `${API_BASE_URL}/bomberos`,
    getById: (id) => `${API_BASE_URL}/bomberos/${id}`,
    create: `${API_BASE_URL}/bomberos`,
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
    authenticate: `${API_BASE_URL}/usuarios/auth`
  },
  
  // Roles
  roles: {
    getAll: `${API_BASE_URL}/roles`
  },

  // Health check
  health: 'http://localhost:3000/health'
}

// Configuración de headers por defecto
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}

// Función helper para hacer peticiones
export const apiRequest = async (url, options = {}) => {
  const config = {
    headers: DEFAULT_HEADERS,
    ...options
  }

  try {
    console.log(`🌐 API Request: ${config.method || 'GET'} ${url}`)
    const response = await fetch(url, config)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    console.log(`✅ API Response:`, data)
    return data
  } catch (error) {
    console.error(`❌ API Error:`, error)
    throw error
  }
} 