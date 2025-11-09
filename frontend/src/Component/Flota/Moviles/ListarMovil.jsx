import { useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../../../config/api'
import FormMovil from './FormMovil'
import '../flota.css'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'


export default function ListarMoviles() {
    const [items, setItems] = useState([])
    const [texto, setTexto] = useState('')
    const [soloActivos, setSoloActivos] = useState(true)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [mode, setMode] = useState('list')
    const [editing, setEditing] = useState(null)

    const load = async () => {
        setError('')
        setLoading(true)
        try {
            const qs = new URLSearchParams()
            if (texto) qs.set('texto', texto)
            if (soloActivos) qs.set('activo', '1')

            const data = await apiRequest(`/api/flota/moviles${qs.toString() ? `?${qs.toString()}` : ''}`)
            setItems(data || [])
        } catch (e) {
            setError('No se pudieron cargar los móviles')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const nuevo = () => { setEditing(null); setMode('form') }
    const editar = row => { setEditing(row); setMode('form') }

    const eliminar = async (row) => {
  const resp = await Swal.fire({
    title: '¿Dar de baja el móvil?',
    html: `Vas a dar de baja el móvil <b>${row.interno}</b>.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, dar de baja',
    cancelButtonText: 'Cancelar',
    reverseButtons: true,
    confirmButtonColor: '#d33',
  })

  if (!resp.isConfirmed) return

  try {
    await apiRequest('DELETE', `/api/flota/moviles/${row.idMovil}`)
    await load()

    Swal.fire({
      icon: 'success',
      title: 'Móvil dado de baja',
      text: 'La baja lógica se realizó correctamente.',
      timer: 1600,
      showConfirmButton: false,
    })
  } catch (e) {
    Swal.fire({
      icon: 'error',
      title: 'No se pudo dar de baja',
      text: e?.message || 'Ocurrió un error inesperado.',
    })
  }
}


    const recargar = async () => { await load(); setMode('list'); setEditing(null) }

    const tableRows = useMemo(() =>
        items.map(row => (
            <tr key={row.idMovil}>
                <td className='text-nowrap fw-semibold'>{row.interno}</td>
                <td>{row.dominio || '-'}</td>
                <td>{row.marca || '-'}</td>
                <td>{row.modelo || '-'}</td>
                <td className='text-center'>{row.anio || '-'}</td>
                <td className='text-center'>
                    <span className={`badge px-3 py-2 ${row.activo ? 'bg-success' : 'bg-secondary'}`}>
                        {row.activo ? 'Activo' : 'Baja'}
                    </span>
                </td>
                <td className='text-end'>
                    <div className='btn-group'>
                        <button className='btn btn-sm btn-outline-primary' onClick={() => editar(row)}>Editar</button>
                        <button className='btn btn-sm btn-outline-danger' onClick={() => eliminar(row)}>Baja</button>
                    </div>
                </td>
            </tr>
        ))
        , [items])

    if (mode === 'form') {
        return (
            <div className='container py-3'>
                <FormMovil
                    initialData={editing}
                    onSaved={recargar}
                    onCancel={() => setMode('list')}
                />
            </div>
        )
    }

    return (
        <div className='container py-3'>
            {/* BARRA DE FILTROS + NUEVO */}
            <div className='card flota-card mb-3'>
                <div className='card-body'>
                    <div className='row g-3 align-items-center'>
                        {/* Buscador + botón Aplicar */}
                        <div className='col-12 col-lg-7'>
                            <label className='form-label'>Buscar</label>
                            <div className='input-group'>
                                <input
                                    className='form-control'
                                    placeholder='Interno, dominio, marca o modelo'
                                    value={texto}
                                    onChange={e => setTexto(e.target.value)}
                                />
                                <button className='btn btn-outline-primary' onClick={load}>
                                    Aplicar filtros
                                </button>
                            </div>
                        </div>

                        {/* Switch + Nuevo móvil (alineados a la derecha en desktop) */}
                        <div className='col-12 col-lg-5 d-flex justify-content-lg-end align-items-center gap-3 flota-toolbar'>
                            <div className='form-check form-switch switch-inline m-0'>
                                <input
                                    className='form-check-input'
                                    type='checkbox'
                                    id='chkActivos'
                                    checked={soloActivos}
                                    onChange={e => setSoloActivos(e.target.checked)}
                                />
                                <label className='form-check-label' htmlFor='chkActivos'>
                                    Mostrar solo activos
                                </label>
                            </div>

                            <button className='btn btn-danger' onClick={nuevo}>
                                Nuevo móvil
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {error && <div className='alert alert-danger'>{error}</div>}

            {/* Tabla */}
            <div className='card flota-card'>
                <div className='card-body p-0'>
                    {loading ? (
                        <div className='p-3'>Cargando…</div>
                    ) : (
                        <div className='table-responsive'>
                            <table className='table table-dark table-hover align-middle mb-0'>
                                <thead className='table-dark-subtle'>
                                    <tr>
                                        <th>Interno</th>
                                        <th>Dominio</th>
                                        <th>Marca</th>
                                        <th>Modelo</th>
                                        <th className='text-center'>Año</th>
                                        <th className='text-center'>Estado</th>
                                        <th className='text-end'>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.length ? (
                                        tableRows
                                    ) : (
                                        <tr>
                                            <td colSpan='7' className='text-center py-4 text-muted'>
                                                No hay móviles para mostrar
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
