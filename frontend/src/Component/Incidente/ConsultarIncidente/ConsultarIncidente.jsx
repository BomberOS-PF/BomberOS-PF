import { useEffect, useState } from 'react'
import { API_URLS, apiRequest } from '../../../config/api'
import { FileText, Search } from 'lucide-react'
import { BackToMenuButton } from '../../Common/Button.jsx'
import Pagination from '../../Common/Pagination'
import Select from 'react-select'

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
  const [notificandoBomberos, setNotificandoBomberos] = useState(false)

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

  const notificarPorWhatsapp = async () => {
    if (!detalle?.idIncidente) {
      alert('❌ No hay incidente seleccionado para notificar')
      return
    }

    const confirmar = window.confirm(
      `¿Deseas notificar a los bomberos sobre el Incidente #${detalle.idIncidente}?\n\n` +
      `Tipo: ${detalle.tipoDescripcion}\n` +
      `Lugar: ${detalle.descripcion || 'No especificado'}\n\n` +
      `Se enviará una alerta por WhatsApp a todos los bomberos activos.`
    )

    if (!confirmar) return

    setNotificandoBomberos(true)

    try {
      console.log('📱 Enviando notificación WhatsApp para incidente:', detalle.idIncidente)

      const resp = await fetch(`/api/incidentes/${detalle.idIncidente}/notificar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      })

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}))
        throw new Error(errorData.message || `Error ${resp.status}: ${resp.statusText}`)
      }

      const resultado = await resp.json()

      if (resultado.success) {
        const { totalBomberos, notificacionesExitosas, notificacionesFallidas } = resultado.data
        alert(`🚨 ALERTA ENVIADA POR WHATSAPP ✅
        
📊 Resumen:
• Total bomberos: ${totalBomberos}
• Notificaciones exitosas: ${notificacionesExitosas}
• Notificaciones fallidas: ${notificacionesFallidas}

Los bomberos pueden responder "SI" o "NO" por WhatsApp para confirmar su asistencia.`)
        
        setMensaje('✅ Notificación enviada exitosamente a los bomberos')
        setTimeout(() => setMensaje(''), 5000)
      } else {
        throw new Error(resultado.message || 'Error al enviar notificación')
      }
    } catch (error) {
      console.error('❌ Error al notificar por WhatsApp:', error)
      alert(`❌ Error al notificar por WhatsApp: ${error.message}`)
      setErrorGlobal(`Error al notificar: ${error.message}`)
    } finally {
      setNotificandoBomberos(false)
    }
  }

  useEffect(() => {
    const incidenteParaCompletar = localStorage.getItem('incidenteParaCompletar')
    if (incidenteParaCompletar) {
      setIncidentePendiente({ idIncidente: incidenteParaCompletar })
      verDetalle(incidenteParaCompletar)
      setTimeout(() => {
        setModoEdicionEspecifica(true)
        setMensaje('💡 Completa los detalles específicos del tipo de incidente. El formulario está disponible más abajo.')
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


  // ------- Render del Detalle del Incidente -------
  const renderDetalleIncidente = () => {
    if (!detalle) return null

    return (
      <div className='mt-4'>
        <div className='d-flex align-items-center justify-content-between mb-3 detalle-header'>
          <div className='d-flex align-items-center gap-2'>
            <i className='text-secondary fs-5'></i>
            <h3 className='text-dark mb-0'>
              {modoEdicion
                ? `✏️ Editando: Incidente #${detalle?.idIncidente}`
                : `📋 Detalles: Incidente #${detalle?.idIncidente} - ${detalle?.tipoDescripcion}`
              }
            </h3>
          </div>

          <div className='d-flex gap-2 detalle-actions'>
            {!modoEdicion && (
              <>
                <button
                  className='btn btn-warning btn-sm d-flex align-items-center gap-1'
                  onClick={notificarPorWhatsapp}
                  disabled={loadingDetalle || notificandoBomberos}
                >
                  {notificandoBomberos ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Notificando...
                    </>
                  ) : (
                    <>
                      <i className='bi bi-megaphone'></i> Notificar Bomberos
                    </>
                  )}
                </button>
                <button
                  className='btn btn-primary btn-sm d-flex align-items-center gap-1'
                  onClick={activarEdicion}
                  disabled={loadingDetalle}
                >
                  <i className='bi bi-pencil-square'></i> Editar
                </button>
              </>
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
                  <div className='bg-danger icon-circle me-2'>
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
                      <div className='bg-danger p-2 icon-circle me-3'>
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


            </div>

          </div>
        </div>
      </div>
    )
  }

  // ------- Vista Listado -------
  return (
    <div className='container py-5 consultar-incidente'>
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

      <div className='card edge-to-edge shadow-sm border-0 bg-white'>
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

          {!detalle && (
            <>
              <div className='mb-3 position-relative col-md-3 search-box'>
                <i className='bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary'></i>
                <input
                  type='text'
                  className='form-control border-secondary ps-5 py-2'
                  placeholder='Buscar por ID...'
                  name='busqueda'
                  value={filtros.busqueda}
                  onChange={handleChange}
                />
              </div>

              <div className='row g-3 mb-3 align-items-end'>
                <div className='col-md-3'>
                  <label className='form-label text-dark fw-semibold'>Tipo de Incidente</label>
                  <Select
                    classNamePrefix="rs"
                    placeholder="Todos los tipos"
                    isClearable
                    options={[
                      { value: '1', label: 'Accidente de Tránsito' },
                      { value: '2', label: 'Factores Climáticos' },
                      { value: '3', label: 'Incendio Estructural' },
                      { value: '4', label: 'Incendio Forestal' },
                      { value: '5', label: 'Material Peligroso' },
                      { value: '6', label: 'Rescate' }
                    ]}
                    value={
                      filtros.tipo
                        ? {
                          value: filtros.tipo,
                          label: [
                            'Accidente de Tránsito',
                            'Factores Climáticos',
                            'Incendio Estructural',
                            'Incendio Forestal',
                            'Material Peligroso',
                            'Rescate'
                          ][Number(filtros.tipo) - 1]
                        }
                        : null
                    }
                    onChange={(opt) =>
                      setFiltros((prev) => ({ ...prev, tipo: opt ? opt.value : '' }))
                    }
                  />

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
                    onClick={() => { }}
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
                      <table className='table table-hover align-middle mb-0 responsive-table'>
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
                              <td className='border-end px-3 text-center fw-bold' data-label='ID'>{it.idIncidente}</td>
                              <td className='border-end px-3' data-label='Fecha'>{it.fecha}</td>
                              <td className='border-end px-3' data-label='Tipo'>
                                <span className={`badge ${getIncidentTypeColor(it.tipoDescripcion)}`}>
                                  {it.tipoDescripcion}
                                </span>
                              </td>
                              <td className='border-end px-3' data-label='Descripción'>{it.descripcion || '-'}</td>
                              <td className='border-end px-3' data-label='Localización'>{it.localizacion || '-'}</td>
                              <td className='border-end px-3' data-label='Estado'>
                                <span className='badge bg-success'>{it.estado || 'Activo'}</span>
                              </td>
                              <td className='text-center' data-label='Acciones'>
                                <button
                                  className='btn btn-outline-secondary btn-detail me-2'
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

          <hr className="mb-4" />
          
          <BackToMenuButton onClick={onVolverMenu} />
        </div>
      </div>
    </div>
  )
}

export default ConsultarIncidente
