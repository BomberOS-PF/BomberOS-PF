// frontend/src/Component/Flota/Controles/ControlMovilSemanal.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { apiRequest } from '../../../config/api'
import 'bootstrap/dist/css/bootstrap.min.css'

const OPC_OK_NO = ['OK', 'NO OK']
const OPC_OK_NO_INEX = ['OK', 'NO OK', 'INEXISTENTE']
const OPC_PORC = ['10%','20%','30%','40%','50%','60%','70%','80%','90%']

export default function ControlMovilSemanal({ controlId, onFinalizado, onVolver }) {
  const [header, setHeader] = useState(null)
  const [defs, setDefs] = useState([])
  const [values, setValues] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const saveTimer = useRef(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        // 👇 Firma correcta del helper
        const h = await apiRequest(`/api/flota/controles/${controlId}`)
        const d = await apiRequest(`/api/flota/controles/definicion`)
        setHeader(h?.header || null)
        setDefs(Array.isArray(d) ? d : [])

        const init = {}
        h?.respuestas?.forEach(r => { init[r.clave] = r.valorTexto })
        if (h?.header?.observaciones) init.observaciones = h.header.observaciones
        setValues(init)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [controlId])

  const grupos = useMemo(() => {
    const map = new Map()
    for (const it of defs) {
      if (!map.has(it.grupo)) map.set(it.grupo, [])
      map.get(it.grupo).push(it)
    }
    return [...map.entries()]
  }, [defs])

  const opciones = clave => {
    if (clave.startsWith('luz_') || ['baterias_ok','corta_corriente_ok'].includes(clave)) return OPC_OK_NO
    if (clave.startsWith('neumatico_')) return OPC_PORC
    if (['gato','llave_cruz','tacos_madera','rueda_auxilio_inflada'].includes(clave)) return OPC_OK_NO_INEX
    if (['presion_neumaticos','encendido','acople_bomba','frenado','direccion',
         'nivel_combustible','nivel_aceite','liquido_frenos','liquido_refrigerante','aceite_hidraulico'].includes(clave))
      return ['OK','BAJO','CRÍTICO']
    return []
  }

  const enqueueSave = payload => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaving(true)
      try {
        // 👇 PUT con payload (sin armar headers ni stringify)
        await apiRequest('PUT', `/api/flota/controles/${controlId}/respuestas`, { respuestas: payload })
      } finally {
        setSaving(false)
      }
    }, 300)
  }

  const setValue = (clave, valorTexto) => {
    setValues(v => {
      const next = { ...v, [clave]: valorTexto }
      enqueueSave([{ clave, valorTexto }])
      return next
    })
  }

  const finalizar = async () => {
    await apiRequest('PUT', `/api/flota/controles/${controlId}`, {
      finalizado: 1,
      observaciones: values.observaciones || ''
    })
    onFinalizado && onFinalizado()
  }

  if (loading) return <div className='container py-3'>Cargando control…</div>

  return (
    <div className='container py-3'>
      <div className='d-flex align-items-center justify-content-between mb-3'>
        <h4 className='mb-0'>Control – {header?.vehiculo?.interno || '#'}</h4>
        <div className='small text-muted'>{saving ? 'Guardando…' : 'Cambios guardados'}</div>
      </div>

      {!defs.length && (
        <div className='alert alert-warning'>No hay definición de ítems de control. Cargá la definición en la base.</div>
      )}

      <div className='row g-3'>
        {grupos.map(([grupo, items]) => (
          <div className='col-12' key={grupo}>
            <div className='card'>
              <div className='card-header fw-bold'>{grupo}</div>
              <div className='card-body'>
                <div className='row g-3'>
                  {items.map(it => (
                    <div className='col-12 col-md-6 col-lg-4' key={it.idItem}>
                      <label className='form-label'>{it.etiqueta}</label>
                      <select
                        className='form-select'
                        value={values[it.clave] || ''}
                        onChange={e => setValue(it.clave, e.target.value)}
                      >
                        <option value=''>Seleccioná…</option>
                        {opciones(it.clave).map(op => (
                          <option key={op} value={op}>{op}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className='col-12'>
          <label className='form-label mt-3'>Observaciones</label>
          <textarea
            className='form-control'
            rows={4}
            value={values.observaciones || ''}
            onChange={e => setValues(v => ({ ...v, observaciones: e.target.value }))}
          />
        </div>
      </div>

      <div className='d-flex gap-2 mt-3'>
        <button className='btn btn-danger' onClick={finalizar}>Finalizar control</button>
        {onVolver && <button className='btn btn-outline-secondary' onClick={onVolver}>Volver</button>}
      </div>

      <div className='mt-3 text-muted small'>
        Fecha: {header?.fecha ?? '-'} · Responsable DNI: {header?.realizadoPorDNI ?? '-'}
      </div>
    </div>
  )
}
