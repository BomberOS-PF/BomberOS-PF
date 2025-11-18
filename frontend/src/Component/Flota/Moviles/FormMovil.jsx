// frontend/src/Component/Flota/Moviles/FormMovil.jsx
import { useEffect, useState } from 'react'
import { Car } from 'lucide-react'
import '../flota.css'
import { apiRequest } from '../../../config/api'

export default function FormMovil({ initialData = null, onSaved, onCancel }) {
  const [form, setForm] = useState({
    interno: '',
    dominio: '',
    marca: '',
    modelo: '',
    anio: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      const { interno, dominio, marca, modelo, anio } = initialData
      setForm({
        interno: interno || '',
        dominio: dominio || '',
        marca: marca || '',
        modelo: modelo || '',
        anio: anio || ''
      })
    }
  }, [initialData])

  const setValue = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const save = async e => {
    e.preventDefault()
    setError('')

    if (!form.interno || String(form.interno).trim() === '') {
      setError('El campo "Interno" es obligatorio')
      return
    }

    try {
      setLoading(true)
      const payload = {
        ...form,
        anio: form.anio ? Number(form.anio) : null
      }

      if (initialData?.idMovil) {
        await apiRequest(`/api/flota/moviles/${initialData.idMovil}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      } else {
        await apiRequest('/api/flota/moviles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }

      setLoading(false)
      onSaved && onSaved()
    } catch (e) {
      setLoading(false)
      setError(e?.message || 'No se pudo guardar el móvil')
    }
  }

  return (
    <div className='container-fluid py-5 consultar-incidente registrar-guardia consultar-grupo'>
      <div className='text-center mb-4'>
        <div className='d-flex justify-content-center align-items-center gap-3 mb-3'>
          <div className='bg-danger p-3 rounded-circle'>
            <Car size={32} />
          </div>
          <h1 className='fw-bold text-white fs-3 mb-0'>Gestionar Móviles</h1>
          <span className='badge bg-danger-subtle text-danger'>
            {initialData ? 'Editar móvil' : 'Nuevo móvil'}
            <i className='bi bi-fire me-2'></i> Sistema de Gestión de Personal - Cuartel de Bomberos
          </span>
        </div>
        <div className='card edge-to-edge shadow-sm border-0 bg-white'>
          <div className='card-header bg-danger text-white d-flex align-items-center gap-2 py-4'>
            <i className='bi bi-person-fill fs-5'></i>
            <strong>Gestionar Móviles</strong>
          </div>
          <div className='card-body'>
            <form onSubmit={save} className='row g-3'>
              <div className='col-12 col-md-4'>
                <label className='form-label text-dark d-flex align-items-center gap-2'>
                  <i className='bi bi-person text-danger'></i> Interno
                </label>
                <input
                  className={`form-control ${!form.interno && error ? 'is-invalid' : ''}`}
                  placeholder='Ej. MÓVIL 18'
                  value={form.interno}
                  onChange={e => setValue('interno', e.target.value)}
                />
                {!form.interno && error && (
                  <div className='invalid-feedback'>Campo obligatorio</div>
                )}
              </div>

              <div className='col-12 col-md-4'>
                <label className='form-label text-black'>Dominio</label>
                <input
                  className='form-control'
                  placeholder='AB123CD'
                  value={form.dominio}
                  onChange={e => setValue('dominio', e.target.value)}
                />
              </div>

              <div className='col-12 col-md-4'>
                <label className='form-label text-black'>Año</label>
                <input
                  type='number'
                  className='form-control'
                  placeholder='2020'
                  value={form.anio}
                  onChange={e => setValue('anio', e.target.value)}
                />
              </div>

              <div className='col-12 col-md-6'>
                <label className='form-label text-black'>Marca</label>
                <input
                  className='form-control'
                  placeholder='Ford, Toyota…'
                  value={form.marca}
                  onChange={e => setValue('marca', e.target.value)}
                />
              </div>

              <div className='col-12 col-md-6'>
                <label className='form-label text-black'>Modelo</label>
                <input
                  className='form-control'
                  placeholder='Ranger, Hilux…'
                  value={form.modelo}
                  onChange={e => setValue('modelo', e.target.value)}
                />
              </div>

              <div className='col-12 d-flex gap-2 justify-content-end mt-2'>
                <button type='submit' className='btn btn-danger' disabled={loading}>
                  {loading ? 'Guardando…' : 'Guardar'}
                </button>
                {onCancel && (
                  <button
                    type='button'
                    className='btn btn-outline-secondary'
                    onClick={onCancel}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
          {error && <div className='alert alert-danger mb-3'>{error}</div>}


        </div>
      </div>

    </div>
  )
}
