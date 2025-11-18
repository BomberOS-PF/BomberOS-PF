import { useState } from 'react'
import { API_URLS, apiRequest } from '../../config/api'
import { FileText, Printer, Search, Calendar as CalendarIcon, Eye } from 'lucide-react'
import Pagination from '../Common/Pagination'
import Select from 'react-select'
import { imprimirRUBA } from './imprimirRUBA'
import './RubaListado.css'

const PAGE_SIZE_DEFAULT = 10

const FiltrosIniciales = {
  busqueda: '',
  tipo: '',
  desde: '',
  hasta: ''
}

const NOMBRE_TIPO = {
  1: 'Accidente de Tránsito',
  2: 'Factores Climáticos',
  3: 'Incendio Estructural',
  4: 'Incendio Forestal',
  5: 'Material Peligroso',
  6: 'Rescate'
}

const getIncidentTypeColor = idTipoIncidente => {
  const coloresPorId = {
    1: 'bg-danger',
    2: 'bg-info',
    3: 'bg-warning',
    4: 'bg-success',
    5: 'bg-secondary',
    6: 'bg-primary'
  }
  return coloresPorId[idTipoIncidente] || 'bg-dark'
}

export default function RubaListado ({ usuario, onVolver }) {
  const [filtros, setFiltros] = useState(FiltrosIniciales)
  const [mensaje, setMensaje] = useState('')
  const [seleccionados, setSeleccionados] = useState([])

  const handleChange = e => {
    const { name, value } = e.target
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const limpiarFiltros = () => {
    setFiltros(FiltrosIniciales)
  }

  const fetchIncidentes = async ({ page, limit, filters }) => {
    const params = new URLSearchParams({
      pagina: page,
      limite: limit
    })

    if (filters.busqueda) params.append('busqueda', filters.busqueda.trim())
    if (filters.tipo) params.append('tipo', filters.tipo)
    if (filters.desde) params.append('desde', filters.desde)
    if (filters.hasta) params.append('hasta', filters.hasta)

    const url = `${API_URLS.incidentes.getAll}?${params.toString()}`
    const res = await apiRequest(url, { method: 'GET' })

    if (!res) return { data: [], total: 0 }
    if (Array.isArray(res)) return { data: res, total: res.length || 0 }

    if (typeof res === 'object') {
      return {
        data: res.data || [],
        total: res.total || (res.data ? res.data.length : 0)
      }
    }

    return { data: [], total: 0 }
  }

  const toggleSeleccion = idIncidente => {
    setSeleccionados(prev =>
      prev.includes(idIncidente)
        ? prev.filter(id => id !== idIncidente)
        : [...prev, idIncidente]
    )
  }

  const onImprimirFila = async idIncidente => {
    try {
      await imprimirRUBA(idIncidente, usuario || {}, { modo: 'download' })
    } catch (e) {
      console.error(e)
      setMensaje('❌ No se pudo generar el PDF RUBA')
      setTimeout(() => setMensaje(''), 3500)
    }
  }

  const onVerFila = async idIncidente => {
    try {
      await imprimirRUBA(idIncidente, usuario || {}, { modo: 'preview' })
    } catch (e) {
      console.error(e)
      setMensaje('❌ No se pudo previsualizar el RUBA')
      setTimeout(() => setMensaje(''), 3500)
    }
  }

  const onImprimirSeleccionados = async () => {
    if (!seleccionados.length) return

    try {
      for (const id of seleccionados) {
        // Para múltiples: solo generamos el doc y lo descargamos acá
        // eslint-disable-next-line no-await-in-loop
        const resultado = await imprimirRUBA(id, usuario || {}, { returnDoc: true })

        if (resultado && resultado.doc && resultado.fileName) {
          resultado.doc.save(resultado.fileName)
        }

        // Pequeño delay para que el navegador no bloquee múltiples descargas
        // eslint-disable-next-line no-await-in-loop
        await new Promise(resolve => setTimeout(resolve, 400))
      }
    } catch (e) {
      console.error(e)
      setMensaje('❌ Ocurrió un error al imprimir los RUBA seleccionados')
      setTimeout(() => setMensaje(''), 3500)
    }
  }

  return (
    <div className='container-fluid py-5'>
      <div className='text-center mb-4'>
        <div className='d-flex justify-content-center align-items-center gap-3 mb-3'>
          <div className='bg-danger p-3 rounded-circle'>
            <FileText size={32} color='white' />
          </div>
          <h1 className='fw-bold text-white fs-3 mb-0'>RUBA</h1>
        </div>
        <span className='badge bg-danger-subtle text-danger'>
          Listado de incidentes para imprimir e informar a RUBA
        </span>
      </div>

      <div className='card edge-to-edge shadow-sm border-0 bg-white'>
        <div className='card-header bg-danger text-white d-flex align-items-center gap-2 py-4'>
          <Search />
          <strong>Búsqueda y Listado</strong>
        </div>

        <div className='card-body'>
          {mensaje && (
            <div className={`alert ${mensaje.startsWith('❌') ? 'alert-danger' : 'alert-info'} mb-3`}>
              {mensaje}
            </div>
          )}

          {/* Filtros en una sola fila */}
          <div className='row g-3 mb-3 align-items-end'>
            {/* Buscar */}
            <div className='col-md-4'>
              <label className='form-label text-dark fw-semibold'>Buscar</label>
              <input
                type='text'
                className='form-control ruba-filtro-control'
                placeholder='Buscar por ID o descripción...'
                name='busqueda'
                value={filtros.busqueda}
                onChange={handleChange}
              />
            </div>

            {/* Tipo de incidente */}
            <div className='col-md-4'>
              <label className='form-label text-dark fw-semibold'>Tipo de Incidente</label>
              <Select
                classNamePrefix='ruba-select'
                placeholder='Todos los tipos'
                isClearable
                options={Object.entries(NOMBRE_TIPO).map(([value, label]) => ({
                  value,
                  label
                }))}
                value={
                  filtros.tipo
                    ? { value: filtros.tipo, label: NOMBRE_TIPO[Number(filtros.tipo)] }
                    : null
                }
                onChange={opt =>
                  setFiltros(prev => ({
                    ...prev,
                    tipo: opt ? opt.value : ''
                  }))
                }
              />
            </div>

            {/* Rango de fechas + botón limpiar */}
            <div className='col-md-4'>
              <label className='form-label text-dark fw-semibold d-flex align-items-center gap-2'>
                <CalendarIcon size={16} />
                Rango de fechas
              </label>

              <div className='d-flex align-items-end'>
                <div className='d-flex flex-grow-1 gap-2'>
                  <input
                    type='date'
                    name='desde'
                    className='form-control ruba-filtro-control'
                    value={filtros.desde}
                    onChange={handleChange}
                  />
                  <input
                    type='date'
                    name='hasta'
                    className='form-control ruba-filtro-control'
                    value={filtros.hasta}
                    onChange={handleChange}
                  />
                </div>

                <button
                  type='button'
                  className='btn btn-outline-secondary ruba-filtro-btn ms-2 flex-shrink-0'
                  onClick={limpiarFiltros}
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>

          {/* Botón imprimir seleccionados */}
          <div className='d-flex justify-content-between align-items-center mb-2'>
            <small className='text-muted'>
              Podés seleccionar varios incidentes para imprimir sus RUBA.
            </small>
            <button
              type='button'
              className='btn btn-danger btn-sm d-inline-flex align-items-center gap-2'
              onClick={onImprimirSeleccionados}
              disabled={!seleccionados.length}
            >
              <Printer size={16} />
              Imprimir seleccionados
              {seleccionados.length > 0 && ` (${seleccionados.length})`}
            </button>
          </div>

          {/* Listado paginado */}
          <Pagination
            fetchPage={fetchIncidentes}
            initialPage={1}
            initialPageSize={PAGE_SIZE_DEFAULT}
            filters={filtros}
            showControls
            labels={{
              prev: '‹ Anterior',
              next: 'Siguiente ›',
              of: '/',
              showing: (shown, total) => `Mostrando ${shown} de ${total} incidentes`
            }}
          >
            {({ items, loading, error }) => {
              const paginaSeleccionadaCompleta =
                items.length > 0 && items.every(it => seleccionados.includes(it.idIncidente))

              const toggleSeleccionPagina = () => {
                setSeleccionados(prev => {
                  if (paginaSeleccionadaCompleta) {
                    return prev.filter(id => !items.some(it => it.idIncidente === id))
                  }
                  const nuevos = items
                    .map(it => it.idIncidente)
                    .filter(id => !prev.includes(id))
                  return [...prev, ...nuevos]
                })
              }

              return (
                <>
                  {error && (
                    <div className='alert alert-danger d-flex align-items-center'>
                      <i className='bi bi-exclamation-triangle-fill me-2'></i>
                      {error}
                    </div>
                  )}

                  {loading && (
                    <div className='text-center mb-3'>
                      <div className='spinner-border text-danger' role='status' />
                    </div>
                  )}

                  {items.length > 0 ? (
                    <div className='table-responsive rounded border'>
                      <table className='table table-hover align-middle mb-0 rg-table'>
                        <thead className='bg-light'>
                          <tr>
                            <th
                              className='border-end text-center'
                              style={{ width: '40px' }}
                            >
                              <input
                                type='checkbox'
                                className='form-check-input'
                                checked={paginaSeleccionadaCompleta}
                                onChange={toggleSeleccionPagina}
                              />
                            </th>
                            <th className='border-end text-center'>ID</th>
                            <th className='border-end text-center'>Fecha</th>
                            <th className='border-end text-center'>Tipo</th>
                            <th className='border-end text-center'>Dirección</th>
                            <th className='border-end text-center'>Localización</th>
                            <th className='text-center'>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map(it => (
                            <tr key={it.idIncidente}>
                              <td className='border-end px-2 text-center'>
                                <input
                                  type='checkbox'
                                  className='form-check-input'
                                  checked={seleccionados.includes(it.idIncidente)}
                                  onChange={() => toggleSeleccion(it.idIncidente)}
                                />
                              </td>
                              <td className='border-end px-3 text-center fw-bold'>
                                {it.idIncidente}
                              </td>
                              <td className='border-end px-3'>{it.fecha}</td>
                              <td className='border-end px-3'>
                                <span className={`badge ${getIncidentTypeColor(it.idTipoIncidente)}`}>
                                  {it.tipoDescripcion || NOMBRE_TIPO[it.idTipoIncidente] || 'Tipo'}
                                </span>
                              </td>
                              <td className='border-end px-3'>{it.descripcion || '-'}</td>
                              <td className='border-end px-3'>{it.localizacion || '-'}</td>
                              <td className='text-center'>
                                <div className='btn-group' role='group'>
                                  <button
                                    className='btn btn-outline-secondary btn-sm'
                                    title='Ver RUBA en otra pestaña'
                                    onClick={() => onVerFila(it.idIncidente)}
                                    disabled={loading}
                                  >
                                    <Eye size={16} />
                                  </button>
                                  <button
                                    className='btn btn-danger btn-sm d-inline-flex align-items-center gap-2'
                                    title='RUBA'
                                    onClick={() => onImprimirFila(it.idIncidente)}
                                    disabled={loading}
                                  >
                                    <Printer size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    !loading && (
                      <div className='text-center py-3 text-muted'>
                        No hay resultados para la búsqueda.
                      </div>
                    )
                  )}
                </>
              )
            }}
          </Pagination>

          <hr className='mb-4' />

          <div className='d-flex'>
            <button className='btn btn-outline-secondary' onClick={onVolver}>
              Volver
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
