import React, { useCallback } from 'react'
import { swalConfirm } from './swalBootstrap'

/**
 * Props:
 * - value: array de vehículos [{patente, modelo, marca, anio, aseguradora, poliza}]
 * - onChange: (nuevoArray) => void
 * - className?: string
 * - title?: string
 * - getEmptyItem?: () => objetoVehiculo  (para customizar el item vacío)
 */
const VehiculosFormList = ({
  value = [],
  onChange,
  className = '',
  title = 'Vehículos involucrados',
  getEmptyItem = () => ({ patente: '', modelo: '', marca: '', anio: '', aseguradora: '', poliza: '' }), onBeforeRemove
}) => {
  const handleChange = useCallback((index, field, val) => {
    const arr = Array.isArray(value) ? [...value] : []
    const actual = arr[index] || getEmptyItem()
    arr[index] = { ...actual, [field]: val }
    onChange?.(arr)
  }, [value, onChange, getEmptyItem])

  const agregar = useCallback(() => {
    onChange?.([...(Array.isArray(value) ? value : []), getEmptyItem()])
  }, [value, onChange, getEmptyItem])

  const eliminar = useCallback(async (index) => {
    // Si el padre provee confirmación, úsala:
    if (onBeforeRemove) {
      const ok = await onBeforeRemove(value[index])
      if (!ok) return
    } else {
      // Confirmación por defecto con SweetAlert
      const v = value[index] || {}
      const placa = v?.patente || v?.dominio || 'este vehículo'
      const r = await swalConfirm({
        title: 'Eliminar vehículo',
        html: `¿Confirmás eliminar <b>${placa}</b> de la lista?`,
        icon: 'warning',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      })
      if (!r.isConfirmed) return
    }
    const arr = (Array.isArray(value) ? value : []).filter((_, i) => i !== index)
    onChange?.(arr)
  }, [value, onChange, onBeforeRemove])

  return (
    <section className={className}>
      <h5 className="text-black mt-4">{title}</h5>

      {Array.isArray(value) && value.map((v, index) => (
        <div className="border rounded p-3 mb-3" key={index}>
          <div className="row mb-2">
            <div className="col">
              <label className="form-label text-dark d-flex align-items-center gap-2">Patente</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={v.patente || ''}
                onChange={e => handleChange(index, 'patente', e.target.value)}
              />
            </div>
            <div className="col">
              <label className="form-label text-dark d-flex align-items-center gap-2">Modelo</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={v.modelo || ''}
                onChange={e => handleChange(index, 'modelo', e.target.value)}
              />
            </div>
            <div className="col">
              <label className="form-label text-dark d-flex align-items-center gap-2">Marca</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={v.marca || ''}
                onChange={e => handleChange(index, 'marca', e.target.value)}
              />
            </div>
            <div className="col">
              <label className="form-label text-dark d-flex align-items-center gap-2">Año</label>
              <input
                type="number"
                className="form-control form-control-sm"
                value={v.anio ?? ''}
                onChange={e => {
                  const val = e.target.value
                  handleChange(index, 'anio', val === '' ? '' : Number(val))
                }}
              />
            </div>
            <div className="col">
              <label className="form-label text-dark d-flex align-items-center gap-2">Aseguradora</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={v.aseguradora || ''}
                onChange={e => handleChange(index, 'aseguradora', e.target.value)}
              />
            </div>
            <div className="col">
              <label className="form-label text-dark d-flex align-items-center gap-2">Póliza</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={v.poliza || ''}
                onChange={e => handleChange(index, 'poliza', e.target.value)}
              />
            </div>
          </div>



          <div className='d-inline-flex align-items-center justify-content-center gap-2 flex-nowrap actions-inline'>
            <div className="col-auto ms-auto d-flex actions-inline">
              <button
                type="button"
                className="btn btn-outline-danger btn-detail btn-trash action-trash"
                onClick={() => eliminar(index)}
              >
                <i className="bi bi-trash"></i>
              </button>
            </div>
          </div>

        </div>

      ))}

      <div className="d-flex justify-content-end align-items-center gap-3 mb-1">
        <button type="button" className="btn btn-added btn-detail" onClick={agregar}>
          + Agregar vehículo
        </button>
      </div>
    </section>
  )
}

export default VehiculosFormList
