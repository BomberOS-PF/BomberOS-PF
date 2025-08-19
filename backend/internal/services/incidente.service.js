import { Incidente } from '../../domain/models/incidente.js'
import { IncidenteServiceInterface } from '../../interfaces/service.interface.js'
import { logger } from '../platform/logger/logger.js'
import { getConnection } from '../platform/database/connection.js'

export class IncidenteService extends IncidenteServiceInterface {
  constructor(
    incidenteRepository,
    denuncianteRepository,
    bomberoService = null,
    whatsappService = null,
    damnificadoRepository = null,
    incendioForestalRepository = null,
    areaAfectadaRepository = null,
    tipoIncidenteService = null,
    // opcionales si los tenés
    accidenteRepository = null,
    incendioEstructuralRepository = null,
    materialPeligrosoRepository = null,
    rescateRepository = null
  ) {
    super()
    this.incidenteRepository = incidenteRepository
    this.denuncianteRepository = denuncianteRepository
    this.bomberoService = bomberoService
    this.whatsappService = whatsappService
    this.damnificadoRepository = damnificadoRepository
    this.incendioForestalRepository = incendioForestalRepository
    this.areaAfectadaRepository = areaAfectadaRepository
    this.tipoIncidenteService = tipoIncidenteService

    // repos específicos opcionales
    this.accidenteRepository = accidenteRepository
    this.incendioEstructuralRepository = incendioEstructuralRepository
    this.materialPeligrosoRepository = materialPeligrosoRepository
    this.rescateRepository = rescateRepository
  }

  // ================== ALTAS ==================
  async crearIncidente(data) {
    let idDenunciante = null

    const den = data.denunciante
    if (den && (den.dni || den.nombre || den.apellido || den.telefono)) {
      const repo = this.denuncianteRepository
      if (typeof repo.insertarDenunciante === 'function') {
        idDenunciante = await repo.insertarDenunciante({
          dni: den.dni ?? null,
          nombre: den.nombre ?? null,
          apellido: den.apellido ?? null,
          telefono: den.telefono ?? null
        })
      } else if (typeof repo.crear === 'function') {
        idDenunciante = await repo.crear({
          dni: den.dni ?? null,
          nombre: den.nombre ?? null,
          apellido: den.apellido ?? null,
          telefono: den.telefono ?? null
        })
      } else {
        throw new Error('Repositorio de denunciante no implementa insertarDenunciante/crear')
      }
    }

    const dataIncidente = {
      idTipoIncidente: data.idTipoIncidente,
      fecha: data.fecha,
      idLocalizacion: data.idLocalizacion,
      descripcion: data.descripcion,
      idDenunciante
    }

    logger.debug('➡️ INSERT incidente', dataIncidente)
    const incidenteCreado = await this.incidenteRepository.create(dataIncidente)


    if (Array.isArray(data.damnificados) && this.damnificadoRepository) {
      for (const damnificado of data.damnificados) {
        await this.damnificadoRepository.insertarDamnificado({
          ...damnificado,
          idIncidente: incidenteCreado.idIncidente || incidenteCreado.id
        })
      }
    }

    logger.info('📋 Incidente creado', {
      id: incidenteCreado.idIncidente || incidenteCreado.id,
      idDenunciante
    })

    return incidenteCreado
  }

  async crearIncendioForestal(data) {
    let incidente

    if (data.idIncidente) {
      incidente = await this.incidenteRepository.obtenerPorId(data.idIncidente)
      if (!incidente) throw new Error(`Incidente con ID ${data.idIncidente} no encontrado`)
      await this.incidenteRepository.actualizar(data.idIncidente, {
        descripcion: data.descripcion || incidente.descripcion
      })
    } else {
      incidente = await this.incidenteRepository.create({
        idTipoIncidente: 4, // Forestal
        fecha: data.fecha,
        idLocalizacion: data.idLocalizacion,
        descripcion: data.descripcion
      })
    }

    await this.incendioForestalRepository.insertarIncendioForestal({
      idIncidente: incidente.idIncidente || incidente.id,
      caracteristicasLugar: data.caracteristicasLugar,
      areaAfectada: data.areaAfectada,
      cantidadAfectada: data.cantidadAfectada,
      causaProbable: data.causaProbable,
      detalle: data.detalle
    })

    if (Array.isArray(data.damnificados) && this.damnificadoRepository) {
      for (const damnificado of data.damnificados) {
        await this.damnificadoRepository.insertarDamnificado({
          ...damnificado,
          idIncidente: incidente.idIncidente || incidente.id
        })
      }
    }

    return incidente
  }

  // ================== LISTADOS / CONSULTAS ==================
  // ✅ nuevo: soporta filtros + paginado para el frontend
  // application/services/incidente.service.js
  async listarConFiltros(filtros) {
    const data = await this.incidenteRepository.buscarConFiltros(filtros)
    const total = await this.incidenteRepository.contarConFiltros(filtros)
    return { data, total }
  }


  // mantenemos por compatibilidad si lo usás en otros lados
  async listarIncidentes() {
    return await this.incidenteRepository.obtenerTodos()
  }

  // ✅ nuevo: detalle enriquecido (joins) + datos específicos según tipo (si hay repos)
  async obtenerDetalle(id) {
    // intenta traer con joins; si no existe el método, cae al básico
    const base =
      (this.incidenteRepository.obtenerDetallePorId
        ? await this.incidenteRepository.obtenerDetallePorId(id)
        : await this.incidenteRepository.obtenerPorId(id))

    if (!base) return null

    const idIncidente = base.idIncidente || base.id
    const tipo = base.idTipoIncidente

    // Enriquecimiento por tipo (opcional según repos disponibles)
    // 1 = Accidente, 2 = Incendio Estructural, 3 = Material Peligroso, 4 = Forestal, 5 = Rescate (ajustá a tus IDs)
    if (tipo === 1 && this.accidenteRepository?.obtenerPorIncidente) {
      base.accidenteTransito = await this.accidenteRepository.obtenerPorIncidente(idIncidente)
    }
    if (tipo === 2 && this.incendioEstructuralRepository?.obtenerPorIncidente) {
      base.incendioEstructural = await this.incendioEstructuralRepository.obtenerPorIncidente(idIncidente)
    }
    if (tipo === 3 && this.materialPeligrosoRepository?.obtenerPorIncidente) {
      base.materialPeligroso = await this.materialPeligrosoRepository.obtenerPorIncidente(idIncidente)
    }
    if (tipo === 4 && this.incendioForestalRepository?.obtenerPorIncidente) {
      base.incendioForestal = await this.incendioForestalRepository.obtenerPorIncidente(idIncidente)
    }
    if (tipo === 5 && this.rescateRepository?.obtenerPorIncidente) {
      base.rescate = await this.rescateRepository.obtenerPorIncidente(idIncidente)
    }

    return base
  }

  async obtenerIncidentePorId(id) {
    return await this.incidenteRepository.obtenerPorId(id)
  }

  // ================== UPDATE / DELETE ==================
  async actualizarIncidente(id, data) {
    return await this.incidenteRepository.actualizar(id, data)
  }

  async eliminarIncidente(id) {
    return await this.incidenteRepository.eliminar(id)
  }

  // ================== NOTIFICACIONES ==================
  async notificarBomberosIncidente(incidenteId) {
    try {
      logger.info('📱 Iniciando notificación de bomberos para incidente', { incidenteId })

      const incidente = await this.incidenteRepository.obtenerPorId(incidenteId)
      if (!incidente) throw new Error(`Incidente con ID ${incidenteId} no encontrado`)

      if (!this.bomberoService) throw new Error('BomberoService no disponible para notificaciones')
      if (!this.whatsappService) logger.warn('WhatsAppService no disponible, notificación simulada')

      const bomberos = await this.bomberoService.listarBomberos()
      const bomberosActivos = bomberos.filter(b => {
        const telefono = b.telefono ? b.telefono.toString().trim() : ''
        const nombre = b.nombre && b.apellido ? `${b.nombre} ${b.apellido}`.trim() : ''
        return telefono !== '' && nombre !== ''
      })

      if (bomberosActivos.length === 0) {
        logger.warn('📱 No hay bomberos activos con teléfono para notificar')
        return { success: false, message: 'No hay bomberos activos con teléfono válido', total: 0, exitosos: 0, fallidos: 0 }
      }

      const incidenteParaMensaje = {
        id: incidente.id,
        tipo: await this.mapearTipoIncidente(incidente.idTipoIncidente),
        fecha: incidente.fecha,
        ubicacion: incidente.localizacion || `Localización ID: ${incidente.idLocalizacion}`,
        descripcion: incidente.descripcion
      }

      const resultado = await this.whatsappService.notificarBomberosIncidente(bomberosActivos, incidenteParaMensaje)

      logger.info('📱 Notificación de bomberos completada', { incidenteId, ...resultado })

      return { success: true, message: `Notificación enviada a ${resultado.exitosos} de ${resultado.total} bomberos`, ...resultado }
    } catch (error) {
      logger.error('📱 Error al notificar bomberos', { incidenteId, error: error.message })
      return { success: false, message: error.message, total: 0, exitosos: 0, fallidos: 0 }
    }
  }

  async mapearTipoIncidente(idTipo) {
    if (!this.tipoIncidenteService) throw new Error('TipoIncidenteService no disponible para mapear tipos')
    const tipo = await this.tipoIncidenteService.obtenerTipoIncidentePorId(idTipo)
    return tipo ? tipo.nombre : `Tipo ${idTipo}`
  }

  async obtenerDetalleCompleto(idIncidente) {
    const cn = getConnection()

    // 1) Datos base (unificados)
    const sqlBase = `
        SELECT
        i.idIncidente,
        i.idTipoIncidente,
        DATE_FORMAT(i.fecha, '%Y-%m-%d %H:%i') AS fecha,
        i.descripcion,
        ti.nombre AS tipoDescripcion,
        l.descripcion AS localizacion
      FROM incidente i
      JOIN tipoIncidente ti ON ti.idTipoIncidente = i.idTipoIncidente
      JOIN localizacion   l ON l.idLocalizacion   = i.idLocalizacion
      WHERE i.idIncidente = ?
      LIMIT 1
    `

    try {
      const [rows] = await cn.execute(sqlBase, [idIncidente])
      if (!rows || rows.length === 0) return null

      const base = rows[0]

      // 2) Detalle específico por tipo
      let detalleEspecifico = null

      switch (Number(base.idTipoIncidente)) {
        case 2: { // ⚠️ Ajusta al ID real de "Factores Climáticos" en tu tabla tipoIncidente
          const [r] = await cn.execute(
            `SELECT
               *
             FROM climatico c
             WHERE c.idIncidente = ?
             LIMIT 1`,
            [idIncidente]
          )
          detalleEspecifico = r[0] || null
          break
        }

        //Ejemplos para que completes si querés:
        case 1: { // Accidente de Tránsito
          const [r] = await cn.execute(`SELECT * FROM accidenteTransito WHERE idIncidente = ?`, [idIncidente])
          detalleEspecifico = r[0] || null
          break
        }
        case 3: { // Incendio Estructural
          const [r] = await cn.execute(`SELECT * FROM incendioEstructural WHERE idIncidente = ?`, [idIncidente])
          detalleEspecifico = r[0] || null
          break
        }
        case 5: { // Material Peligroso
          const [r] = await cn.execute(`SELECT * FROM materialPeligroso WHERE idIncidente = ?`, [idIncidente])
          detalleEspecifico = r[0] || null
          break
        }
        case 6: { // Rescate
          const [r] = await cn.execute(`SELECT * FROM rescate WHERE idIncidente = ?`, [idIncidente])
          detalleEspecifico = r[0] || null
          break
        }

        default:
          detalleEspecifico = null
      }

      return {
        idIncidente: base.idIncidente,
        idTipoIncidente: base.idTipoIncidente,
        fecha: base.fecha,
        descripcion: base.descripcion,
        estado: base.estado,
        dniUsuario: base.dniUsuario,
        tipoDescripcion: base.tipoDescripcion,
        localizacion: base.localizacion,
        denuncianteNombre: base.denuncianteNombre,
        detalleEspecifico
      }
    } catch (err) {
      logger.error('❌ obtenerDetalleCompleto error', { err: err.message, idIncidente })
      throw err
    }
  }
}

