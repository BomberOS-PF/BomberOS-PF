// backend/grupos/handler.js

import { GrupoMapper } from './mappers/grupo.mapper.js'
import { CreateGrupoDTO } from './dto/create-grupo.dto.js'

/**
 * Construye los handlers REST para grupos de guardia
 * @param {GrupoGuardiaService} grupoService
 */
export const buildGrupoHandlers = (grupoService) => {
  return {
    /**
     * POST /api/grupos
     * Crear un nuevo grupo de guardia
     */
    crearGrupo: async (req, res, next) => {
      try {
        const dto = new CreateGrupoDTO(req.body)
        const grupoCreado = await grupoService.crearGrupo(dto)
        res.status(201).json({
          success: true,
          data: GrupoMapper.toJSON(grupoCreado)
        })
      } catch (error) {
    console.error('❌ Error en ruta crearGrupo:')
    console.error('Mensaje:', error.message)
    console.error('Stack:', error.stack)
    console.error('Body recibido:', req.body)
    next(error)
}
    },

    /**
     * GET /api/grupos
     * Obtener todos los grupos
     */
    obtenerGrupos: async (_req, res, next) => {
      try {
        const grupos = await grupoService.obtenerGrupos()
        res.json({
          success: true,
          data: grupos.map(g => GrupoMapper.toJSON(g))
        })
      } catch (error) {
        next(error)
      }
    },

    /**
     * GET /api/grupos/:id
     * Obtener grupo por ID
     */
    obtenerGrupoPorId: async (req, res, next) => {
      try {
        const grupo = await grupoService.obtenerGrupoPorId(parseInt(req.params.id))
        if (!grupo) {
          return res.status(404).json({ success: false, message: 'Grupo no encontrado' })
        }
        res.json({ success: true, data: GrupoMapper.toJSON(grupo) })
      } catch (error) {
        next(error)
      }
    },

    /**
     * DELETE /api/grupos/:id
     * Eliminar grupo por ID
     */
    eliminarGrupo: async (req, res, next) => {
      try {
        const eliminado = await grupoService.eliminarGrupo(parseInt(req.params.id))
        res.json({ success: eliminado })
      } catch (error) {
        next(error)
      }
    },

    /**
 * GET /api/grupos/buscar
 * Buscar grupos con paginado y búsqueda
 */
buscarGrupos: async (req, res, next) => {
  try {
    const { pagina = 1, limite = 10, busqueda = '' } = req.query

    const resultado = await grupoService.buscarConPaginado({
      pagina: parseInt(pagina),
      limite: parseInt(limite),
      busqueda: busqueda.trim()
    })

    res.json({
      success: true,
      data: resultado.data.map(g => GrupoMapper.toJSON(g)),
      total: resultado.total
    })
  } catch (error) {
    console.error('❌ Error en handler buscarGrupos:', error)
    next(error)
  }
}


    
  }
}
