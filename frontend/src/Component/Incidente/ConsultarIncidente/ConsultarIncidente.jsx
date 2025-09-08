import { useEffect, useState } from 'react'
import { API_URLS, apiRequest } from '../../../config/api'
import { FileText, Search } from 'lucide-react'
import '../../DisenioFormulario/DisenioFormulario.css'
import Pagination from '../../Common/Pagination'

// Importar formularios específicos de tipos de incidente
import AccidenteTransito from '../TipoIncidente/AccidenteTransito/AccidenteTransito'
import FactorClimatico from '../TipoIncidente/FactorClimatico/FactorClimatico'
import IncendioEstructural from '../TipoIncidente/IncendioEstructural/IncendioEstructural'
import IncendioForestal from '../TipoIncidente/IncendioForestal/IncendioForestal'
import MaterialPeligroso from '../TipoIncidente/MaterialPeligroso/MaterialPeligroso'
import Rescate from '../TipoIncidente/Rescate/Rescate'

const PAGE_SIZE_DEFAULT = 10

const FiltrosIniciales = {
  busqueda: '',
  tipo: '',
  desde: '',
  hasta: ''
}

// Mapeo de tipos de incidente a sus componentes específicos
const TIPO_INCIDENTE_COMPONENTS = {
  1: AccidenteTransito,      // Accidente de Tránsito
  2: FactorClimatico,        // Factores Climáticos
  3: IncendioEstructural,    // Incendio Estructural
  4: IncendioForestal,       // Incendio Forestal
  5: MaterialPeligroso,      // Material Peligroso
  6: Rescate                 // Rescate
}

const ConsultarIncidente = ({ onVolverMenu }) => {
  const [filtros, setFiltros] = useState(FiltrosIniciales)

  // incidente con detalle (de /incidentes/:id/detalle)
  const [detalle, setDetalle] = useState(null)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [modoEdicionEspecifica, setModoEdicionEspecifica] = useState(false)

  // estados propios del detalle (separados del listado/paginación)
  const [loadingDetalle, setLoadingDetalle] = useState(false)
  const [errorGlobal, setErrorGlobal] = useState('')

  // Incidente pendiente de completar (informativo)
  const [incidentePendiente, setIncidentePendiente] = useState(null)

  const getIncidentTypeColor = (tipoDescripcion) => {
    const colores = {
      'Accidente de tránsito': 'bg-danger',
      'Rescate': 'bg-primary',
      'Incendio forestal': 'bg-success',
      'Incendio estructural': 'bg-warning',
      'Factor climático': 'bg-info',
      'Material peligroso': 'bg-secondary'
    }
    return colores[tipoDescripcion] || 'bg-dark'
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFiltros(prev => ({ ...prev, [name]: value }))
  }

  // fetchPage para el componente Pagination
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
    if (typeof res === 'object') return { data: res.data || [], total: res.total || (res.data ? res.data.length : 0) }
    return { data: [], total: 0 }
  }

  // ------- Ver detalle -------
  const verDetalle = async (id) => {
    try {
      setLoadingDetalle(true)
      setErrorGlobal('')
      const url = `/api/incidentes/${id}/detalle`
      const base = await apiRequest(url, { method: 'GET' })
      setDetalle(base)
    } catch (e) {
      setErrorGlobal(e?.message || 'No se pudo cargar el detalle')
    } finally {
      setLoadingDetalle(false)
    }
  }

  const volverAlListado = () => {
    setDetalle(null)
    setModoEdicion(false)
    setModoEdicionEspecifica(false)
    setMensaje('')
    setErrorGlobal('')
  }

  const activarEdicion = () => {
    setModoEdicion(true)
    setMensaje('')
    setErrorGlobal('')
  }

  const guardarCambios = async (datosActualizados) => {
    if (!detalle?.idIncidente) return
    try {
      setLoadingDetalle(true)
      const response = await fetch(`/api/incidentes/${detalle.idIncidente}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosActualizados)
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      const result = await response.json()

      if (result.success) {
        setMensaje('✅ Incidente actualizado correctamente')
        setModoEdicion(false)
        setErrorGlobal('')
        setDetalle(prev => ({ ...prev, ...datosActualizados, ...result.data }))
        setTimeout(() => setMensaje(''), 3000)
      } else {
        setErrorGlobal(result.message || result.error || 'Error al actualizar el incidente')
        setMensaje('')
      }
    } catch (err) {
      setErrorGlobal(`Error de conexión: ${err.message}`)
    } finally {
      setLoadingDetalle(false)
    }
  }

  useEffect(() => {
    const incidenteParaCompletar = localStorage.getItem('incidenteParaCompletar')
    if (incidenteParaCompletar) {
      setIncidentePendiente({ idIncidente: incidenteParaCompletar })
      verDetalle(incidenteParaCompletar)
      setTimeout(() => {
        setModoEdicionEspecifica(true)
        setMensaje('💡 Completa los detalles específicos del tipo de incidente')
        setTimeout(() => setMensaje(''), 5000)
      }, 1500)
      localStorage.removeItem('incidenteParaCompletar')
    }
  }, [])

  // ------- Render de Formulario Específico Inline -------
  const renderFormularioEspecificoInline = () => {
    if (!detalle) return null

    const ComponenteEspecifico = TIPO_INCIDENTE_COMPONENTS[detalle.idTipoIncidente]
    if (!ComponenteEspecifico) {
      return (
        <div className='alert alert-warning mb-0'>
          <h6 className='mb-2'>⚠️ Formulario no disponible</h6>
          <p className='mb-0'>No hay un formulario específico disponible para este tipo de incidente.</p>
        </div>
      )
    }

    const datosCombinados = { ...detalle, ...(detalle.detalleEspecifico || {}) }

    return (
      <ComponenteEspecifico
        datosPrevios={datosCombinados}
        onFinalizar={(resultado) => {
          if (resultado.success) {
            setDetalle(null)
            setMensaje(resultado.message || '✅ Detalles específicos guardados correctamente')
            setErrorGlobal('')
            setModoEdicionEspecifica(false)
            setTimeout(() => setMensaje(''), 3000)
          } else {
            setErrorGlobal(resultado.message || 'Error al guardar los detalles específicos')
            setMensaje('')
          }
        }}
      />
    )
  }

  // ------- Render de Detalle Específico -------
  const renderDetalleEspecifico = (idTipoIncidente, detalleEspecifico) => {
    if (!detalleEspecifico) {
      return (
        <div className='text-center py-4'>
          <i className='bi bi-info-circle text-muted fs-1 mb-3 d-block'></i>
          <h6 className='text-muted mb-2'>Sin datos específicos para este incidente</h6>
          <p className='text-muted mb-0'>Haz clic en "Editar/Completar" para agregar los detalles específicos del tipo de incidente.</p>
        </div>
      )
    }

    switch (Number(idTipoIncidente)) {
      case 1:
        return (
          <>
            <div className='mb-2'>
              <strong>Causa:</strong> {detalleEspecifico?.causa?.descripcion || '-'}
            </div>

            <div className='mb-2'>
              <strong>Vehículos involucrados</strong>
              <div className='table-responsive mt-2'>
                <table className='table table-dark table-striped table-sm align-middle'>
                  <thead>
                    <tr>
                      <th>Patente</th><th>Marca</th><th>Modelo</th><th>Año</th><th>Aseguradora</th><th>Póliza</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(detalleEspecifico?.vehiculos || []).map(v => (
                      <tr key={v.idVehiculo}>
                        <td>{v.patente}</td><td>{v.marca}</td><td>{v.modelo}</td><td>{v.anio}</td>
                        <td>{v.aseguradora || '-'}</td><td>{v.poliza || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className='mb-2'>
              <strong>Damnificados</strong>
              <div className='table-responsive mt-2'>
                <table className='table table-dark table-striped table-sm align-middle'>
                  <thead>
                    <tr><th>Nombre</th><th>DNI</th><th>Teléfono</th><th>Falleció</th></tr>
                  </thead>
                  <tbody>
                    {(detalleEspecifico?.damnificados || []).map((d, i) => (
                      <tr key={i}>
                        <td>{`${d.nombre || ''} ${d.apellido || ''}`.trim()}</td>
                        <td>{d.dni || '-'}</td>
                        <td>{d.telefono || '-'}</td>
                        <td>{d.fallecio ? 'Sí' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )

      case 2:
        return (
          <div className='row g-3'>
            <div className='col-md-4'><span className='badge bg-danger'>Fenómeno</span><div>{detalleEspecifico?.fenomeno || '-'}</div></div>
            <div className='col-md-4'><span className='badge bg-danger'>Intensidad</span><div>{detalleEspecifico?.intensidad || '-'}</div></div>
            <div className='col-md-4'><span className='badge bg-danger'>Duración</span><div>{detalleEspecifico?.duracion || '-'}</div></div>
            <div className='col-12'><span className='badge bg-danger'>Detalle</span><div>{detalleEspecifico?.detalle || '-'}</div></div>
          </div>
        )

      case 3:
        return (
          <div className='row g-3'>
            <div className='col-md-4'><span className='badge bg-danger'>Estructura</span><div>{detalleEspecifico?.estructura || '-'}</div></div>
            <div className='col-md-4'><span className='badge bg-danger'>Causa probable</span><div>{detalleEspecifico?.causaProbable || '-'}</div></div>
            <div className='col-md-4'><span className='badge bg-danger'>Afectados</span><div>{detalleEspecifico?.afectados ?? '-'}</div></div>
            <div className='col-12'><span className='badge bg-danger'>Detalle</span><div>{detalleEspecifico?.detalle || '-'}</div></div>
          </div>
        )

      case 4:
        return (
          <div className='row g-3'>
            <div className='col-md-4'><span className='badge bg-danger'>Características del lugar</span><div>{detalleEspecifico?.caracteristicasLugar || '-'}</div></div>
            <div className='col-md-4'><span className='badge bg-danger'>Área afectada</span><div>{detalleEspecifico?.areaAfectada || '-'}</div></div>
            <div className='col-md-4'><span className='badge bg-danger'>Cantidad afectada</span><div>{detalleEspecifico?.cantidadAfectada ?? '-'}</div></div>
            <div className='col-md-6'><span className='badge bg-danger'>Causa probable</span><div>{detalleEspecifico?.causaProbable || detalleEspecifico?.idCausaProbable || '-'}</div></div>
            <div className='col-md-6'><span className='badge bg-danger'>Detalle</span><div>{detalleEspecifico?.detalle || '-'}</div></div>
          </div>
        )

      case 5:
        return (
          <div className='row g-3'>
            <div className='col-md-4'><span className='badge bg-danger'>Categoría</span><div>{detalleEspecifico?.categoria || '-'}</div></div>
            <div className='col-md-4'><span className='badge bg-danger'>Material</span><div>{detalleEspecifico?.material || detalleEspecifico?.tipoMaterial || '-'}</div></div>
            <div className='col-md-4'><span className='badge bg-danger'>Acción sobre material</span><div>{detalleEspecifico?.accionMaterial || '-'}</div></div>
            <div className='col-12'>
              <span className='badge bg-danger'>Acciones sobre personas</span>
              <div>
                {Array.isArray(detalleEspecifico?.accionesPersona) && detalleEspecifico.accionesPersona.length > 0
                  ? detalleEspecifico.accionesPersona.join(', ')
                  : '-'}
              </div>
            </div>
            <div className='col-12'><span className='badge bg-danger'>Observaciones</span><div>{detalleEspecifico?.observaciones || detalleEspecifico?.detalle || '-'}</div></div>
          </div>
        )

      case 6:
        return (
          <div className='row g-3'>
            <div className='col-md-4'><span className='badge bg-danger'>Tipo de rescate</span><div>{detalleEspecifico?.tipo || '-'}</div></div>
            <div className='col-md-4'><span className='badge bg-danger'>Personas</span><div>{detalleEspecifico?.personas ?? '-'}</div></div>
            <div className='col-12'><span className='badge bg-danger'>Detalle</span><div>{detalleEspecifico?.detalle || '-'}</div></div>
          </div>
        )

      default:
        return <pre className='mb-0'>{JSON.stringify(detalleEspecifico, null, 2)}</pre>
    }
  }

  // ------- Render del Detalle del Incidente -------
  const renderDetalleIncidente = () => {
    if (!detalle) return null

    return (
      <div className='mt-4'>
        <div className='d-flex align-items-center justify-content-between mb-3'>
          <div className='d-flex align-items-center gap-2'>
            <i className='text-secondary fs-5'></i>
            <h3 className='text-dark mb-0'>
              {modoEdicion
                ? `✏️ Editando: Incidente #${detalle?.idIncidente}`
                : `📋 Detalles: Incidente #${detalle?.idIncidente} - ${detalle?.tipoDescripcion}`
              }
            </h3>
          </div>

          <div>
            {!modoEdicion && (
              <button
                className='btn btn-warning btn-sm me-2 d-flex align-items-center gap-1'
                onClick={activarEdicion}
                disabled={loadingDetalle}
              >
                <i className='bi bi-pencil-square'></i> Editar
              </button>
            )}
            <button
              className='btn btn-outline-secondary btn-sm d-flex align-items-center gap-1'
              onClick={volverAlListado}
              disabled={loadingDetalle}
            >
              <i className='bi bi-arrow-left'></i> Volver al listado
            </button>
          </div>
        </div>

        <hr className='border-4 border-danger mb-4' />

        <div className='card bg-light border-0 shadow-sm py-4' style={{ borderRadius: '12px' }}>
          <div className='card-body'>

            <div>
              <div className='mb-4'>
                <div className='d-flex align-items-center mb-3 pb-2 border-bottom border-danger border-2'>
                  <div className='bg-danger p-2 rounded-circle me-3'>
                    <i className='bi bi-info-circle text-white fs-5'></i>
                  </div>
                  <h5 className='text-danger mb-0 fw-bold'>Información General del Incidente</h5>
                </div>
              </div>

              <div className='row mb-3'>
                <div className='col-md-4 py-3'>
                  <label className='form-label text-dark d-flex align-items-center gap-2 fw-semibold'>
                    <i className='bi bi-fire text-danger'></i> Tipo de Incidente
                  </label>
                  <input
                    type='text'
                    className='form-control border-secondary bg-light'
                    value={detalle?.tipoDescripcion || '-'}
                    disabled
                  />
                  <small className='text-muted'>No editable</small>
                </div>
                <div className='col-md-4 py-3'>
                  <label className='form-label text-dark d-flex align-items-center gap-2 fw-semibold'>
                    <i className='bi bi-calendar text-primary'></i> Fecha y Hora
                  </label>
                  <input
                    type='text'
                    className='form-control border-secondary bg-light'
                    value={detalle?.fecha || '-'}
                    disabled
                  />
                  <small className='text-muted'>No editable</small>
                </div>
                <div className='col-md-4 py-3'>
                  <label className='form-label text-dark d-flex align-items-center gap-2 fw-semibold'>
                    <i className='bi bi-info-circle text-success'></i> Estado
                  </label>
                  <input
                    type='text'
                    className='form-control border-secondary bg-light'
                    value={detalle?.estado || 'Activo'}
                    disabled
                  />
                  <small className='text-muted'>No editable</small>
                </div>
                <div className='col-12 py-3'>
                  <label className='form-label text-dark d-flex align-items-center gap-2 fw-semibold'>
                    <i className='bi bi-card-text text-warning'></i> Descripción
                  </label>
                  <textarea
                    className='form-control border-secondary bg-light'
                    rows='3'
                    value={detalle?.descripcion || ''}
                    onChange={(e) => setDetalle(prev => ({ ...prev, descripcion: e.target.value }))}
                    disabled={!modoEdicion}
                    placeholder='Descripción del incidente'
                  />
                </div>
                <div className='col-12 py-3'>
                  <label className='form-label text-dark d-flex align-items-center gap-2 fw-semibold'>
                    <i className='bi bi-geo-alt text-info'></i> Localización
                  </label>
                  <input
                    type='text'
                    className='form-control border-secondary bg-light'
                    value={detalle?.localizacion || ''}
                    onChange={(e) => setDetalle(prev => ({ ...prev, localizacion: e.target.value }))}
                    disabled={!modoEdicion}
                    placeholder='Ubicación del incidente'
                  />
                </div>
              </div>

              {modoEdicion && (
                <div className='d-grid gap-3 pt-3 border-top'>
                  <button
                    type='button'
                    className='btn btn-danger btn-lg'
                    disabled={loadingDetalle}
                    onClick={() => guardarCambios(detalle)}
                  >
                    {loadingDetalle ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                  <button
                    type='button'
                    className='btn btn-outline-secondary'
                    onClick={() => setModoEdicion(false)}
                    disabled={loadingDetalle}
                  >
                    Cancelar
                  </button>
                </div>
              )}

              <hr className='border-secondary my-4' />

              {modoEdicionEspecifica && (
                <div className='mt-5'>
                  <div className='d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-danger border-2'>
                    <div className='d-flex align-items-center'>
                      <div className='bg-danger p-2 rounded-circle me-3'>
                        <i className='bi bi-gear text-white fs-5'></i>
                      </div>
                      <h5 className='text-danger mb-0 fw-bold'>Detalles Específicos del Tipo de Incidente</h5>
                    </div>

                    {!modoEdicion && (
                      <button
                        className='btn btn-outline-secondary btn-sm d-flex align-items-center gap-1'
                        onClick={() => setModoEdicionEspecifica(false)}
                        disabled={loadingDetalle}
                      >
                        <i className='bi bi-x-circle'></i>
                        Cerrar
                      </button>
                    )}
                  </div>

                  <div className='bg-light rounded p-4 border'>
                    {renderFormularioEspecificoInline()}
                  </div>
                </div>
              )}

              {!modoEdicionEspecifica && !modoEdicion && (
                <div className='mt-4 text-center'>
                  <button
                    className='btn btn-primary d-flex align-items-center gap-2 mx-auto'
                    onClick={() => setModoEdicionEspecifica(true)}
                  >
                    <i className='bi bi-pencil-square'></i>
                    {detalle?.detalleEspecifico ? 'Editar Detalles Específicos' : 'Completar Detalles Específicos'}
                  </button>
                </div>
              )}

              <hr className='my-4' />

              <div>
                <h5 className='fw-bold mb-3'>Resumen de detalles específicos</h5>
                {renderDetalleEspecifico(detalle?.idTipoIncidente, detalle?.detalleEspecifico)}
              </div>

            </div>

          </div>
        </div>
      </div>
    )
  }

  // ------- Vista Listado -------
  return (
    <div className='container-fluid py-5'>
      <div className='text-center mb-4'>
        <div className='d-flex justify-content-center align-items-center gap-3 mb-3'>
          <div className='bg-danger p-3 rounded-circle'>
            <FileText size={32} color='white' />
          </div>
          <h1 className='fw-bold text-white fs-3 mb-0'>Consultar Incidentes</h1>
        </div>
        <span className='badge bg-danger-subtle text-danger'>
          <i className='bi bi-fire me-2'></i> Sistema de Gestión de Incidentes - Cuartel de Bomberos
        </span>
      </div>

      <div className='card shadow-sm border-0 bg-white'>
        <div className='card-header bg-danger text-white d-flex align-items-center gap-2 py-4'>
          <Search />
          <strong>Búsqueda y Listado de Incidentes</strong>
        </div>

        <div className='card-body'>

          {mensaje && (
            <div className={`alert ${mensaje.includes('Error') || mensaje.includes('No se') ? 'alert-danger' :
              mensaje.includes('✅') ? 'alert-success' : 'alert-info'} mb-3`}>
              {mensaje}
            </div>
          )}

          {incidentePendiente && (
            <div className='alert alert-info d-flex align-items-center mb-3'>
              <div className='me-3'>
                <i className='fas fa-info-circle fa-2x'></i>
              </div>
              <div className='flex-grow-1'>
                <h5 className='alert-heading mb-1'>🎯 Incidente #{incidentePendiente.idIncidente} listo para completar</h5>
                <p className='mb-2'>Este incidente fue creado recientemente y está pendiente de completar los detalles específicos del tipo de incidente.</p>
                <small className='text-muted'>💡 El detalle se ha abierto automáticamente abajo. Puedes editarlo haciendo clic en "Ver detalle".</small>
              </div>
              <button
                type='button'
                className='btn-close'
                onClick={() => setIncidentePendiente(null)}
                aria-label='Cerrar'
              ></button>
            </div>
          )}

          {!detalle && (
            <>
              <div className='mb-3 position-relative'>
                <i className='bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary'></i>
                <input
                  type='text'
                  className='form-control border-secondary ps-5 py-3'
                  placeholder='Buscar por ID, DNI, denunciante...'
                  name='busqueda'
                  value={filtros.busqueda}
                  onChange={handleChange}
                />
              </div>

              <div className='row g-3 mb-3 align-items-end'>
                <div className='col-md-3'>
                  <label className='form-label text-dark fw-semibold'>Tipo de Incidente</label>
                  <select
                    className='text-dark form-select border-secondary'
                    name='tipo'
                    value={filtros.tipo}
                    onChange={handleChange}
                  >
                    <option value=''>Todos los tipos</option>
                    <option value='1'>Accidente de Tránsito</option>
                    <option value='2'>Factores Climáticos</option>
                    <option value='3'>Incendio Estructural</option>
                    <option value='4'>Incendio Forestal</option>
                    <option value='5'>Material Peligroso</option>
                    <option value='6'>Rescate</option>
                  </select>
                </div>
                <div className='col-md-3'>
                  <label className='form-label text-dark fw-semibold'>Fecha Desde</label>
                  <input
                    type='date'
                    className='form-control border-secondary bg-light'
                    name='desde'
                    value={filtros.desde}
                    onChange={handleChange}
                  />
                </div>
                <div className='col-md-3'>
                  <label className='form-label text-dark fw-semibold'>Fecha Hasta</label>
                  <input
                    type='date'
                    className='form-control border-secondary bg-light'
                    name='hasta'
                    value={filtros.hasta}
                    onChange={handleChange}
                  />
                </div>
                <div className='col-md-3 d-flex'>
                  {/* Los filtros ya disparan reload automático del Pagination */}
                  <button
                    className='btn btn-danger d-flex align-items-center gap-2 px-3 py-2'
                    onClick={() => {}}
                    style={{ width: 'fit-content' }}
                  >
                    <i className='bi bi-search'></i>
                    Aplicar filtros
                  </button>
                </div>
              </div>
            </>
          )}

          {!detalle && (
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
              {({ items, loading, error }) => (
                <>
                  {error && (
                    <div className='alert alert-danger d-flex align-items-center'>
                      <i className='bi bi-exclamation-triangle-fill me-2'></i>
                      {error}
                    </div>
                  )}

                  {loading && (
                    <div className='text-center mb-3'>
                      <div className='spinner-border text-danger' role='status'></div>
                    </div>
                  )}

                  {items.length > 0 ? (
                    <div className='table-responsive rounded border'>
                      <table className='table table-hover align-middle mb-0'>
                        <thead className='bg-light'>
                          <tr>
                            <th className='border-end text-center'>ID</th>
                            <th className='border-end text-center'>Fecha</th>
                            <th className='border-end text-center'>Tipo</th>
                            <th className='border-end text-center'>Descripción</th>
                            <th className='border-end text-center'>Localización</th>
                            <th className='border-end text-center'>Estado</th>
                            <th className='text-center'>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map(it => (
                            <tr key={it.idIncidente}>
                              <td className='border-end px-3 text-center fw-bold'>{it.idIncidente}</td>
                              <td className='border-end px-3'>{it.fecha}</td>
                              <td className='border-end px-3'>
                                <span className={`badge ${getIncidentTypeColor(it.tipoDescripcion)}`}>
                                  {it.tipoDescripcion}
                                </span>
                              </td>
                              <td className='border-end px-3'>{it.descripcion || '-'}</td>
                              <td className='border-end px-3'>{it.localizacion || '-'}</td>
                              <td className='border-end px-3'>
                                <span className='badge bg-success'>{it.estado || 'Activo'}</span>
                              </td>
                              <td className='text-center'>
                                <button
                                  className='btn btn-outline-secondary btn-sm me-2'
                                  onClick={() => verDetalle(it.idIncidente)}
                                  disabled={loading || loadingDetalle}
                                >
                                  <i className='bi bi-eye me-1'></i> Ver
                                </button>
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
              )}
            </Pagination>
          )}

          {renderDetalleIncidente()}

          <div className='d-grid gap-3 py-2 mt-4'></div>
          <button
            type='button'
            className='btn btn-secondary'
            onClick={() => onVolverMenu && onVolverMenu()}
            disabled={loadingDetalle}
          >
            Volver al menú
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConsultarIncidente
