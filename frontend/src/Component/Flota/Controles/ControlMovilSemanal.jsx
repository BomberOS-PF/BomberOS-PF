// frontend/src/Component/Flota/Controles/ControlMovilSemanal.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { apiRequest } from '../../../config/api'
import 'bootstrap/dist/css/bootstrap.min.css'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'

const OPC_OK_NO = ['OK', 'NO OK']
const OPC_OK_NO_INEX = ['OK', 'NO OK', 'INEXISTENTE']
const OPC_PORC = ['10%', '20%', '30%', '40%', '50%', '60%', '70%', '80%', '90%']

// Estados posibles del móvil luego del chequeo
const ESTADOS_MOVIL = [
  { value: 'OPERATIVO', label: 'Operativo' },
  { value: 'OPERATIVO_CON_OBS', label: 'Operativo con observaciones' },
  { value: 'FUERA_DE_SERVICIO', label: 'Fuera de servicio' }
]

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
        const h = await apiRequest(`/api/flota/controles/${controlId}`)
        const d = await apiRequest(`/api/flota/controles/definicion`)
        setHeader(h?.header || null)
        setDefs(Array.isArray(d) ? d : [])

        const init = {}
        h?.respuestas?.forEach(r => { init[r.clave] = r.valorTexto })

        if (h?.header?.observaciones) init.observaciones = h.header.observaciones
        if (h?.header?.estadoMovilActual) init.estadoMovil = h.header.estadoMovilActual

        setValues(init)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [controlId])

  const grupos = useMemo(() => {
    // Ocultamos el grupo "Observaciones" que traía el combo viejo
    const filtrados = defs.filter(it => it.grupo !== 'Observaciones')

    const map = new Map()
    for (const it of filtrados) {
      if (!map.has(it.grupo)) map.set(it.grupo, [])
      map.get(it.grupo).push(it)
    }
    return [...map.entries()]
  }, [defs])

  const opciones = clave => {
    if (clave.startsWith('luz_') || ['baterias_ok', 'corta_corriente_ok'].includes(clave)) return OPC_OK_NO
    if (clave.startsWith('neumatico_')) return OPC_PORC
    if (['gato', 'llave_cruz', 'tacos_madera', 'rueda_auxilio_inflada'].includes(clave)) return OPC_OK_NO_INEX
    if (
      [
        'presion_neumaticos',
        'encendido',
        'acople_bomba',
        'frenado',
        'direccion',
        'nivel_combustible',
        'nivel_aceite',
        'liquido_frenos',
        'liquido_refrigerante',
        'aceite_hidraulico'
      ].includes(clave)
    ) {
      return ['OK', 'BAJO', 'CRÍTICO']
    }
    return []
  }

  const enqueueSave = payload => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaving(true)
      try {
        const r = await fetch(`/api/flota/controles/${controlId}/respuestas`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ respuestas: payload })
        })
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
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
    if (!values.estadoMovil) {
      await Swal.fire({
        title: 'Estado del móvil requerido',
        text: 'Seleccioná el estado del móvil antes de finalizar el control.',
        icon: 'warning'
      })
      return
    }

    const { isConfirmed } = await Swal.fire({
      title: '¿Finalizar control?',
      text: 'Se guardarán el estado del móvil, las observaciones y se cerrará el control.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, finalizar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc3545'
    })
    if (!isConfirmed) return

    try {
      const camposCriticos = Object.entries(values)
        .filter(([clave, valor]) => valor === 'CRÍTICO')
        .map(([clave]) => clave)

      const r = await fetch(`/api/flota/controles/${controlId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          finalizado: 1,
          observaciones: values.observaciones || '',
          estadoMovilActual: values.estadoMovil,
          camposCriticos
        })
      })
      if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)

      await Swal.fire({
        title: 'Control finalizado',
        text: 'El control se cerró correctamente.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      })

      onFinalizado && onFinalizado()
    } catch (e) {
      await Swal.fire({
        title: 'No se pudo finalizar',
        text: 'Revisá la conexión o intentá nuevamente.',
        icon: 'error'
      })
    }
  }

  if (loading) return <div className='container py-3'>Cargando control…</div>

  return (
    <div className='container py-3 control-movil'>
      <div className='d-flex align-items-center justify-content-between mb-3'>
        <h4 className='mb-0'>Control – {header?.vehiculo?.interno || '#'}</h4>
        <div className='small text-muted'>{saving ? 'Guardando…' : 'Cambios guardados'}</div>
      </div>

      {!defs.length && (
        <div className='alert alert-warning'>
          No hay definición de ítems de control. Cargá la definición en la base.
        </div>
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
                          <option key={op} value={op}>
                            {op}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Card de estado del móvil + observaciones, igual estilo que las demás */}
        <div className='col-12'>
          <div className='card'>
            <div className='card-header fw-bold'>Estado general</div>
            <div className='card-body'>
              <div className='row g-3'>
                <div className='col-12 col-md-6'>
                  <label className='form-label'>Estado del móvil</label>
                  <select
                    className='form-select'
                    value={values.estadoMovil || ''}
                    onChange={e => setValue('estadoMovil', e.target.value)}
                  >
                    <option value=''>Seleccioná…</option>
                    {ESTADOS_MOVIL.map(op => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className='col-12'>
                  <label className='form-label'>Observaciones</label>
                  <textarea
                    className='form-control'
                    rows={4}
                    value={values.observaciones || ''}
                    onChange={e => setValues(v => ({ ...v, observaciones: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='d-flex gap-2 mt-3'>
        <button className='btn btn-danger' onClick={finalizar}>
          Finalizar control
        </button>
        {onVolver && (
          <button className='btn btn-outline-secondary' onClick={onVolver}>
            Volver
          </button>
        )}
      </div>

      <div className='mt-3 text-muted small'>
        Fecha: {header?.fecha ?? '-'} · Responsable DNI: {header?.realizadoPorDNI ?? '-'}
      </div>
    </div>
  )
}
