import { Incidente } from '../../domain/models/incidente.js'
import { IncidenteServiceInterface } from '../../interfaces/service.interface.js'
import { logger } from '../platform/logger/logger.js'
import { getConnection } from '../platform/database/connection.js'
import { TelegramService } from '../services/telegram.service.js'


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
    // repositorios específicos para obtenerDetalleCompleto
    accidenteTransitoRepository = null,
    incendioEstructuralRepository = null,
    materialPeligrosoRepository = null,
    rescateRepository = null,
    factorClimaticoRepository = null,

  ) {
    super()
    this.incidenteRepository = incidenteRepository
    this.denuncianteRepository = denuncianteRepository
    this.bomberoService = bomberoService
    this.whatsappService = whatsappService
   
    this.notificationChannel = process.env.NOTIFICATION_CHANNEL || 'whatsapp'
    this.damnificadoRepository = damnificadoRepository
    this.incendioForestalRepository = incendioForestalRepository
    this.areaAfectadaRepository = areaAfectadaRepository
    this.tipoIncidenteService = tipoIncidenteService

    // repos específicos para obtenerDetalleCompleto
    this.accidenteTransitoRepository = accidenteTransitoRepository
    this.incendioEstructuralRepository = incendioEstructuralRepository
    this.materialPeligrosoRepository = materialPeligrosoRepository
    this.rescateRepository = rescateRepository
    this.factorClimaticoRepository = factorClimaticoRepository,
    this.telegramService = new TelegramService()
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

    // El método insertarIncendioForestal ya maneja UPDATE/INSERT automáticamente
    const incendioId = incidente.idIncidente || incidente.id
    
    
    await this.incendioForestalRepository.insertarIncendioForestal({
      idIncidente: incendioId,
      caracteristicasLugar: data.caracteristicasLugar,
      areaAfectada: data.areaAfectada,
      cantidadAfectada: data.cantidadAfectada,
      causaProbable: data.causaProbable,
      detalle: data.detalle
    })
    logger.info('✅ Incendio forestal procesado (INSERT/UPDATE automático)', { idIncidente: incendioId })

    // Manejar damnificados
    if (Array.isArray(data.damnificados) && this.damnificadoRepository) {
      const idIncidenteFinal = incidente.idIncidente || incidente.id
      
      // Si es actualización, eliminar damnificados existentes
      if (data.idIncidente) {
        await this.damnificadoRepository.eliminarPorIncidente(idIncidenteFinal)
        logger.debug('🗑️ Damnificados existentes eliminados para actualización')
      }
      
      // Insertar nuevos damnificados
      for (const damnificado of data.damnificados) {
        await this.damnificadoRepository.insertarDamnificado({
          ...damnificado,
          idIncidente: idIncidenteFinal
        })
      }
      logger.debug(`👥 ${data.damnificados.length} damnificados procesados`)
    }

    return incidente
  }

  async actualizarIncendioForestal(data) {
    // Reutilizar el método crearIncendioForestal ya que maneja ambos casos
    return await this.crearIncendioForestal(data)
  }

  async actualizarAccidenteTransito(data) {
    logger.info('🔄 Actualizando accidente de tránsito', { idIncidente: data.idIncidente })
    // Los servicios específicos manejan tanto creación como actualización
    // Por ahora, delegamos al handler específico que ya existe
    throw new Error('Método debe ser manejado por el servicio específico de AccidenteTransito')
  }

  async actualizarFactorClimatico(data) {
    logger.info('🔄 Actualizando factor climático', { idIncidente: data.idIncidente })
    // Los servicios específicos manejan tanto creación como actualización
    throw new Error('Método debe ser manejado por el servicio específico de FactorClimatico')
  }

  async actualizarIncendioEstructural(data) {
    logger.info('🔄 Actualizando incendio estructural', { idIncidente: data.idIncidente })
    // Los servicios específicos manejan tanto creación como actualización
    throw new Error('Método debe ser manejado por el servicio específico de IncendioEstructural')
  }

  async actualizarMaterialPeligroso(data) {
    logger.info('🔄 Actualizando material peligroso', { idIncidente: data.idIncidente })
    // Los servicios específicos manejan tanto creación como actualización
    throw new Error('Método debe ser manejado por el servicio específico de MaterialPeligroso')
  }

  async actualizarRescate(data) {
    logger.info('🔄 Actualizando rescate', { idIncidente: data.idIncidente })
    // Los servicios específicos manejan tanto creación como actualización
    throw new Error('Método debe ser manejado por el servicio específico de Rescate')
  }

  // ================== LISTADOS / CONSULTAS ==================
  // ✅ nuevo: soporta filtros + paginado para el frontend
  async listarConFiltros(filtros) {
    try {
      logger.debug('🔍 Buscando incidentes con filtros', { filtros })
      
      const data = await this.incidenteRepository.buscarConFiltros(filtros)
      const total = await this.incidenteRepository.contarConFiltros(filtros)
      
      if (!Array.isArray(data)) {
        logger.warn('⚠️ buscarConFiltros no devolvió un array', { data })
        return { data: [], total: 0 }
      }
      
      logger.debug('✅ Incidentes encontrados', { count: data.length, total })
      
      return { 
        data: data || [], 
        total: total || 0 
      }
    } catch (error) {
      logger.error('❌ Error en listarConFiltros', { 
        error: error.message,
        filtros 
      })
      return { data: [], total: 0 }
    }
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
    if (tipo === 1 && this.accidenteTransitoRepository?.obtenerPorIncidente) {
  base.accidenteTransito = await this.accidenteTransitoRepository.obtenerPorIncidente(idIncidente)
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
    logger.info('📱 Iniciando notificación de bomberos para incidente', { incidenteId });

    const incidente = await this.incidenteRepository.obtenerPorId(incidenteId);
    if (!incidente) {
      const errorMsg = `Incidente con ID ${incidenteId} no encontrado`;
      logger.error('❌ ' + errorMsg);
      return { 
        success: false, 
        message: errorMsg, 
        total: 0, 
        exitosos: 0, 
        fallidos: 0,
        resultados: [] 
      };
    }

    if (!this.bomberoService) {
      const errorMsg = 'BomberoService no disponible para notificaciones';
      logger.error('❌ ' + errorMsg);
      return { 
        success: false, 
        message: errorMsg, 
        total: 0, 
        exitosos: 0, 
        fallidos: 0,
        resultados: [] 
      };
    }

    // Obtener bomberos con telegram_chat_id
    const bomberosTelegram = await this.bomberoService.listarBomberosConTelegram();
    if (!bomberosTelegram || bomberosTelegram.length === 0) {
      return {
        success: false,
        message: 'No hay bomberos con chatId de Telegram para notificar',
        total: 0,
        exitosos: 0,
        fallidos: 0,
        resultados: []
      };
    }

    // Preparar datos del incidente para el mensaje
    let ubicacionReal = incidente.localizacion || incidente.descripcion || 'Ubicación no especificada';
    if (incidente.idLocalizacion && !incidente.localizacion) {
      ubicacionReal = incidente.descripcion || 'Ubicación por confirmar';
    }

    const incidenteParaMensaje = {
      id: incidente.idIncidente,
      tipo: await this.mapearTipoIncidente(incidente.idTipoIncidente),
      fecha: incidente.fecha,
      ubicacion: ubicacionReal,
      descripcion: incidente.descripcion
    };

    // 🔥 Usar TelegramService para enviar a cada bombero
    const resultado = await this.telegramService.notificarBomberosIncidente(
      bomberosTelegram,
      incidenteParaMensaje
    );

    return { 
      success: true,
      message: `Notificación enviada a ${resultado.exitosos} de ${resultado.total} bomberos`,
      total: resultado.total,
      exitosos: resultado.exitosos,
      fallidos: resultado.fallidos,
      resultados: resultado.resultados || []
    };

  } catch (error) {
    logger.error('❌ Error crítico al notificar bomberos', { 
      incidenteId, 
      error: error.message,
      stack: error.stack 
    });
    return { 
      success: false, 
      message: `Error al procesar notificación: ${error.message}`, 
      total: 0, 
      exitosos: 0, 
      fallidos: 0,
      resultados: [] 
    };
  }
}

 async mapearTipoIncidente(idTipo) {
  try {
    if (
      this.tipoIncidenteService &&
      typeof this.tipoIncidenteService.obtenerTipoIncidentePorId === 'function'
    ) {
      const tipo = await this.tipoIncidenteService.obtenerTipoIncidentePorId(idTipo)
      return tipo ? tipo.nombre : `Tipo ${idTipo}`
    }

    logger.warn('⚠️ tipoIncidenteService no disponible o método inexistente')
    return `Tipo ${idTipo}`
  } catch (error) {
    logger.error('❌ Error mapeando tipo incidente', { error: error.message })
    return `Tipo ${idTipo}`
  }
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
        i.idLocalizacion,
        ti.nombre AS tipoDescripcion,
        l.descripcion AS localizacion,
        l.direccion AS lugar
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
        case 2: { // Factor Climático
          detalleEspecifico = await this.factorClimaticoRepository.obtenerClimaticoCompleto(idIncidente)
          break
        }

        //Ejemplos para que completes si querés:
        case 1: { // Accidente de Tránsito
          detalleEspecifico = await this.accidenteTransitoRepository.obtenerAccidenteCompleto(idIncidente)
          break
        }
        case 3: { // Incendio Estructural
          detalleEspecifico = await this.incendioEstructuralRepository.obtenerIncendioCompleto(idIncidente)
          break
        }
        case 4: { // Incendio Forestal
          detalleEspecifico = await this.incendioForestalRepository.obtenerIncendioCompleto(idIncidente)
          break
        }
        case 5: { // Material Peligroso
          detalleEspecifico = await this.materialPeligrosoRepository.obtenerMaterialCompleto(idIncidente)
          break
        }
        case 6: { // Rescate
          detalleEspecifico = await this.rescateRepository.obtenerRescateCompleto(idIncidente)
          break
        }

        default:
          detalleEspecifico = null
      }

      const resultado = {
        idIncidente: base.idIncidente,
        idTipoIncidente: base.idTipoIncidente,
        fecha: base.fecha,
        descripcion: base.descripcion,
        estado: base.estado,
        dniUsuario: base.dniUsuario,
        tipoDescripcion: base.tipoDescripcion,
        localizacion: base.localizacion,
        lugar: base.lugar,
        denuncianteNombre: base.denuncianteNombre,
        detalleEspecifico
      }
      
      return resultado
    } catch (err) {
      logger.error('❌ obtenerDetalleCompleto error', { err: err.message, idIncidente })
      throw err
    }
  }
}