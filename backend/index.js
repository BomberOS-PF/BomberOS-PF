import express from 'express'
import cors from 'cors'
import { DependencyContainer } from './infrastructure/config/DependencyContainer.js'
import { validateBomberoData, validateBomberoUpdateData } from './middlewares/validation.js'
import { AuthService } from './application/services/AuthService.js'

const app = express()
const PORT = process.env.PORT || 3000

// Middlewares
app.use(cors())
app.use(express.json())

// Configurar arquitectura hexagonal
const container = new DependencyContainer()
const bomberosAdapter = container.get('restApiBomberosAdapter')

// Configurar servicio de autenticación
const authService = new AuthService()

// Health check primero
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'BomberOS - ABMC Bomberos con Arquitectura Hexagonal',
    architecture: 'Hexagonal (Ports & Adapters)',
    timestamp: new Date().toISOString()
  })
})

// AUTH - Login real con base de datos
app.post('/login', async (req, res) => {
  try {
    const { usuario, contrasena } = req.body

    const result = await authService.login(usuario, contrasena)
    
    if (result.success) {
      res.json(result)
    } else {
      res.status(401).json(result)
    }
  } catch (error) {
    console.error('Error en login:', error)
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    })
  }
})

// AUTH - Obtener todos los usuarios (para debug/admin)
app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await authService.getAllUsers()
    
    if (result.success) {
      res.json(result)
    } else {
      res.status(500).json(result)
    }
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    })
  }
})

// AUTH - Obtener todos los roles
app.get('/api/roles', async (req, res) => {
  try {
    const result = await authService.getAllRoles()
    
    if (result.success) {
      res.json(result)
    } else {
      res.status(500).json(result)
    }
  } catch (error) {
    console.error('Error al obtener roles:', error)
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    })
  }
})

// AUTH - Crear usuario (opcional)
app.post('/api/usuarios', async (req, res) => {
  try {
    const result = await authService.createUser(req.body)
    
    if (result.success) {
      res.status(201).json(result)
    } else {
      res.status(400).json(result)
    }
  } catch (error) {
    console.error('Error al crear usuario:', error)
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    })
  }
})

// ABMC Bomberos - Rutas específicas primero
app.get('/api/bomberos', async (req, res) => {
  try {
    await bomberosAdapter.obtenerBomberos(req, res)
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

app.post('/api/bomberos', validateBomberoData, async (req, res) => {
  try {
    await bomberosAdapter.registrarBombero(req, res)
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

app.put('/api/bomberos/:id', validateBomberoUpdateData, async (req, res) => {
  try {
    await bomberosAdapter.actualizarBombero(req, res)
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

app.get('/api/bomberos/:id', async (req, res) => {
  try {
    await bomberosAdapter.obtenerBomberoPorId(req, res)
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

app.delete('/api/bomberos/:id', async (req, res) => {
  try {
    await bomberosAdapter.eliminarBombero(req, res)
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    availableRoutes: [
      'POST /login',
      'GET /api/usuarios',
      'GET /api/roles',
      'POST /api/usuarios',
      'GET /api/bomberos',
      'POST /api/bomberos', 
      'GET /api/bomberos/:id',
      'PUT /api/bomberos/:id',
      'DELETE /api/bomberos/:id',
      'GET /health'
    ]
  })
})

app.listen(PORT, () => {
  console.log(`🚒 BomberOS - ABMC Bomberos en http://localhost:${PORT}`)
  console.log(`📋 API disponible:`)
  console.log(`   • POST   /login - Iniciar sesión con BD real`)
  console.log(`   • GET    /api/usuarios - Listar usuarios`)
  console.log(`   • GET    /api/roles - Listar roles`)
  console.log(`   • POST   /api/usuarios - Crear usuario`)
  console.log(`   • GET    /api/bomberos - Listar bomberos`)
  console.log(`   • POST   /api/bomberos - Crear bombero`)
  console.log(`   • GET    /api/bomberos/:id - Obtener bombero`)
  console.log(`   • PUT    /api/bomberos/:id - Actualizar bombero`)
  console.log(`   • DELETE /api/bomberos/:id - Eliminar bombero`)
  console.log(`   • GET    /health - Estado del servidor`)
  console.log(`🏗️ Arquitectura: Hexagonal (Ports & Adapters)`)
  console.log(`🔐 Autenticación: Base de datos real (tabla usuario)`)
}) 