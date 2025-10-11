import { useCallback } from 'react'
import { swalConfirm } from './swalBootstrap'

const validarTelefono = (telefono) => {
    if (!telefono) return true
    const cleaned = telefono.replace(/[^0-9+]/g, '')
    const numbersOnly = cleaned.replace(/\+/g, '')
    return /^[0-9+]+$/.test(cleaned) && numbersOnly.length >= 8 && numbersOnly.length <= 15
}

const validarDNI = (dni) => {
    if (!dni) return true
    return /^\d{7,10}$/.test(dni)
}

const damnificadoVacio = (d = {}) => {
    return !d.nombre && !d.apellido && !d.domicilio && !d.telefono && !d.dni && !d.fallecio
}

/**
 * Props:
 * - value: array de damnificados [{nombre,apellido,domicilio,telefono,dni,fallecio}]
 * - onChange: (nuevoArray) => void
 * - className?: string
 * - title?: string
 */
const DamnificadosForm = ({ value = [], onChange, className = '', title = 'Personas damnificadas', onBeforeRemove }) => {
    const handleChange = useCallback((index, field, val) => {
        const copia = Array.isArray(value) ? [...value] : []
        copia[index] = { ...copia[index], [field]: val }
        onChange?.(copia)
    }, [value, onChange])

    const agregar = useCallback(() => {
        onChange?.([
            ...(Array.isArray(value) ? value : []),
            { nombre: '', apellido: '', domicilio: '', telefono: '', dni: '', fallecio: false }
        ])
    }, [value, onChange])

    const eliminar = useCallback(async (index) => {
        // Si el padre provee confirmación, úsala:
        if (onBeforeRemove) {
            const ok = await onBeforeRemove(value[index])
            if (!ok) return
        } else {
            // Confirmación por defecto con SweetAlert
            const d = value[index] || {}
            const nombre = [d?.nombre, d?.apellido].filter(Boolean).join(' ') || 'este damnificado'
            const r = await swalConfirm({
                title: 'Eliminar damnificado',
                html: `¿Confirmás eliminar a <b>${nombre}</b>?`,
                icon: 'warning',
                confirmText: 'Eliminar',
                cancelText: 'Cancelar'
            })
            if (!r.isConfirmed) return
        }
        const copia = (Array.isArray(value) ? value : []).filter((_, i) => i !== index)
        onChange?.(copia)
    }, [value, onChange, onBeforeRemove])

    // Validación ligera por item (solo para feedback visual rápido)
    const getErroresItem = (d) => {
        if (damnificadoVacio(d)) return {}
        const e = {}
        if (!d.nombre) e.nombre = 'Campo obligatorio'
        if (!d.apellido) e.apellido = 'Campo obligatorio'
        if (d.telefono && !validarTelefono(d.telefono)) e.telefono = 'Teléfono inválido (8-15 dígitos)'
        if (d.dni && !validarDNI(d.dni)) e.dni = 'DNI inválido (7-10 dígitos)'
        return e
    }

    return (
        <section className={className}>
            <h5 className="text-black mt-4">{title}</h5>

            {Array.isArray(value) && value.map((d, index) => {
                const err = getErroresItem(d)
                return (
                    <div key={index} className="border rounded p-3 mb-3">
                        <div className="row mb-2">
                            <div className="col">
                                <label className="form-label text-dark d-flex align-items-center gap-2">Nombre</label>
                                <input
                                    type="text"
                                    className={`form-control ${err.nombre ? 'is-invalid' : ''}`}
                                    value={d.nombre || ''}
                                    onChange={e => handleChange(index, 'nombre', e.target.value)}
                                />
                                {err.nombre && <div className="invalid-feedback">{err.nombre}</div>}
                            </div>
                            <div className="col">
                                <label className="form-label text-dark d-flex align-items-center gap-2">Apellido</label>
                                <input
                                    type="text"
                                    className={`form-control ${err.apellido ? 'is-invalid' : ''}`}
                                    value={d.apellido || ''}
                                    onChange={e => handleChange(index, 'apellido', e.target.value)}
                                />
                                {err.apellido && <div className="invalid-feedback">{err.apellido}</div>}
                            </div>
                        </div>

                        <div className="mb-2">
                            <label className="form-label text-dark d-flex align-items-center gap-2">Domicilio</label>
                            <input
                                type="text"
                                className="form-control"
                                value={d.domicilio || ''}
                                onChange={e => handleChange(index, 'domicilio', e.target.value)}
                            />
                        </div>

                        <div className="row mb-2">
                            <div className="col">
                                <label className="form-label text-dark d-flex align-items-center gap-2">Teléfono</label>
                                <input
                                    type="tel"
                                    className={`form-control ${err.telefono ? 'is-invalid' : ''}`}
                                    value={d.telefono || ''}
                                    onChange={e => handleChange(index, 'telefono', e.target.value)}
                                />
                                {err.telefono && <div className="invalid-feedback">{err.telefono}</div>}
                            </div>
                            <div className="col">
                                <label className="form-label text-dark d-flex align-items-center gap-2">DNI</label>
                                <input
                                    type="text"
                                    className={`form-control ${err.dni ? 'is-invalid' : ''}`}
                                    value={d.dni || ''}
                                    onChange={e => handleChange(index, 'dni', e.target.value)}
                                />
                                {err.dni && <div className="invalid-feedback">{err.dni}</div>}
                            </div>
                        </div>

                        <div className="form-check mb-2">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                checked={!!d.fallecio}
                                onChange={e => handleChange(index, 'fallecio', e.target.checked)}
                            />
                            <label className="form-label text-dark d-flex align-items-center gap-2">¿Falleció?</label>
                        </div>

                        <div className='d-inline-flex align-items-center justify-content-center gap-2 flex-nowrap actions-inline'>
                            <button
                                type="button"
                                className="btn btn-outline-danger btn-detail btn-trash"
                                onClick={() => eliminar(index)}
                            >
                                <i className="bi bi-trash"></i>
                            </button>
                        </div>

                    </div>
                )
            })}

            <div className="d-flex justify-content-end align-items-center gap-3 mb-3">
                <button type="button" className="btn btn-added btn-detail" onClick={agregar}>
                    + Agregar damnificado
                </button>
            </div>
        </section>
    )
}

export default DamnificadosForm
