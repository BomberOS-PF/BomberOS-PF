// frontend/src/utils/imprimirRUBA.js
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
  tipoNombre: NOMBRES_TIPO[raw.idTipoIncidente] || `Tipo #${raw.idTipoIncidente}`,
  fecha: formatearFechaArg(raw.fecha),
  localizacion: raw.localizacion,
  descripcion: raw.descripcion || '-',
  numeroServicio: raw.numeroServicio,
  numeroParte: raw.nroParte,
  cuerpoNombre: raw.cuerpo
})

export async function imprimirRUBA(idIncidente, usuario = {}) {
  const resp = await apiRequest(`/api/incidentes/${idIncidente}`)
  if (!resp?.success || !resp?.data) throw new Error('No se pudo obtener el incidente')

  const incidente = normalizarIncidente(resp.data)

  generarPdfRUBA(
    {
      incidente,
      intervinientes: [],
      damnificados: [],
      vehiculos: [],
      seguros: {},
      caracteristicas: {}
    },
    {
      generadoPor: `${usuario?.nombre || ''} ${usuario?.apellido || ''}`.trim() || 'Usuario',
      fileName: `Sistema_RUBA_${incidente.idIncidente}.pdf`
    }
  )
}
