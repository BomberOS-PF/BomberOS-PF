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
 // ---- fetchPage para el historial de controles ----
const fetchControlesPage = async ({ page, limit, filters }) => {
  const params = new URLSearchParams({
    pagina: String(page),
    limite: String(limit)
  })

  const idMovil = filters?.idMovil
  if (idMovil) params.set('idMovil', idMovil)

  try {
    const resp = await tryMany([
      `/api/flota/controles?${params.toString()}`,
      `/api/flota/controles/listar?${params.toString()}`
    ])

    const dataRaw = Array.isArray(resp?.data)
      ? resp.data
      : (Array.isArray(resp) ? resp : normalizeArray(resp))

    const total = Number.isFinite(resp?.total) ? resp.total : dataRaw.length

    if (!Array.isArray(dataRaw)) throw new Error('Respuesta inválida del servidor')

    // 🔹 acá hacemos el paginado en front
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

      const estadoRaw =
        row.estado ||
        row.estadoControl ||
        (row.completado ? 'Completado' : 'Pendiente')

      const estado = String(estadoRaw || '').trim() || 'Pendiente'
      const isOk = ['completado', 'ok', 'cerrado', 'finalizado'].includes(estado.toLowerCase())

      return (
        <tr key={row.idControl || `${movilId}-${fecha}-${responsableDni}`}>
          <td className='border-end px-3 text-center' data-label='Fecha revisión'>
            {fecha ? fecha.toString().slice(0, 10) : '-'}
          </td>
          <td className='border-end px-3' data-label='Responsable'>
            {responsable}
          </td>
          <td className='border-end px-3' data-label='Móvil'>
            {movil}
          </td>
          <td className='px-3 text-center' data-label='Estado'>
            <span className={`badge px-3 py-2 ${isOk ? 'bg-success' : 'bg-warning text-dark'}`}>
              {estado}
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
        <span className='badge bg-danger-subtle text-danger'>
          <i className='bi bi-fire me-2'></i>
          Sistema de Gestión de Flota Vehicular - Cuartel de Bomberos
        </span>
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
                onChange={e => setValue('idMovil', e.target.value)}
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

          {form.idMovil ? (
            <div className='rg-pager'>
              <h5 className='mb-3'>Historial de revisiones del móvil seleccionado</h5>

              <Pagination
                fetchPage={fetchControlesPage}
                initialPage={1}
                initialPageSize={PAGE_SIZE_DEFAULT}
                filters={{ idMovil: form.idMovil }}
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
                              <th className='text-center'>Estado</th>
                            </tr>
                          </thead>
                          <tbody>{renderHistorialRows(items)}</tbody>
                        </table>
                      </div>
                    ) : (
                      !loadingHist && (
                        <div className='text-center py-3 text-muted'>
                          No hay controles registrados para este móvil.
                        </div>
                      )
                    )}
                  </>
                )}
              </Pagination>
            </div>
          ) : (
            <div className='text-muted mt-2'>
              Seleccioná un móvil para ver el historial de revisiones.
            </div>
          )}

          <hr className='mb-4 mt-4' />

          {onCancel && <BackToMenuButton onClick={onCancel} />}
        </div>
      </div>
    </div>
  )
}
