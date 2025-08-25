import { useMemo, useState } from 'react'
import { API_URLS, apiRequest } from '../../../config/api'
import '../../DisenioFormulario/DisenioFormulario.css'
import Pagination from '../../Common/Pagination'

const FiltrosIniciales = { busqueda: '', tipo: '', desde: '', hasta: '' }

const ConsultarIncidente = ({ onVolverMenu }) => {
  const [filtros, setFiltros] = useState(FiltrosIniciales)
  const [loadingFiltros, setLoadingFiltros] = useState(false)
  const [detalle, setDetalle] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFiltros(prev => ({ ...prev, [name]: value }))
  }

  // Build query (memorizado) según filtros
  const buildQuery = useMemo(() => {
    return (page, limit) => {
      const params = new URLSearchParams({ pagina: page, limite: limit })
      if (filtros.busqueda) params.append('busqueda', filtros.busqueda.trim())
      if (filtros.tipo) params.append('tipo', filtros.tipo)
      if (filtros.desde) params.append('desde', filtros.desde)
      if (filtros.hasta) params.append('hasta', filtros.hasta)
      return `${API_URLS.incidentes.getAll}?${params.toString()}`
    }
  }, [filtros])

  // Fetch que usa Pagination internamente
  const fetchPage = async ({ page, limit }) => {
    const url = buildQuery(page, limit)
    const res = await apiRequest(url, { method: 'GET' })

    if (!res) return { items: [], total: 0 }
    if (Array.isArray(res)) return { items: res, total: res.length }
    if (typeof res === 'object') return { items: res.data || [], total: res.total ?? (res.data ? res.data.length : 0) }
    return Promise.reject(new Error(typeof res === 'string' ? res : 'Respuesta inesperada del servidor'))
  }

  const verDetalle = async (id) => {
    try {
      setLoadingFiltros(true)
      const base = await apiRequest(API_URLS.incidentes.getDetalle(id), { method: 'GET' })
      setDetalle(base)
    } catch (e) {
      // El error lo muestra Pagination si fuera de lista; acá mostramos local:
      alert(e?.message || 'No se pudo cargar el detalle')
    } finally {
      setLoadingFiltros(false)
    }
  }

  const volverAlListado = () => setDetalle(null)

  const renderDetalleEspecifico = (idTipoIncidente, detalleEspecifico) => {
    if (!detalleEspecifico) return <div>Sin datos específicos para este incidente.</div>
    switch (Number(idTipoIncidente)) {
      case 1:
        return (
          <>
            <div className="mb-2"><strong>Causa:</strong> {detalleEspecifico?.causa?.descripcion || '-'}</div>
            <div className="mb-2">
              <strong>Vehículos involucrados</strong>
              <div className="table-responsive mt-2">
                <table className="table table-dark table-striped table-sm align-middle">
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

            <div className="mb-2">
              <strong>Damnificados</strong>
              <div className="table-responsive mt-2">
                <table className="table table-dark table-striped table-sm align-middle">
                  <thead><tr><th>Nombre</th><th>DNI</th><th>Teléfono</th><th>Falleció</th></tr></thead>
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
      case 3:
        return (
          <div className="row g-3">
            <div className="col-md-4"><span className="badge bg-danger">Fenómeno</span><div>{detalleEspecifico?.fenomeno || '-'}</div></div>
            <div className="col-md-4"><span className="badge bg-danger">Intensidad</span><div>{detalleEspecifico?.intensidad || '-'}</div></div>
            <div className="col-md-4"><span className="badge bg-danger">Duración</span><div>{detalleEspecifico?.duracion || '-'}</div></div>
            <div className="col-12"><span className="badge bg-danger">Detalle</span><div>{detalleEspecifico?.detalle || '-'}</div></div>
          </div>
        )
      case 4:
        return (
          <div className="row g-3">
            <div className="col-md-4"><span className="badge bg-danger">Estructura</span><div>{detalleEspecifico?.estructura || '-'}</div></div>
            <div className="col-md-4"><span className="badge bg-danger">Causa probable</span><div>{detalleEspecifico?.causaProbable || '-'}</div></div>
            <div className="col-md-4"><span className="badge bg-danger">Afectados</span><div>{detalleEspecifico?.afectados ?? '-'}</div></div>
            <div className="col-12"><span className="badge bg-danger">Detalle</span><div>{detalleEspecifico?.detalle || '-'}</div></div>
          </div>
        )
      case 5:
        return (
          <div className="row g-3">
            <div className="col-md-4"><span className="badge bg-danger">Características del lugar</span><div>{detalleEspecifico?.caracteristicasLugar || '-'}</div></div>
            <div className="col-md-4"><span className="badge bg-danger">Área afectada</span><div>{detalleEspecifico?.areaAfectada || '-'}</div></div>
            <div className="col-md-4"><span className="badge bg-danger">Cantidad afectada</span><div>{detalleEspecifico?.cantidadAfectada ?? '-'}</div></div>
            <div className="col-12"><span className="badge bg-danger">Causa probable</span><div>{detalleEspecifico?.causaProbable || '-'}</div></div>
            <div className="col-12"><span className="badge bg-danger">Detalle</span><div>{detalleEspecifico?.detalle || '-'}</div></div>
          </div>
        )
      case 6:
        return (
          <div className="row g-3">
            <div className="col-md-4"><span className="badge bg-danger">Categoría</span><div>{detalleEspecifico?.categoria || '-'}</div></div>
            <div className="col-md-4"><span className="badge bg-danger">Material</span><div>{detalleEspecifico?.material || detalleEspecifico?.tipoMaterial || '-'}</div></div>
            <div className="col-md-4"><span className="badge bg-danger">Acción sobre material</span><div>{detalleEspecifico?.accionMaterial || '-'}</div></div>
            <div className="col-12">
              <span className="badge bg-danger">Acciones sobre personas</span>
              <div>{Array.isArray(detalleEspecifico?.accionesPersona) && detalleEspecifico.accionesPersona.length > 0 ? detalleEspecifico.accionesPersona.join(', ') : '-'}</div>
            </div>
            <div className="col-12"><span className="badge bg-danger">Observaciones</span><div>{detalleEspecifico?.observaciones || detalleEspecifico?.detalle || '-'}</div></div>
          </div>
        )
      case 7:
        return (
          <div className="row g-3">
            <div className="col-md-4"><span className="badge bg-danger">Tipo de rescate</span><div>{detalleEspecifico?.tipo || '-'}</div></div>
            <div className="col-md-4"><span className="badge bg-danger">Personas</span><div>{detalleEspecifico?.personas ?? '-'}</div></div>
            <div className="col-12"><span className="badge bg-danger">Detalle</span><div>{detalleEspecifico?.detalle || '-'}</div></div>
          </div>
        )
      default:
        return <pre className="mb-0">{JSON.stringify(detalleEspecifico, null, 2)}</pre>
    }
  }

  // Vista Detalle
  if (detalle) {
    return (
      <div className="container d-flex justify-content-center align-items-start">
        <div className="formulario-consistente w-100">
          <h2 className="text-black mb-3">Detalle del incidente #{detalle?.idIncidente}</h2>

          <div className="card bg-dark text-white mb-3">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3"><span className="badge bg-danger">Tipo</span><div>{detalle?.tipoDescripcion || '-'}</div></div>
                <div className="col-md-3"><span className="badge bg-danger">Fecha</span><div>{detalle?.fecha || '-'}</div></div>
                <div className="col-12"><span className="badge bg-danger">Descripción</span><div>{detalle?.descripcion || '-'}</div></div>
                <div className="col-12"><span className="badge bg-danger">Localización</span><div>{detalle?.localizacion || '-'}</div></div>
              </div>
            </div>
          </div>

          <div className="card bg-dark text-white mb-3">
            <div className="card-header">Detalles específicos por tipo</div>
            <div className="card-body">
              {renderDetalleEspecifico(detalle?.idTipoIncidente, detalle?.detalleEspecifico)}
            </div>
          </div>

          <div className="text-center mt-3">
            <button className="btn btn-outline-dark me-2" onClick={volverAlListado}>Volver al listado</button>
            <button className="btn btn-secondary" onClick={onVolverMenu}>Volver al menú</button>
          </div>
        </div>
      </div>
    )
  }

  // Vista Listado con paginación inteligente
  return (
    <div className="container d-flex justify-content-center align-items-start">
      <div className="formulario-consistente w-100">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="text-black m-0">Consultar Incidentes</h2>
        </div>

        {/* Filtros */}
        <div className="card bg-dark text-white mb-3">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label text-white">Búsqueda</label>
                <input type="text" className="form-control" placeholder="ID, DNI, denunciante..." name="busqueda" value={filtros.busqueda} onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label className="form-label text-white">Tipo</label>
                <select className="form-select" name="tipo" value={filtros.tipo} onChange={handleChange}>
                  <option value="">Todos</option>
                  <option value="1">Accidente de Tránsito</option>
                  <option value="2">Factores Climáticos</option>
                  <option value="3">Incendio Estructural</option>
                  <option value="4">Incendio Forestal</option>
                  <option value="5">Material Peligroso</option>
                  <option value="6">Rescate</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label text-white">Desde</label>
                <input type="date" className="form-control" name="desde" value={filtros.desde} onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label className="form-label text-white">Hasta</label>
                <input type="date" className="form-control" name="hasta" value={filtros.hasta} onChange={handleChange} />
              </div>
            </div>

            {/* Acciones de filtros */}
            <div className="d-flex gap-2 mt-3">
              <button
                className="btn btn-danger"
                onClick={async () => { setLoadingFiltros(true); /* fuerza re-fetch por deps */ setLoadingFiltros(false) }}
                disabled={loadingFiltros}
                title="Aplicar filtros (se recarga la tabla abajo)"
              >
                {loadingFiltros ? 'Buscando...' : 'Aplicar filtros'}
              </button>
              <button
                className="btn btn-outline-light"
                onClick={() => setFiltros(FiltrosIniciales)}
                disabled={loadingFiltros}
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Paginación + Tabla (children) */}
        <Pagination
          fetchPage={fetchPage}
          deps={[filtros]}          // cuando cambien filtros, se resetea a pág 1 y recarga
          defaultPage={1}
          defaultLimit={10}
          className="mb-4"
        >
          {(items, { loading, error }) => (
            <>
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="table-responsive">
                <table className="table table-dark table-hover align-middle">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Descripción</th>
                      <th>Localización</th>
                      <th>Estado</th>
                      <th style={{ width: 140 }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!loading && items.length === 0) && (
                      <tr><td colSpan="7" className="text-center">No hay incidentes</td></tr>
                    )}
                    {items.map(it => (
                      <tr key={it.idIncidente}>
                        <td>{it.idIncidente}</td>
                        <td>{it.fecha}</td>
                        <td>{it.tipoDescripcion}</td>
                        <td>{it.descripcion || '-'}</td>
                        <td>{it.localizacion || '-'}</td>
                        <td>{it.estado || '-'}</td>
                        <td>
                          <button className="btn btn-sm btn-danger me-2" onClick={() => verDetalle(it.idIncidente)}>
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                    {loading && (
                      <tr><td colSpan="7" className="text-center">Cargando…</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Pagination>

        {/* Volver al menú */}
        <div className="text-center mt-2">
          <button className="btn btn-secondary" onClick={onVolverMenu}>Volver al menú</button>
        </div>
      </div>
    </div>
  )
}

export default ConsultarIncidente
