// frontend/src/Component/Flota/Controles/NuevoControlMovil.jsx
import { useEffect, useState } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'

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

const normalizeArray = (data) => (Array.isArray(data) ? data : (data?.items || data?.data || []))

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

        // 2) Bomberos — preferimos el endpoint paginado existente
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

      // Detectar id de control en distintas formas
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

  return (
    <div className='container py-3'>
      <h4 className='mb-3'>Nuevo control de móvil</h4>

      {error && <div className='alert alert-danger'>{error}</div>}

      <form onSubmit={crear} className='row g-3'>
        <div className='col-12 col-md-4'>
          <label className='form-label'>Móvil</label>
          <select
            className='form-select'
            value={form.idMovil}
            onChange={e => setValue('idMovil', e.target.value)}
            disabled={loadingData}
          >
            <option value=''>{loadingData ? 'Cargando…' : 'Seleccioná un móvil…'}</option>
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
            <option value=''>{loadingData ? 'Cargando…' : 'Seleccioná un bombero…'}</option>
            {bomberos.map(b => (
              <option key={b.dni} value={b.dni}>{b.label}</option>
            ))}
          </select>
          <div className='form-text'>
            {loadingData ? ' ' : bomberos.length ? `${bomberos.length} bomberos` : 'Sin datos'}
          </div>
        </div>

        <div className='col-12 d-flex gap-2'>
          <button type='submit' className='btn btn-danger' disabled={loading || loadingData}>
            {loading ? 'Creando…' : 'Iniciar control'}
          </button>
          {onCancel && (
            <button type='button' className='btn btn-outline-secondary' onClick={onCancel}>
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
