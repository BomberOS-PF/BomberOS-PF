// frontend/src/Component/Ruba/imprimirRUBA.js
import { apiRequest } from '../../config/api'
import { generarPdfRUBA } from './RubaPDF.js'

const NOMBRES_TIPO = {
  1: 'Accidente de Tránsito',
  2: 'Incendio Estructural',
  3: 'Incendio Forestal',
  4: 'Rescate',
  5: 'Material Peligroso'
}

const formatearFechaArg = isoLike => {
  if (!isoLike) return '-'
  const [d, hm] = isoLike.split(' ')
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}${hm ? ' ' + hm : ''}`
}

const normalizarIncidente = raw => ({
  idIncidente: raw.idIncidente,
  tipo: raw.idTipoIncidente,
  tipoNombre:
    raw.tipoDescripcion ||
    NOMBRES_TIPO[raw.idTipoIncidente] ||
    `Tipo #${raw.idTipoIncidente}`,
  fecha: formatearFechaArg(raw.fecha),
  localizacion: raw.localizacion,
  // 👇 ahora descripción y detalle van separados
  descripcion: raw.descripcion || '-',
  detalle: raw.detalleEspecifico?.detalle || '',
  numeroServicio: raw.numeroServicio,
  numeroParte: raw.nroParte,
  cuerpoNombre: raw.cuerpo || 'Asociación Bomberos Voluntarios Despeñaderos.'
})

/**
 * Genera el RUBA de un incidente.
 *
 * Comportamientos:
 * - options.returnDoc === true -> devuelve { doc, fileName } y NO descarga ni abre pestaña
 * - options.modo === 'preview' -> abre en nueva pestaña (dataurlnewwindow)
 * - por defecto -> descarga el PDF (doc.save)
 */
export async function imprimirRUBA (idIncidente, usuario = {}, options = {}) {
  // 1) Detalle del incidente
  const respDetalle = await apiRequest(`/api/incidentes/${idIncidente}/detalle`)
  const rawDetalle = respDetalle && respDetalle.success ? respDetalle.data : respDetalle
  if (!rawDetalle) {
    throw new Error('No se pudo obtener el incidente (detalle)')
  }

  const incidente = normalizarIncidente(rawDetalle)

  // Damnificados (civiles) desde detalleEspecifico
  const damnificadosRaw = rawDetalle.detalleEspecifico?.damnificados || []

  const civilesDamnificados = damnificadosRaw.map((d, idx) => {
    const nombre =
      d.nombre ??
      d.NOMBRE ??
      d.nomDamnificado ??
      d.NOM_DAMNIFICADO ??
      ''
    const apellido =
      d.apellido ??
      d.APELLIDO ??
      d.apeDamnificado ??
      d.APE_DAMNIFICADO ??
      ''
    const dni =
      d.dni ??
      d.DNI ??
      d.documento ??
      d.DOCUMENTO ??
      ''

    const sexo =
      d.sexo ??
      d.SEXO ??
      d.genero ??
      d.GENERO ??
      ''

    const fallecioFlag = d.fallecio ?? d.FALLECIO
    const fallecio =
      fallecioFlag === 1 || fallecioFlag === '1'
        ? 'Sí'
        : 'No'

    return {
      nro: idx + 1,
      nombre,
      apellido,
      dni,
      sexo: sexo || '-',
      fallecio
    }
  })

  // 2) Respuestas de bomberos
  const respRespuestas = await apiRequest(`/api/incidentes/${idIncidente}/respuestas`)
  const rawResp = respRespuestas && respRespuestas.success ? respRespuestas.data : respRespuestas

  const respuestas = rawResp?.respuestas || []

  // Filtrar los que CONFIRMAN
  const respuestasConfirmadas = respuestas.filter(r => {
    const asistio = r.asistio === 1 || r.asistio === '1'
    const respStr = (r.respuestaWhatsapp || '').toString().trim().toUpperCase()
    const dijoSi = respStr === 'SI' || respStr === 'SÍ' || respStr === 'SI.' || respStr === 'S'
    return asistio || dijoSi
  })

  // Deduplicar por DNI (o, si no hay, por teléfono/nombre)
  const mapaPorClave = {}
  respuestasConfirmadas.forEach(r => {
    const clave =
      r.dni ||
      r.DNI ||
      r.telefonoBombero ||
      r.telefono ||
      r.nombreBombero

    if (!clave) return

    const fecha = r.fechaRespuesta || r.fecha_respuesta || r.FECHA_RESPUESTA
    const actual = mapaPorClave[clave]

    if (!actual) {
      mapaPorClave[clave] = { ...r, _fecha: fecha }
    }
  })

  const bomberosParticipantes = Object.values(mapaPorClave).map((r, idx) => {
    const nombre = r.nombreBombero || r.nombre || ''
    const dni = r.dni || r.DNI || ''
    const telefono = r.telefonoBombero || r.telefono || ''
    const cuerpo = 'Bomberos Voluntarios Despeñaderos'

    return {
      nro: idx + 1,
      nombre,
      dni,
      telefono,
      cuerpo
    }
  })

  const meta = {
    generadoPor: `${usuario?.nombre || ''} ${usuario?.apellido || ''}`.trim() || 'Usuario',
    fileName: `RUBA_${incidente.tipoNombre}_${incidente.idIncidente}.pdf`
  }

  const doc = generarPdfRUBA(
    {
      incidente,
      bomberosParticipantes,
      civilesDamnificados,
      intervinientes: [],
      damnificados: damnificadosRaw,
      vehiculos: [],
      seguros: {},
      caracteristicas: {}
    },
    meta
  )

  if (options.returnDoc) {
    return { doc, fileName: meta.fileName }
  }

  if (options.modo === 'preview') {
    doc.output('dataurlnewwindow')
    return
  }

  doc.save(meta.fileName)
}
