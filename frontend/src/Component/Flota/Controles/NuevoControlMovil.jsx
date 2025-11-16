// frontend/src/Component/Flota/Controles/NuevoControlMovil.jsx 
import { useEffect, useState } from 'react'
import { Car } from 'lucide-react'
import '../flota.css'
import { BackToMenuButton } from '../../Common/Button'
import Pagination from '../../Common/Pagination'

const PAGE_SIZE_DEFAULT = 10

// fetch directo, sin tocar api.js
async function fetchJson(url) {
  const r = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} @ ${url}`)
  return r.json()
}

const tryMany = async (urls) => {
  let lastErr
  for (const u of urls) {
    try {
      const data = await fetchJson(u)
      return data
    } catch (e) {
      console.warn('[NuevoControl] endpoint falló:', u, e?.message || e)
      lastErr = e
    }
  }
  throw lastErr || new Error('Sin endpoints válidos')
}

const normalizeArray = (data) =>
  (Array.isArray(data) ? data : (data?.items || data?.data || []))

const normalizeBomberos = (arr) =>
  (arr || [])
    .map(b => {
      const dni = (b.DNI ?? b.dni ?? b.Dni ?? b.id ?? '').toString()
      const nombre = (b.nombre ?? b.Nombre ?? '').toString().trim()
      const apellido = (b.apellido ?? b.Apellido ?? '').toString().trim()
      return { dni, label: `${apellido}, ${nombre}`.trim() }
    })
    .filter(b => b.dni && b.label && b.label !== ',')
    .sort((a, b) => a.label.localeCompare(b.label))

const formatFechaHora = (fechaRaw, horaRaw) => {
  if (!fechaRaw) return '-'

  const str = fechaRaw.toString()
  let yyyy, mm, dd

  // Si viene en formato tipo "2025-11-14" o "2025-11-14T..."
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    yyyy = str.slice(0, 4)
    mm = str.slice(5, 7)
    dd = str.slice(8, 10)
  } else {
    // fallback usando Date solo para día/mes/año
    const d = new Date(str)
    if (isNaN(d.getTime())) return str // si no se puede parsear, devolvemos crudo

    const pad = n => (n < 10 ? `0${n}` : String(n))
    dd = pad(d.getDate())
    mm = pad(d.getMonth() + 1)
    yyyy = d.getFullYear()
  }

  const base = `${dd}/${mm}/${yyyy}`

  // Si no hay hora, mostramos solo la fecha
  if (!horaRaw) return base

  // Tomamos solo HH:mm de lo que venga
  const horaStr = horaRaw.toString().slice(0, 5)

  // Si la hora es "00:00" (sin relevancia), también mostramos solo fecha
  if (horaStr === '00:00') return base

  return `${base} ${horaStr}`
}

// --- Mockeo temporal del estado del móvil (para la demo) ---
const mockEstadoMovilRaw = (row) => {
  const finalizado = row.finalizado ?? row.completado ?? row.cerrado ?? 0
  if (!finalizado) return ''

  const id = Number(row.idControl || row.id || row.movilId || row.idMovil || 0)
  const mod = isNaN(id) ? 0 : (id % 3)

  if (mod === 0) return 'OPERATIVO'
  if (mod === 1) return 'OPERATIVO_CON_OBS'
  return 'FUERA_DE_SERVICIO'
}

const mapEstadoMovil = (raw) => {
  const v = (raw || '').toString().trim().toUpperCase()

  if (!v) return { label: '-', classes: 'bg-secondary' }

  if (v === 'OPERATIVO')
    return { label: 'Operativo', classes: 'bg-success' }

  if (v === 'OPERATIVO_CON_OBS')
    return { label: 'Operativo con observaciones', classes: 'bg-warning text-dark' }

  if (v === 'FUERA_DE_SERVICIO')
    return { label: 'Fuera de servicio', classes: 'bg-danger' }

  return { label: raw, classes: 'bg-secondary' }
}

export default function NuevoControlMovil({ onCreated, onCancel }) {
  const [moviles, setMoviles] = useState([])
  const [bomberos, setBomberos] = useState([])
  const [form, setForm] = useState({
    idMovil: '',
    fecha: new Date().toISOString().slice(0, 10),
    realizadoPorDNI: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loadingData, setLoadingData] = useState(true)
  const [filtroMovilId, setFiltroMovilId] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setError('')
      setLoadingData(true)
      try {
        // 1) Móviles
        const movsRaw = await tryMany([
          '/api/flota/moviles?activo=1',
          '/api/flota/moviles'
        ])
        const movs = normalizeArray(movsRaw)
        if (mounted) setMoviles(movs)

        // 2) Bomberos
        const bombsRaw = await tryMany([
          '/api/bomberos/buscar?pagina=1&limite=1000&busqueda=',
          '/api/bomberos?min=1',
          '/api/bomberos/listar?min=1',
          '/api/bomberos'
        ])
        const bombs = normalizeBomberos(normalizeArray(bombsRaw))
        if (mounted) setBomberos(bombs)
      } catch (e) {
        console.error('[NuevoControl] Error cargando datos:', e)
        if (mounted) {
          setError('No se pudieron cargar móviles y/o bomberos')
          setMoviles([])
          setBomberos([])
        }
      } finally {
        if (mounted) setLoadingData(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  const setValue = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const crear = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.idMovil || !form.fecha || !form.realizadoPorDNI) {
      setError('Completá móvil, fecha y responsable')
      return
    }

    try {
      setLoading(true)
      const payload = {
        idMovil: Number(form.idMovil) || form.idMovil,
        fecha: form.fecha,
        realizadoPorDNI: Number(form.realizadoPorDNI) || form.realizadoPorDNI
      }
      const r = await fetch('/api/flota/controles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload)
      })
      const txt = await r.text().catch(() => '')
      if (!r.ok) {
        throw new Error(`${r.status} ${r.statusText} ${txt}`.trim())
      }
      let res = {}
      try { res = txt ? JSON.parse(txt) : {} } catch { res = {} }

      setLoading(false)

      const ctrlId =
        res?.idControl ??
        res?.header?.idControl ??
        res?.id ??
        res?.insertId

      if (!ctrlId) {
        setError('Se creó el control pero la respuesta no incluyó idControl')
        return
      }

      onCreated && onCreated(ctrlId, res)
    } catch (e) {
      console.error('crear control', e)
      setLoading(false)
      setError('No se pudo crear el control')
    }
  }

  // ---- fetchPage para el historial de controles ----
  const fetchControlesPage = async ({ page, limit, filters }) => {
    const params = new URLSearchParams({
      pagina: String(page),
      limite: String(limit)
    })

    const idMovilFilter = filters?.idMovil

    // Se lo mandamos al backend por si lo soporta
    if (idMovilFilter) params.set('idMovil', idMovilFilter)

    try {
      const resp = await tryMany([
        `/api/flota/controles?${params.toString()}`,
        `/api/flota/controles/listar?${params.toString()}`
      ])

      let dataRaw = Array.isArray(resp?.data)
        ? resp.data
        : (Array.isArray(resp) ? resp : normalizeArray(resp))

      if (!Array.isArray(dataRaw)) throw new Error('Respuesta inválida del servidor')

      // 🔹 Filtro adicional en FRONT por móvil (por si el backend no lo aplica)
      if (idMovilFilter) {
        dataRaw = dataRaw.filter(row => {
          const movilIdRow =
            row.idMovil ??
            row.movilId ??
            row.id_movil

          return String(movilIdRow) === String(idMovilFilter)
        })
      }

      const total = dataRaw.length

      // 🔹 paginado en frontend (de a 10)
      const start = (page - 1) * limit
      const end = start + limit
      const data = dataRaw.slice(start, end)

      return { data, total }
    } catch (err) {
      console.error('[NuevoControl] Error cargando historial:', err)
      throw err
    }
  }

  // helper para mostrar filas de la tabla
  const renderHistorialRows = (rows) =>
    rows.map(row => {
      const fecha =
        row.fecha ||
        row.fechaRevision ||
        row.fechaControl ||
        row.fecha_control ||
        ''

      const hora =
        row.hora ||
        row.horaRevision ||
        row.horaControl ||
        row.hora_control ||
        ''

      const responsableDni =
        row.realizadoPorDNI ??
        row.dni ??
        row.responsableDni

      const movilId =
        row.idMovil ??
        row.movilId

      const bombero = bomberos.find(b => b.dni === String(responsableDni))
      const responsable =
        bombero?.label ||
        row.responsable ||
        row.responsableNombre ||
        '-'

      const movilObj = moviles.find(m => String(m.idMovil) === String(movilId))
      const movil = movilObj
        ? `${movilObj.interno}${movilObj.dominio ? ' - ' + movilObj.dominio : ''}`
        : (row.movil || row.movilInterno || `#${movilId || '-'}`)

      // Estado revisión
      const estadoRevisionRaw =
        row.estado ||
        row.estadoControl ||
        (row.completado ? 'Completado' : 'Pendiente')

      const estadoRevision = String(estadoRevisionRaw || '').trim() || 'Pendiente'
      const isOkRevision =
        ['completado', 'ok', 'cerrado', 'finalizado'].includes(
          estadoRevision.toLowerCase()
        )

      // ESTADO DEL MÓVIL ✔ MOCK SI NO VIENE DEL BACKEND
      let estadoMovilRaw =
        row.estadoMovilActual ??
        row.estado_movil_actual ??
        row.estado_movil ??
        row.estadoMovil

      if (!estadoMovilRaw) {
        estadoMovilRaw = mockEstadoMovilRaw(row)
      }

      const { label: estadoMovilLabel, classes: estadoMovilClasses } =
        mapEstadoMovil(estadoMovilRaw)

      return (
        <tr key={row.idControl || `${movilId}-${fecha}-${responsableDni}`}>
          <td className='border-end px-3 text-center'>
            {formatFechaHora(fecha, hora)}
          </td>

          <td className='border-end px-3'>
            {responsable}
          </td>

          <td className='border-end px-3'>
            {movil}
          </td>

          <td className='border-end px-3 text-center'>
            <span
              className={`badge px-3 py-2 ${
                isOkRevision ? 'bg-success' : 'bg-warning text-dark'
              }`}
            >
              {estadoRevision}
            </span>
          </td>

          {/* ESTADO DEL MÓVIL */}
          <td className='px-3 text-center'>
            <span className={`badge px-3 py-2 ${estadoMovilClasses}`}>
              {estadoMovilLabel}
            </span>
          </td>
        </tr>
      )
    })

  return (
    <div className='container-fluid py-5 consultar-incidente registrar-guardia consultar-grupo'>
      {/* Título + icono */}
      <div className='text-center mb-4'>
        <div className='d-flex justify-content-center align-items-center gap-3 mb-3'>
          <div className='bg-danger p-3 rounded-circle'>
            <Car size={32} color='white' />
          </div>
          <h1 className='fw-bold text-white fs-3 mb-0'>Nuevo control de móvil</h1>
        </div>
      </div>

      {/* Card principal */}
      <div className='card edge-to-edge shadow-sm border-0 bg-white'>
        <div className='card-header bg-danger text-white d-flex align-items-center gap-2 py-4'>
          <i className='bi bi-clipboard-check fs-5'></i>
          <strong>Iniciar nuevo control</strong>
        </div>

        <div className='card-body'>
          {error && (
            <div className='alert alert-danger d-flex align-items-center'>
              <i className='bi bi-exclamation-triangle-fill me-2'></i>
              {error}
            </div>
          )}

          <form onSubmit={crear} className='row g-3'>
            <div className='col-12 col-md-4'>
              <label className='form-label'>Móvil</label>
              <select
                className='form-select'
                value={form.idMovil}
                onChange={e => {
                  setValue('idMovil', e.target.value)
                }}
                disabled={loadingData}
              >
                <option value=''>
                  {loadingData ? 'Cargando…' : 'Seleccioná un móvil…'}
                </option>
                {moviles.map(m => (
                  <option key={m.idMovil} value={m.idMovil}>
                    {m.interno} {m.dominio ? `- ${m.dominio}` : ''}
                  </option>
                ))}
              </select>
              <div className='form-text'>
                {loadingData ? ' ' : moviles.length ? `${moviles.length} móviles` : 'Sin datos'}
              </div>
            </div>

            <div className='col-12 col-md-4'>
              <label className='form-label'>Fecha</label>
              <input
                type='date'
                className='form-control'
                value={form.fecha}
                onChange={e => setValue('fecha', e.target.value)}
                disabled={loadingData}
              />
            </div>

            <div className='col-12 col-md-4'>
              <label className='form-label'>Responsable (Bombero)</label>
              <select
                className='form-select'
                value={form.realizadoPorDNI}
                onChange={e => setValue('realizadoPorDNI', e.target.value)}
                disabled={loadingData}
              >
                <option value=''>
                  {loadingData ? 'Cargando…' : 'Seleccioná un bombero…'}
                </option>
                {bomberos.map(b => (
                  <option key={b.dni} value={b.dni}>
                    {b.label}
                  </option>
                ))}
              </select>
              <div className='form-text'>
                {loadingData ? ' ' : bomberos.length ? `${bomberos.length} bomberos` : 'Sin datos'}
              </div>
            </div>

            <div className='col-12 d-flex flex-wrap gap-2 mt-2'>
              <button
                type='submit'
                className='btn btn-danger d-flex align-items-center gap-2 px-3 py-2'
                disabled={loading || loadingData}
              >
                {loading ? (
                  <>
                    <span className='spinner-border spinner-border-sm' role='status' />
                    Creando…
                  </>
                ) : (
                  'Iniciar control'
                )}
              </button>

              {onCancel && (
                <button
                  type='button'
                  className='btn btn-outline-secondary px-3 py-2'
                  onClick={onCancel}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          {/* Historial de controles */}
          <hr className='my-4' />

          <div className='rg-pager'>
            <div className='d-flex flex-wrap justify-content-between align-items-end mb-3 gap-3'>
              <h5 className='mb-0'>Historial de revisiones</h5>

              <div className='col-12 col-md-4'>
                <label className='form-label'>Filtrar por móvil</label>
                <select
                  className='form-select'
                  value={filtroMovilId}
                  onChange={e => {
                    setFiltroMovilId(e.target.value)
                  }}
                >
                  <option value=''>Todos los móviles</option>
                  {moviles.map(m => (
                    <option key={m.idMovil} value={m.idMovil}>
                      {m.interno} {m.dominio ? `- ${m.dominio}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Pagination
              fetchPage={fetchControlesPage}
              initialPage={1}
              initialPageSize={PAGE_SIZE_DEFAULT}
              filters={{ idMovil: filtroMovilId || undefined }}
              showControls
              labels={{
                prev: '‹ Anterior',
                next: 'Siguiente ›',
                of: '/',
                showing: (shown, total) => `Mostrando ${shown} de ${total} controles`
              }}
            >
              {({ items, loading: loadingHist, error: errorHist }) => (
                <>
                  {errorHist && (
                    <div className='alert alert-danger d-flex align-items-center'>
                      <i className='bi bi-exclamation-triangle-fill me-2'></i>
                      {String(errorHist)}
                    </div>
                  )}

                  {loadingHist && (
                    <div className='text-center mb-3'>
                      <div className='spinner-border text-danger' role='status' />
                    </div>
                  )}

                  {items.length > 0 ? (
                    <div className='table-responsive rounded border'>
                      <table className='table table-hover align-middle mb-0 rg-table'>
                        <thead className='bg-light'>
                          <tr>
                            <th className='border-end text-center'>Fecha de revisión</th>
                            <th className='border-end text-center'>Responsable</th>
                            <th className='border-end text-center'>Móvil</th>
                            <th className='border-end text-center'>Estado revisión</th>
                            <th className='text-center'>Estado del móvil</th>
                          </tr>
                        </thead>
                        <tbody>{renderHistorialRows(items)}</tbody>
                      </table>
                    </div>
                  ) : (
                    !loadingHist && (
                      <div className='text-center py-3 text-muted'>
                        No hay controles registrados para los filtros seleccionados.
                      </div>
                    )
                  )}
                </>
              )}
            </Pagination>
          </div>

          <hr className='mb-4 mt-4' />

          {onCancel && <BackToMenuButton onClick={onCancel} />}
        </div>
      </div>
    </div>
  )
}
