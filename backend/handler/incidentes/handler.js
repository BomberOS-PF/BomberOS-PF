import { crearIncidenteDto } from './dto/create-incidente.dto.js'
import { updateIncidenteDto } from './dto/update-incidente.dto.js'
import { mapToIncidenteResponse } from './mappers/incidente.mapper.js'
import { logger } from '../../internal/platform/logger/logger.js'
import { crearIncendioForestalDto } from './dto/create-incendio-forestal.dto.js'

const parseIntSafe = (v, def) => {
  const n = parseInt(v, 10)
  return Number.isNaN(n) ? def : n
}

const isYYYYMMDD = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '')

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

    // ✅ Nuevo: listado con filtros y paginado
    listar: async (req, res, next) => {
      try {
        const pagina = parseInt(req.query.pagina ?? '1', 10)
        const limite = parseInt(req.query.limite ?? '10', 10)
        const busqueda = (req.query.busqueda ?? '').trim()
        const tipo = req.query.tipo ?? ''
        const desde = req.query.desde ?? ''
        const hasta = req.query.hasta ?? ''

        logger.info('📋 Listar incidentes con filtros', { 
          pagina, limite, busqueda, tipo, desde, hasta 
        })

        const { data, total } = await incidenteService.listarConFiltros({
          pagina, limite, busqueda, tipo, desde, hasta
        })

        if (!Array.isArray(data)) {
          logger.warn('⚠️ listarConFiltros no devolvió un array', { data })
          return res.status(200).json({
            success: true,
            data: [],
            total: 0
          })
        }

        const incidentes = data.map(row => ({
          idIncidente: row.idIncidente,
          fecha: row.fecha,
          tipoDescripcion: row.tipoDescripcion || 'Sin tipo',
          descripcion: row.descripcion || 'Sin descripción',
          localizacion: row.localizacion || 'Sin localización',
          estado: row.estado || 'Activo',
          idTipoIncidente: row.idTipoIncidente,
          idLocalizacion: row.idLocalizacion
        }))

        logger.info('✅ Incidentes listados correctamente', { 
          count: incidentes.length, 
          total 
        })

        res.status(200).json({
          success: true,
          data: incidentes,
          total: total || 0
        })
      } catch (error) {
        logger.error('❌ Error al listar incidentes', { 
          error: error.message,
          stack: error.stack 
        })
        next(error)
      }
    },

    obtenerPorId: async (req, res, next) => {
      try {
        const { id } = req.params
        logger.info('🔍 Obtener incidente por ID', { id })

        // Sugerido: que el service traiga el detalle enriquecido por tipo
        const incidente = await incidenteService.obtenerDetalle
          ? await incidenteService.obtenerDetalle(id)
          : await incidenteService.obtenerIncidentePorId(id)

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
        logger.info('✏️ Actualización de incidente', { id, body: req.body })

        const datos = updateIncidenteDto(req.body)
        const actualizado = await incidenteService.actualizarIncidente(id, datos)

        logger.info('✅ Incidente actualizado', { id })
        res.status(200).json(mapToIncidenteResponse(actualizado))
      } catch (error) {
        logger.error('❌ Error al actualizar incidente', { error: error.message })
        next(error)
      }
    },

    eliminar: async (req, res, next) => {
      try {
        const { id } = req.params
        logger.info('🗑️ Eliminación de incidente', { id })

        const resultado = await incidenteService.eliminarIncidente(id)

        logger.info('✅ Incidente eliminado', { id })
        res.status(200).json({ mensaje: 'Incidente eliminado correctamente', resultado })
      } catch (error) {
        logger.error('❌ Error al eliminar incidente', { error: error.message })
        next(error)
      }
    },

    notificarBomberos: async (req, res, next) => {
      try {
        const { id } = req.params
        logger.info('📱 Solicitud de notificación de bomberos recibida', { 
          incidenteId: id,
          method: req.method,
          path: req.path,
          headers: req.headers
        })

        if (!id || isNaN(parseInt(id))) {
          logger.warn('⚠️ ID de incidente inválido', { id })
          return res.status(400).json({
            success: false,
            message: 'ID de incidente inválido',
            data: {
              incidenteId: id,
              totalBomberos: 0,
              notificacionesExitosas: 0,
              notificacionesFallidas: 0,
              detalles: []
            }
          })
        }

        logger.info('🚀 Ejecutando notificación de incidente', { id })
        const resultado = await incidenteService.notificarBomberosIncidente(id)

        logger.info('📊 Resultado de notificación completo', { 
          incidenteId: id,
          resultado: {
            success: resultado.success,
            total: resultado.total,
            exitosos: resultado.exitosos,
            fallidos: resultado.fallidos,
            message: resultado.message
          }
        })

        const responseData = {
          incidenteId: id,
          totalBomberos: resultado.total || 0,
          notificacionesExitosas: resultado.exitosos || 0,
          notificacionesFallidas: resultado.fallidos || 0,
          detalles: resultado.resultados || []
        }

        if (resultado.success) {
          logger.info('✅ Notificación completada exitosamente', { 
            incidenteId: id, 
            responseData 
          })
          
          return res.status(200).json({
            success: true,
            message: resultado.message || 'Notificaciones enviadas correctamente',
            data: responseData
          })
        } 
        
        logger.warn('⚠️ Notificación con fallas o incompleta', { 
          incidenteId: id, 
          message: resultado.message,
          responseData
        })
        
        return res.status(200).json({
          success: false,
          message: resultado.message || 'No se pudieron enviar las notificaciones',
          data: responseData
        })
      } catch (error) {
        logger.error('❌ Error crítico en handler de notificación', { 
          incidenteId: req.params?.id, 
          error: error.message,
          stack: error.stack,
          name: error.name
        })
        
        if (!res.headersSent) {
          return res.status(200).json({
            success: false,
            message: 'Error interno al procesar la notificación. Por favor, intenta nuevamente.',
            data: {
              incidenteId: req.params?.id,
              totalBomberos: 0,
              notificacionesExitosas: 0,
              notificacionesFallidas: 0,
              detalles: []
            },
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
          })
        }
      }
    },

    crearIncendioForestal: async (req, res, next) => {
      try {
        logger.info('📥 Crear incendio forestal', { body: req.body })
        const datosValidados = crearIncendioForestalDto(req.body)
        const result = await incidenteService.crearIncendioForestal(datosValidados)
        res.status(201).json({
          success: true,
          message: 'Incendio forestal creado exitosamente',
          data: result
        })
      } catch (error) {
        logger.error('❌ Error al crear incendio forestal', { error: error.message })
        res.status(400).json({
          success: false,
          message: error.message
        })
      }
    },

    actualizarIncendioForestal: async (req, res, next) => {
      try {
        logger.info('📝 Actualizar incendio forestal', { body: req.body })
        const datosValidados = crearIncendioForestalDto(req.body) // Reutilizar el mismo DTO
        const result = await incidenteService.actualizarIncendioForestal(datosValidados)
        res.status(200).json({
          success: true,
          message: 'Incendio forestal actualizado exitosamente',
          data: result
        })
      } catch (error) {
        logger.error('❌ Error al actualizar incendio forestal', { error: error.message })
        res.status(400).json({
          success: false,
          message: error.message
        })
      }
    },

    // Estos métodos serán manejados por los handlers específicos
    // Los endpoints PUT deben usar los servicios específicos directamente
    async detalle(req, res) {
      try {
        const { id } = req.params
        const resultado = await this.incidenteService.obtenerDetalleCompleto(id)

        if (!resultado) {
          return res.status(404).json({ error: 'Incidente no encontrado' })
        }

        res.json(resultado)
      } catch (error) {
        res.status(500).json({ error: 'Error al obtener detalle del incidente' })
      }
    },
    obtenerDetalle: async (req, res, next) => {
  try {
    const { id } = req.params
    logger.info('🔎 Detalle de incidente solicitado', { id })

    const data = await incidenteService.obtenerDetalleCompleto(id)
    if (!data) {
      logger.warn('⚠️ Incidente no encontrado', { id })
      return res.status(404).json({ mensaje: 'Incidente no encontrado' })
    }

    // devolvemos ya listo para el front
    return res.status(200).json(data)
  } catch (error) {
    logger.error('❌ Error al obtener detalle de incidente', { error: error.message })
    next(error)
  }
},
  }
}