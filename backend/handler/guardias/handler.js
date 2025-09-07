// backend/guardias/handler.js
import { logger } from '../../internal/platform/logger/logger.js'

function isYMD(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s)
}

export function buildGuardiaHandlers(guardiaService) {
  return {
    // POST /api/grupos/:id/guardias
    crearAsignaciones: async (req, res) => {
      const path = req.originalUrl
      const method = req.method
      try {
        const idGrupo = Number(req.params.id)
        if (!Number.isInteger(idGrupo) || idGrupo <= 0) throw new Error('idGrupo inválido')

        const body = req.body || {}
        const items = Array.isArray(body.asignaciones)
          ? body.asignaciones
          : (body.asignacion ? [body.asignacion] : [])

        if (!Array.isArray(items) || items.length === 0) {
          throw new Error('Debe enviar asignaciones[]')
        }

        // El service valida y normaliza (desde/hasta u hora_desde/hora_hasta)
        const data = await guardiaService.crearAsignaciones({ idGrupo, asignaciones: items })

        return res.json({ success: true, data, path, method })
      } catch (error) {
        logger.error('crearAsignaciones error', { error: error.message, body: req.body })
        return res.status(400).json({ success: false, error: error.message, path, method })
      }
    },

    // GET /api/grupos/:id/guardias?start=YYYY-MM-DD&end=YYYY-MM-DD
    // (también acepta ?desde=&hasta=)
    obtenerAsignaciones: async (req, res) => {
      const path = req.originalUrl
      const method = req.method
      try {
        const idGrupo = Number(req.params.id)
        if (!Number.isInteger(idGrupo) || idGrupo <= 0) throw new Error('idGrupo inválido')

        let { start, end, desde, hasta } = req.query
        start = start || desde
        end = end || hasta
        if (!start || !end) throw new Error('Parámetros requeridos: start/end (o desde/hasta)')
        if (!isYMD(start) || !isYMD(end)) throw new Error('Formato de fecha inválido. Use YYYY-MM-DD')

        // Nota: end es EXCLUSIVO (como FullCalendar)
        const data = await guardiaService.obtenerAsignaciones({ idGrupo, start, end })

        return res.json({ success: true, data, path, method })
      } catch (error) {
        logger.error('obtenerAsignaciones error', { error: error.message, query: req.query })
        return res.status(400).json({ success: false, error: error.message, path, method })
      }
    },

    // PUT /api/grupos/:id/guardias/dia
    // body: { fecha:'YYYY-MM-DD', asignaciones:[{ dni, desde/hasta | hora_desde/hora_hasta }] }
    reemplazarDia: async (req, res) => {
      const path = req.originalUrl
      const method = req.method
      try {
        const idGrupo = Number(req.params.id)
        if (!Number.isInteger(idGrupo) || idGrupo <= 0) throw new Error('idGrupo inválido')

        const { fecha, asignaciones } = req.body || {}
        if (!fecha) throw new Error('fecha requerida')
        if (!isYMD(fecha)) throw new Error('Formato de fecha inválido. Use YYYY-MM-DD')

        const data = await guardiaService.reemplazarDia({
          idGrupo,
          fecha,
          asignaciones: Array.isArray(asignaciones) ? asignaciones : []
        })

        return res.json({ success: true, data, path, method })
      } catch (error) {
        logger.error('reemplazarDia error', { error: error.message, body: req.body })
        return res.status(400).json({ success: false, error: error.message, path, method })
      }
    },

    // DELETE /api/grupos/:id/guardias?start=YYYY-MM-DD&end=YYYY-MM-DD
    eliminarAsignaciones: async (req, res) => {
      const path = req.originalUrl
      const method = req.method
      try {
        const idGrupo = Number(req.params.id)
        if (!Number.isInteger(idGrupo) || idGrupo <= 0) throw new Error('idGrupo inválido')

        let { start, end, desde, hasta } = req.query
        start = start || desde
        end = end || hasta
        if (!start || !end) throw new Error('Parámetros start y end requeridos')
        if (!isYMD(start) || !isYMD(end)) throw new Error('Formato de fecha inválido. Use YYYY-MM-DD')

        const data = await guardiaService.eliminarPorRango({ idGrupo, start, end })

        return res.json({ success: true, data, path, method })
      } catch (error) {
        logger.error('eliminarAsignaciones error', { error: error.message, query: req.query })
        return res.status(400).json({ success: false, error: error.message, path, method })
      }
    }
  }
}

// export default opcional para que también funcione import default
export default buildGuardiaHandlers
