import { useEffect, useMemo, useRef, useState } from 'react'
import { apiRequest } from '../../../config/api'
import FormMovil from './FormMovil'
import '../flota.css'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import { Car } from 'lucide-react'
import { BackToMenuButton } from '../../Common/Button'
import Pagination from '../../Common/Pagination'
import Select from 'react-select'

const PAGE_SIZE_DEFAULT = 10

export default function ListarMoviles() {
    // UI & modo
    const [mode, setMode] = useState('list')
    const [editing, setEditing] = useState(null)
    const [error, setError] = useState('')

    // Filtros
    const [soloActivos, setSoloActivos] = useState(true)
    const [inputTexto, setInputTexto] = useState('')     // lo que escribe el usuario
    const [texto, setTexto] = useState('')               // valor debounced que usa la paginación
    const debounceRef = useRef(null)

    // Para forzar recargas del pager (por ej. tras borrar)
    const [pagerTick, setPagerTick] = useState(0)

    // Debounce de 400ms
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => setTexto(inputTexto.trim()), 400)
        return () => debounceRef.current && clearTimeout(debounceRef.current)
    }, [inputTexto])

    const onKeyDown = e => {
        if (e.key === 'Enter') {
            e.preventDefault()
            if (debounceRef.current) clearTimeout(debounceRef.current)
            setTexto(inputTexto.trim()) // aplica al instante
        }
    }

    const aplicarAhora = () => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        setTexto(inputTexto.trim())
    }

    const limpiar = () => {
        setInputTexto('')
        setTexto('')
    }

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
            setPagerTick(t => t + 1) // refresca la tabla
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

    const recargar = async () => {
        setMode('list')
        setEditing(null)
        setPagerTick(t => t + 1)
    }

    // ---- fetchPage para Pagination (server-side) ----
    const fetchMovilesPage = async ({ page, limit, filters }) => {
        setError('')

        const params = new URLSearchParams({
            pagina: String(page),
            limite: String(limit)
        })

        const q = (filters?.q || '').toString().trim()
        if (q) params.set('texto', q)
        if (String(filters?.activo) === '1') params.set('activo', '1')

        try {
            const resp = await apiRequest(`/api/flota/moviles?${params.toString()}`, { method: 'GET' })

            // Soporta ambos formatos de tu backend:
            // 1) arreglo directo
            // 2) { data: [], total: n }
            const data = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : [])
            const total = Number.isFinite(resp?.total) ? resp.total : data.length

            if (!Array.isArray(data)) throw new Error('Respuesta inválida del servidor')
            return { data, total }
        } catch (err) {
            setError('No se pudieron cargar los móviles')
            throw err
        }
    }

    const tableRows = (rows) => rows.map(row => (
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
        <div className='container-fluid py-5 consultar-incidente registrar-guardia consultar-grupo'>
            <div className='text-center mb-4'>
                <div className='d-flex justify-content-center align-items-center gap-3 mb-3'>
                    <div className='bg-danger p-3 rounded-circle'>
                        <Car size={32} color='white' />
                    </div>
                    <h1 className='fw-bold text-white fs-3 mb-0'>Gestionar Móviles</h1>
                </div>
                <span className='badge bg-danger-subtle text-danger'>
                    <i className='bi bi-fire me-2'></i> Sistema de Gestión de Personal - Cuartel de Bomberos
                </span>
            </div>

            <div className='card edge-to-edge shadow-sm border-0 bg-white'>
                <div className='card-header bg-danger text-white d-flex align-items-center gap-2 py-4'>
                    <i className='bi bi-person-fill fs-5'></i>
                    <strong>Gestionar Móviles</strong>
                </div>
                <div className='card-body'>
                    {/* Buscador superior (con icono) */}
                    <div className='mb-3 position-relative col-md-5'>
                        <i className='bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary'></i>
                        <input
                            type='text'
                            className='form-control border-secondary ps-5 py-2'
                            placeholder='Buscar por interno, dominio, marca o modelo'
                            value={inputTexto}
                            onChange={e => setInputTexto(e.target.value)}
                            onKeyDown={onKeyDown}
                        />
                    </div>
                    <div className='row g-3 align-items-center'>
                        {/* Switch + Nuevo móvil */}
                        <div className='col-12 col-lg-5 d-flex justify-content-lg-end align-items-center gap-3 flota-toolbar'>
                            <div className='form-check form-switch mb-0 only-thumb'>
                                <input
                                    className='form-check-input'
                                    type='checkbox'
                                    id='chkActivos'
                                    checked={soloActivos}
                                    onChange={e => setSoloActivos(e.target.checked)}
                                />
                                <label
                                    id='lbl-soloActivos'
                                    className='form-label text-dark d-flex align-items-center gap-2' htmlFor='soloActivos'>
                                    Mostrar solo activos
                                </label>
                            </div>

                            <button
                                className='btn btn-danger d-flex align-items-center gap-2 px-3 py-2'
                                style={{ width: 'fit-content' }}
                                onClick={nuevo}>
                                Nuevo móvil
                            </button>
                        </div>
                    </div>
                    {/* Paginador + tabla */}
                    <div className='rg-pager'>
                        <Pagination
                            fetchPage={fetchMovilesPage}
                            initialPage={1}
                            initialPageSize={PAGE_SIZE_DEFAULT}
                            filters={{ q: texto, activo: soloActivos ? 1 : 0, _tick: pagerTick }}
                            showControls
                            labels={{
                                prev: '‹ Anterior',
                                next: 'Siguiente ›',
                                of: '/',
                                showing: (shown, total) => `Mostrando ${shown} de ${total} móviles`
                            }}
                        >
                            {({ items, loading, error }) => (
                                <>
                                    {error && (
                                        <div className='alert alert-danger d-flex align-items-center'>
                                            <i className='bi bi-exclamation-triangle-fill me-2'></i>
                                            {String(error)}
                                        </div>
                                    )}

                                    {loading && (
                                        <div className='text-center mb-3'>
                                            <div className='spinner-border text-danger' role='status' />
                                        </div>
                                    )}

                                    {items.length > 0 ? (
                                        <div className='table-responsive rounded border'>
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
                                                <tbody>{tableRows(items)}</tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        !loading && (
                                            <div className='text-center py-3 text-muted'>
                                                No se encontraron móviles que coincidan con la búsqueda.
                                            </div>
                                        )
                                    )}
                                </>
                            )}
                        </Pagination>
                    </div>
                </div>
            </div>

            {error && <div className='alert alert-danger'>{error}</div>}
        </div>
    )
}
