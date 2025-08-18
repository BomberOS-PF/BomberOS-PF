import { useEffect, useMemo, useState } from 'react'
import { API_URLS, apiRequest } from '../../../config/api'
import '../../DisenioFormulario/DisenioFormulario.css'

const PAGE_SIZE_DEFAULT = 10

const FiltrosIniciales = {
  busqueda: '',
  tipo: '',
  desde: '',
  hasta: ''
}

const ConsultarIncidente = ({ onVolverMenu }) => {
  const [filtros, setFiltros] = useState(FiltrosIniciales)
  const [pagina, setPagina] = useState(1)
  const [limite, setLimite] = useState(PAGE_SIZE_DEFAULT)
  const [total, setTotal] = useState(0)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // incidente con detalle (de /incidentes/:id/detalle)
  const [detalle, setDetalle] = useState(null)

  const totalPaginas = useMemo(
    () => Math.max(1, Math.ceil(total / limite)),
    [total, limite]
  )

  const handleChange = (e) => {
    const { name, value } = e.target
    setFiltros(prev => ({ ...prev, [name]: value }))
  }

  // ------- Listado -------
  const buscar = async (resetPagina = true) => {
    try {
      setLoading(true)
      setError('')
      if (resetPagina) setPagina(1)

      const params = new URLSearchParams({
        pagina: resetPagina ? 1 : pagina,
        limite
      })
      if (filtros.busqueda) params.append('busqueda', filtros.busqueda.trim())
      if (filtros.tipo) params.append('tipo', filtros.tipo)
      if (filtros.desde) params.append('desde', filtros.desde)
      if (filtros.hasta) params.append('hasta', filtros.hasta)

      const url = `${API_URLS.incidentes.getAll}?${params.toString()}`
      const res = await apiRequest(url, { method: 'GET' })

      if (!res) {
        setItems([])
        setTotal(0)
      } else if (Array.isArray(res)) {
        setItems(res)
        setTotal(res.length || 0)
      } else if (typeof res === 'object') {
        setItems(res.data || [])
        setTotal(res.total || (res.data ? res.data.length : 0))
      } else {
        setError(typeof res === 'string' ? res : 'Respuesta inesperada del servidor')
        setItems([])
        setTotal(0)
      }
    } catch (e) {
      setError(e?.message || 'Error al consultar incidentes')
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  const cambiarPagina = async (nueva) => {
    if (nueva < 1 || nueva > totalPaginas) return
    setPagina(nueva)
    await buscar(false)
  }

  // ------- Ver detalle -------
  const verDetalle = async (id) => {
    try {
      setLoading(true)
      setError('')
      // Esta ruta debe devolver: datos base + detalleEspecifico
      const base = await apiRequest(API_URLS.incidentes.getDetalle(id), { method: 'GET' })
      setDetalle(base)
    } catch (e) {
      setError(e?.message || 'No se pudo cargar el detalle')
    } finally {
      setLoading(false)
    }
  }

  const volverAlListado = () => {
    setDetalle(null)
  }

  useEffect(() => { buscar(true) }, []) // cargar al entrar

  // ------- Render de Detalle Específico -------
  const renderDetalleEspecifico = (idTipoIncidente, detalleEspecifico) => {
    if (!detalleEspecifico) {
      return <div>Sin datos específicos para este incidente.</div>
    }

    switch (Number(idTipoIncidente)) {
      // 1) Accidente de Tránsito (ajustar ID real)
      case 1:
        return (
          <>
            <div className="mb-2">
              <strong>Causa:</strong> {detalleEspecifico?.causa?.descripcion || '-'}
            </div>

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

      // 2) Factores Climáticos -> tabla "climatico" (ajustar ID real)
      case 2:
      case 3:
        return (
          <div className="row g-3">
            <div className="col-md-4">
              <span className="badge bg-danger">Fenómeno</span>
              <div>{detalleEspecifico?.fenomeno || '-'}</div>
            </div>
            <div className="col-md-4">
              <span className="badge bg-danger">Intensidad</span>
              <div>{detalleEspecifico?.intensidad || '-'}</div>
            </div>
            <div className="col-md-4">
              <span className="badge bg-danger">Duración</span>
              <div>{detalleEspecifico?.duracion || '-'}</div>
            </div>
            <div className="col-12">
              <span className="badge bg-danger">Detalle</span>
              <div>{detalleEspecifico?.detalle || '-'}</div>
            </div>
          </div>
        )

      // 3) Incendio Estructural (ajustar ID real)
      case 4:
        return (
          <div className="row g-3">
            <div className="col-md-4"><span className="badge bg-danger">Estructura</span><div>{detalleEspecifico?.estructura || '-'}</div></div>
            <div className="col-md-4"><span className="badge bg-danger">Causa probable</span><div>{detalleEspecifico?.causaProbable || '-'}</div></div>
            <div className="col-md-4"><span className="badge bg-danger">Afectados</span><div>{detalleEspecifico?.afectados ?? '-'}</div></div>
            <div className="col-12"><span className="badge bg-danger">Detalle</span><div>{detalleEspecifico?.detalle || '-'}</div></div>
          </div>
        )

      // 4) Incendio Forestal (ajustar ID real)
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

      // 5) Materiales Peligrosos (ajustar ID real)
      case 6:
        return (
          <div className="row g-3">
            <div className="col-md-4"><span className="badge bg-danger">Categoría</span><div>{detalleEspecifico?.categoria || '-'}</div></div>
            <div className="col-md-4"><span className="badge bg-danger">Material</span><div>{detalleEspecifico?.material || detalleEspecifico?.tipoMaterial || '-'}</div></div>
            <div className="col-md-4"><span className="badge bg-danger">Acción sobre material</span><div>{detalleEspecifico?.accionMaterial || '-'}</div></div>
            <div className="col-12">
              <span className="badge bg-danger">Acciones sobre personas</span>
              <div>
                {Array.isArray(detalleEspecifico?.accionesPersona) && detalleEspecifico.accionesPersona.length > 0
                  ? detalleEspecifico.accionesPersona.join(', ')
                  : '-'}
              </div>
            </div>
            <div className="col-12"><span className="badge bg-danger">Observaciones</span><div>{detalleEspecifico?.observaciones || detalleEspecifico?.detalle || '-'}</div></div>
          </div>
        )

      // 6) Rescate (ajustar ID real)
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

  // ------- Vista Detalle -------
  if (detalle) {
    return (
      <div className="container d-flex justify-content-center align-items-start">
        <div className="formulario-consistente w-100">
          <h2 className="text-white mb-3">Detalle del incidente #{detalle?.idIncidente}</h2>

          <div className="card bg-dark text-white mb-3">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <span className="badge bg-danger">Tipo</span>
                  <div>{detalle?.tipoDescripcion || '-'}</div>
                </div>
                <div className="col-md-3">
                  <span className="badge bg-danger">Fecha</span>
                  <div>{detalle?.fecha || '-'}</div>
                </div>
                <div className="col-12">
                  <span className="badge bg-danger">Descripción</span>
                  <div>{detalle?.descripcion || '-'}</div>
                </div>
                <div className="col-12">
                  <span className="badge bg-danger">Localización</span>
                  <div>{detalle?.localizacion || '-'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Detalles específicos por tipo */}
          <div className="card bg-dark text-white mb-3">
            <div className="card-header">Detalles específicos por tipo</div>
            <div className="card-body">
              {renderDetalleEspecifico(detalle?.idTipoIncidente, detalle?.detalleEspecifico)}
            </div>
          </div>

          {/* Acciones abajo */}
          <div className="text-center mt-3">
            <button className="btn btn-outline-light me-2" onClick={volverAlListado}>Volver al listado</button>
            <button className="btn btn-secondary" onClick={onVolverMenu}>Volver al menú</button>
          </div>
        </div>
      </div>
    )
  }

  // ------- Vista Listado -------
  return (
    <div className="container d-flex justify-content-center align-items-start">
      <div className="formulario-consistente w-100">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="text-white m-0">Consultar Incidentes</h2>
        </div>

        {/* Filtros */}
        <div className="card bg-dark text-white mb-3">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label text-white">Búsqueda</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="ID, DNI, denunciante..."
                  name="busqueda"
                  value={filtros.busqueda}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label text-white">Tipo</label>
                <select
                  className="form-select"
                  name="tipo"
                  value={filtros.tipo}
                  onChange={handleChange}
                >
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
                <input
                  type="date"
                  className="form-control"
                  name="desde"
                  value={filtros.desde}
                  onChange={handleChange}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label text-white">Hasta</label>
                <input
                  type="date"
                  className="form-control"
                  name="hasta"
                  value={filtros.hasta}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Acciones de filtros */}
            <div className="d-flex gap-2 mt-3">
              <button className="btn btn-danger" onClick={() => buscar(true)} disabled={loading}>
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
              <button
                className="btn btn-outline-light"
                onClick={() => { setFiltros(FiltrosIniciales); setPagina(1); buscar(true) }}
                disabled={loading}
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {/* Tabla */}
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
              {items.length === 0 && !loading && (
                <tr>
                  <td colSpan="7" className="text-center">No hay incidentes</td>
                </tr>
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
                    <button
                      className="btn btn-sm btn-danger me-2"
                      onClick={() => verDetalle(it.idIncidente)}
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="d-flex justify-content-between align-items-center">
          <div className="text-white-50">Total: {total}</div>
          <div className="btn-group">
            <button
              className="btn btn-outline-light"
              onClick={() => cambiarPagina(pagina - 1)}
              disabled={pagina <= 1}
            >
              «
            </button>
            <span className="btn btn-outline-light disabled">
              {pagina} / {totalPaginas}
            </span>
            <button
              className="btn btn-outline-light"
              onClick={() => cambiarPagina(pagina + 1)}
              disabled={pagina >= totalPaginas}
            >
              »
            </button>
          </div>
        </div>

        {/* Volver al menú abajo */}
        <div className="text-center mt-4">
          <button className="btn btn-secondary" onClick={onVolverMenu}>
            Volver al menú
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConsultarIncidente
