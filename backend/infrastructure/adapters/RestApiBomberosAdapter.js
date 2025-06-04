/**
 * Adaptador REST para ABMC de Bomberos
 * Arquitectura Hexagonal - Input Adapter
 * Traduce requests HTTP a llamadas de casos de uso
 */
export class RestApiBomberosAdapter {
  
  constructor(bomberosUseCases) {
    this.bomberosUseCases = bomberosUseCases
  }

  // POST /api/bomberos - Registrar nuevo bombero (ALTA)
  async registrarBombero(req, res) {
    try {
      const resultado = await this.bomberosUseCases.registrarBombero(req.body)
      res.status(201).json(resultado)
    } catch (error) {
      console.error('Error al registrar bombero:', error)
      
      if (error.message.includes('Ya existe un bombero con este email')) {
        return res.status(409).json({ error: error.message })
      }
      
      if (error.message.includes('requerido') || error.message.includes('inválido')) {
        return res.status(400).json({ error: error.message })
      }
      
      res.status(500).json({ error: 'Error del servidor al registrar bombero' })
    }
  }

  // GET /api/bomberos - Obtener todos los bomberos (CONSULTA)
  async obtenerBomberos(req, res) {
    try {
      const resultado = await this.bomberosUseCases.obtenerTodosBomberos()
      res.json(resultado)
    } catch (error) {
      console.error('Error al obtener bomberos:', error)
      res.status(500).json({ error: 'Error al obtener bomberos' })
    }
  }

  // GET /api/bomberos/:id - Obtener bombero por ID (CONSULTA)
  async obtenerBomberoPorId(req, res) {
    try {
      const { id } = req.params
      const resultado = await this.bomberosUseCases.obtenerBomberoPorId(id)
      res.json(resultado)
    } catch (error) {
      console.error('Error al obtener bombero:', error)
      
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({ error: error.message })
      }
      
      res.status(500).json({ error: 'Error al obtener bombero' })
    }
  }

  // PUT /api/bomberos/:id - Actualizar bombero (MODIFICACIÓN)
  async actualizarBombero(req, res) {
    try {
      const { id } = req.params
      const resultado = await this.bomberosUseCases.actualizarBombero(id, req.body)
      res.json(resultado)
    } catch (error) {
      console.error('Error al actualizar bombero:', error)
      
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({ error: error.message })
      }
      
      if (error.message.includes('email ya está en uso')) {
        return res.status(409).json({ error: error.message })
      }
      
      if (error.message.includes('requerido') || error.message.includes('inválido')) {
        return res.status(400).json({ error: error.message })
      }
      
      res.status(500).json({ error: 'Error del servidor al actualizar bombero' })
    }
  }

  // DELETE /api/bomberos/:id - Eliminar bombero (BAJA)
  async eliminarBombero(req, res) {
    try {
      const { id } = req.params
      const resultado = await this.bomberosUseCases.eliminarBombero(id)
      res.json(resultado)
    } catch (error) {
      console.error('Error al eliminar bombero:', error)
      
      if (error.message.includes('no encontrado')) {
        return res.status(404).json({ error: error.message })
      }
      
      res.status(500).json({ error: 'Error del servidor al eliminar bombero' })
    }
  }
} 