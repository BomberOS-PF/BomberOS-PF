// Usa exactamente los métodos de tu repo.
// No renombro nada.

export class GuardiaAsignacionService {
  constructor(guardiaRepo) {
    this.repo = guardiaRepo
  }

  /**
   * Crea varias asignaciones
   * @param { number } idGrupo
   * @param { Array<{fecha:string, dni:number, desde:string, hasta:string}> } asignaciones
   */
  async crearAsignaciones({ idGrupo, asignaciones }) {
    if (!Array.isArray(asignaciones) || asignaciones.length === 0) {
      throw new Error('Debe enviar asignaciones[]')
    }

    // Validaciones mínimas y chequeo de solapamiento con repo.hasOverlap
    const isYMD = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s)
    for (const a of asignaciones) {
      const { fecha, dni } = a
      const desde = a.desde ?? a.hora_desde ?? a.horaDesde
      const hasta = a.hasta ?? a.hora_hasta ?? a.horaHasta

      if (!fecha || !isYMD(fecha)) throw new Error('fecha (YYYY-MM-DD) requerida')
      if (!dni) throw new Error('dni requerido')
      if (!desde || !hasta) throw new Error('horas desde/hasta requeridas')
      if (hasta <= desde) throw new Error('La hora de fin debe ser posterior a la de inicio')

      const overlap = await this.repo.hasOverlap({ dni, fecha, desde, hasta })
      if (overlap) {
        throw new Error(`El DNI ${dni} ya tiene asignación superpuesta el ${fecha} ${desde}-${hasta}`)
      }

      // Normalizo nombres para el repo (usa desde/hasta)
      a.desde = desde
      a.hasta = hasta
    }

    const inserted = await this.repo.createMany({ idGrupo, asignaciones })
    return { created: inserted }
  }

  /**
   * Obtiene asignaciones por rango (end exclusivo)
   */
  async obtenerAsignaciones({ idGrupo, start, end }) {
    if (!start || !end) throw new Error('Parámetros start y end son requeridos')
    return await this.repo.findByGrupoAndRange({ idGrupo, start, end })
  }

  /**
   * Reemplaza un día completo (borra todo el día y vuelve a insertar)
   * @param {string} fecha YYYY-MM-DD
   */
  async reemplazarDia({ idGrupo, fecha, asignaciones }) {
    const isYMD = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s)
    if (!fecha || !isYMD(fecha)) throw new Error('fecha (YYYY-MM-DD) requerida')

    // Validaciones mínimas de las horas
    for (const a of asignaciones || []) {
      const desde = a.desde ?? a.hora_desde ?? a.horaDesde
      const hasta = a.hasta ?? a.hora_hasta ?? a.horaHasta
      if (!a.dni) throw new Error('dni requerido')
      if (!desde || !hasta) throw new Error('horas desde/hasta requeridas')
      if (hasta <= desde) throw new Error(`Rango inválido ${desde}-${hasta} para DNI ${a.dni}`)

      a.desde = desde
      a.hasta = hasta
    }

    await this.repo.replaceDay({ idGrupo, fecha, asignaciones: asignaciones || [] })
    return { idGrupo, fecha, count: asignaciones?.length || 0 }
  }

  /**
   * Elimina por rango (end exclusivo) usando deleteByIds(ids)
   */
  async eliminarPorRango({ idGrupo, start, end }) {
    const rows = await this.repo.findByGrupoAndRange({ idGrupo, start, end })
    const ids = rows.map(r => r.idAsignacion)
    if (ids.length === 0) return { deleted: 0 }
    const deleted = await this.repo.deleteByIds(ids)
    return { deleted }
  }
}
