import { crearIncidenteDto } from './dto/create-incidente.dto.js'
import { updateIncidenteDto } from './dto/update-incidente.dto.js'
import { mapToIncidenteResponse } from './mappers/incidente.mapper.js'
import { logger } from '../internal/platform/logger/logger.js'

export const construirIncidenteHandler = (incidenteService) => {
  return {
    crear: async (req, res, next) => {
      try {
        logger.info('📥 Crear incidente solicitado', { body: req.body })

        const datosValidados = crearIncidenteDto(req.body)
        const incidenteCreado = await incidenteService.crearIncidente(datosValidados)

        logger.info('✅ Incidente creado con éxito', { id: incidenteCreado.idIncidente })

        res.status(201).json(mapToIncidenteResponse(incidenteCreado))
      } catch (error) {
        logger.error('❌ Error al crear incidente', { error: error.message })
        next(error)
      }
    },

    listar: async (req, res, next) => {
      try {
        logger.info('📄 Listar incidentes solicitado')

        const incidentes = await incidenteService.listarIncidentes()

        logger.info(`📦 ${incidentes.length} incidentes obtenidos`)

        res.status(200).json(incidentes.map(mapToIncidenteResponse))
      } catch (error) {
        logger.error('❌ Error al listar incidentes', { error: error.message })
        next(error)
      }
    },

    obtenerPorId: async (req, res, next) => {
      try {
        const { id } = req.params
        logger.info('🔍 Obtener incidente por ID solicitado', { id })

        const incidente = await incidenteService.obtenerIncidentePorId(id)

        if (!incidente) {
          logger.warn('⚠️ Incidente no encontrado', { id })
          return res.status(404).json({ mensaje: 'Incidente no encontrado' })
        }

        logger.info('✅ Incidente encontrado', { id })
        res.status(200).json(mapToIncidenteResponse(incidente))
      } catch (error) {
        logger.error('❌ Error al obtener incidente por ID', { error: error.message })
        next(error)
      }
    },

    actualizar: async (req, res, next) => {
      try {
        const { id } = req.params
        logger.info('✏️ Actualización de incidente solicitada', { id, body: req.body })

        const datos = updateIncidenteDto(req.body)
        const actualizado = await incidenteService.actualizarIncidente(id, datos)

        logger.info('✅ Incidente actualizado con éxito', { id })
        res.status(200).json(mapToIncidenteResponse(actualizado))
      } catch (error) {
        logger.error('❌ Error al actualizar incidente', { error: error.message })
        next(error)
      }
    },

    eliminar: async (req, res, next) => {
      try {
        const { id } = req.params
        logger.info('🗑️ Eliminación de incidente solicitada', { id })

        const resultado = await incidenteService.eliminarIncidente(id)

        logger.info('✅ Incidente eliminado con éxito', { id })
        res.status(200).json({ mensaje: 'Incidente eliminado correctamente', resultado })
      } catch (error) {
        logger.error('❌ Error al eliminar incidente', { error: error.message })
        next(error)
      }
    }
  }
}
