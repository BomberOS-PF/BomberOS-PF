import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { apiRequest } from '../../../config/api'
import FormMovil from './FormMovil'
import '../flota.css'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import { Car } from 'lucide-react'

export default function ListarMoviles() {
  const [items, setItems] = useState([])
  const [texto, setTexto] = useState('')
  const [soloActivos, setSoloActivos] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('list')
  const [editing, setEditing] = useState(null)

  const debounceRef = useRef(null)

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (texto?.trim()) qs.set('texto', texto.trim())
      if (soloActivos) qs.set('activo', '1')

      const data = await apiRequest(`/api/flota/moviles${qs.toString() ? `?${qs.toString()}` : ''}`)
      setItems(data || [])
    } catch (e) {
      setError('No se pudieron cargar los móviles')
    } finally {
      setLoading(false)
    }
  }, [texto, soloActivos])

  // Carga inicial
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Búsqueda dinámica con debounce cuando cambia el texto
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      load()
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [texto, load])

  // Cambio de switch: recarga inmediata
  useEffect(() => {
    load()
  }, [soloActivos, load])

  const onKeyDown = e => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (debounceRef.current) clearTimeout(debounceRef.current)
      load()
    }
  }

  const aplicarAhora = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    load()
  }

  const limpiar = () => {
    setTexto('')
    // forzar recarga sin texto
    if (debounceRef.current) clearTimeout(debounceRef.current)
    load()
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
          <div className='mb-3 position-relative col-md-5'>
            <i className='bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary'></i>
            <input
              type='text'
              className='form-control border-secondary ps-5 py-2'
              placeholder='Interno, dominio, marca o modelo'
              value={texto}
              onChange={e => setTexto(e.target.value)}
              onKeyDown={onKeyDown}
            />
          </div>
        </div>
      </div>

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
                  onKeyDown={onKeyDown}
                />
                {texto ? (
                  <button className='btn btn-outline-secondary' type='button' onClick={limpiar} title='Limpiar'>
                    <i className='bi bi-x-lg' />
                  </button>
                ) : null}
                <button className='btn btn-outline-primary' type='button' onClick={aplicarAhora} disabled={loading}>
                  {loading ? (
                    <>
                      <span className='spinner-border spinner-border-sm me-2' role='status' aria-hidden='true' />
                      Buscando...
                    </>
                  ) : 'Aplicar filtros'}
                </button>
              </div>
              <div className='form-text'>Se actualiza solo mientras escribís. Enter o “Aplicar filtros” fuerza la búsqueda</div>
            </div>

            {/* Switch + Nuevo móvil */}
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
