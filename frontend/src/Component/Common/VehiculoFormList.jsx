// src/Component/Common/VehiculosFormList.jsx
import React, { useCallback } from 'react'

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
  getEmptyItem = () => ({ patente: '', modelo: '', marca: '', anio: '', aseguradora: '', poliza: '' })
}) => {
  const handleChange = useCallback((index, field, val) => {
    const arr = Array.isArray(value) ? [...value] : []
    const actual = arr[index] || getEmptyItem()
    arr[index] = { ...actual, [field]: val }
    onChange?.(arr)
  }, [value, onChange, getEmptyItem])

  const agregar = useCallback(() => {
    onChange?.([ ...(Array.isArray(value) ? value : []), getEmptyItem() ])
  }, [value, onChange, getEmptyItem])

  const eliminar = useCallback((index) => {
    if (!window.confirm('¿Eliminar este vehículo del formulario?')) return
    const arr = (Array.isArray(value) ? value : []).filter((_, i) => i !== index)
    onChange?.(arr)
  }, [value, onChange])

  return (
    <section className={className}>
      <h5 className="text-black mt-4">{title}</h5>

      {Array.isArray(value) && value.map((v, index) => (
        <div className="row mb-3 align-items-center border rounded" key={index}>
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
          <div className="d-flex justify-content-end py-3">
            <button
              type="button"
              className="btn btn-outline-danger btn-detail"
              onClick={() => eliminar(index)}
            >
              <i className="bi bi-trash"></i>
            </button>
          </div>
        </div>
        
      ))}

      <div className="d-flex justify-content-end align-items-center gap-3 mb-3">
        <button type="button" className="btn btn-added btn-detail" onClick={agregar}>
          + Agregar vehículo
        </button>
      </div>
    </section>
  )
}

export default VehiculosFormList
