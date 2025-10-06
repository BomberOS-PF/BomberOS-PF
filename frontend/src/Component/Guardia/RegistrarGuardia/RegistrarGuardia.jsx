// src/Component/GrupoGuardia/RegistrarGuardia/RegistrarGuardia.jsx
import React, { useEffect, useState } from 'react'
import { API_URLS } from '../../../config/api'

import { Users, AlertTriangle, Plus, FileText } from 'lucide-react'
import '../../../../styles/global.css'
import { BackToMenuButton } from '../../Common/Button'
import Pagination from '../../Common/Pagination'

const PAGE_SIZE_DEFAULT = 10

const RegistrarGuardia = ({
  idGrupo,
  nombreGrupoInicial = '',
  descripcionInicial = '',
  bomberosIniciales = [],
  onVolver
}) => {
  const [nombreGrupo, setNombreGrupo] = useState(nombreGrupoInicial)
  const [descripcion, setDescripcion] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const [grupo, setGrupo] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // Para forzar recargas del listado de bomberos si hace falta
  const [reloadTick, setReloadTick] = useState(0)

  const modoEdicion = Boolean(idGrupo)

  useEffect(() => {
    if (modoEdicion) {
      setGrupo(bomberosIniciales)
      setDescripcion(descripcionInicial || '')
    }
  }, [modoEdicion, bomberosIniciales, descripcionInicial])

  const handleBusqueda = (e) => {
    setBusqueda(e.target.value)
    // no hace falta tocar página: Pagination resetea con filters
  }

  const agregarAlGrupo = (bombero) => {
    if (!grupo.find(b => b.dni === bombero.dni)) {
      setGrupo(prev => [...prev, bombero])
      setMensaje('')
    }
  }

  const quitarDelGrupo = (dni) => {
    setGrupo(prev => prev.filter(b => b.dni !== dni))
  }

  const guardarGrupo = async () => {
    if (!nombreGrupo.trim()) {
      setMensaje('Debes ingresar un nombre para el grupo.')
      return
    }
    if (grupo.length === 0) {
      setMensaje('Debes seleccionar al menos un bombero para el grupo.')
      return
    }
    setLoading(true)
    try {
      const endpoint = modoEdicion ? API_URLS.grupos.update(idGrupo) : API_URLS.grupos.create
      const method = modoEdicion ? 'PUT' : 'POST'
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombreGrupo, descripcion, bomberos: grupo.map(b => b.dni) })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setSuccessMessage(modoEdicion
          ? `✅ Grupo "${data.data.nombre}" actualizado correctamente`
          : `✅ Grupo "${data.data.nombre}" guardado con éxito`
        )
        setMensaje('')
        if (!modoEdicion) {
          setNombreGrupo('')
          setDescripcion('')
          setGrupo([])
        }
        // refrescamos la lista por si cambió alguna asignación
        setReloadTick(t => t + 1)
        setTimeout(() => {
          setSuccessMessage('')
          onVolver && onVolver()
        }, 1500)
      } else {
        setMensaje(data.message || 'Error al guardar el grupo')
      }
    } catch (error) {
      setMensaje('Error de conexión al guardar grupo')
    } finally {
      setLoading(false)
    }
  }

  // ---- fetchPage para Pagination (server-side) ----
  const fetchBomberosPage = async ({ page, limit, filters }) => {
    const params = new URLSearchParams({
      pagina: page,
      limite: limit
    })
    // el handler de bomberos usa 'busqueda'
    if (filters?.q) params.append('busqueda', String(filters.q).trim())

    const url = `${API_URLS.bomberos.buscar}?${params.toString()}`
    const res = await fetch(url)
    const data = await res.json().catch(() => ({}))

    if (!res.ok || !data?.success) {
      throw new Error(data?.message || 'Error al cargar bomberos')
    }

    // Agrupar por DNI y construir string de grupos
    const arr = Array.isArray(data.data) ? data.data : []
    const agrupadosPorDni = arr.reduce((acc, bombero) => {
      const grupos = bombero.grupoGuardia?.length ? bombero.grupoGuardia.join(', ') : 'No asignado'
      if (!acc[bombero.dni]) acc[bombero.dni] = { ...bombero, grupos }
      else acc[bombero.dni].grupos += `, ${grupos}`
      return acc
    }, {})
    const items = Object.values(agrupadosPorDni)
    const total = Number.isFinite(data.total) ? data.total : items.length

    // Mensaje vacío
    if (items.length === 0) setMensaje('No hay resultados para la búsqueda.')
    else setMensaje('')

    return { data: items, total }
  }

  return (
    <div className="container-fluid py-5 registrar-guardia">
      <div className="text-center mb-4">
        <div className="d-flex justify-content-center align-items-center gap-3 mb-3">
          <div className="bg-danger p-3 rounded-circle">
            <Users size={32} color="white" />
          </div>
          <h1 className="fw-bold text-white fs-3 mb-0">
            {modoEdicion ? 'Editar Grupo de Guardia' : 'Crear Grupo de Guardia'}
          </h1>
        </div>
        <span className="badge bg-danger-subtle text-danger">
          <AlertTriangle className="me-2" />
          Sistema de Gestión de Personal - Cuartel de Bomberos
        </span>
      </div>

      <div className="card edge-to-edge shadow-sm border-0 bg-white bg-opacity-1 backdrop-blur-sm">
        <div className="card-header bg-danger text-white d-flex align-items-center gap-2 py-4">
          <FileText />
          <strong>{modoEdicion ? 'Registrar cambios del grupo' : 'Registrar Grupo de Guardia'}</strong>
        </div>

        {mensaje && <div className="alert alert-warning text-center mb-0">{mensaje}</div>}
        {successMessage && <div className="alert alert-success text-center mb-0">{successMessage}</div>}

        {/* Card principal */}
        <div className="card-body">
          <div className="p-8 space-y-8">
            {/* Información del Grupo */}
            <div className="row mb-3">
              <div className="col-md-4">
                <label htmlFor="nombreGrupo" className="form-label text-dark d-flex align-items-center gap-2">Nombre del grupo</label>
                <input
                  type="text"
                  id="nombreGrupo"
                  value={nombreGrupo}
                  onChange={(e) => setNombreGrupo(e.target.value)}
                  placeholder="Ingrese el nombre del grupo"
                  className="form-control"
                />
              </div>

              <div className="col-md-4">
                <label htmlFor="descripcion" className="form-label text-dark d-flex align-items-center gap-2">
                  Descripción <span className="badge bg-secondary text-white text-uppercase">opcional</span>
                </label>
                <input
                  type='text'
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Descripción opcional del grupo"
                  className="form-control"
                />
              </div>
            </div>

            {/* Buscador */}
            <div className="mb-3 position-relative">
              <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-secondary"></i>
              <input
                type='text'
                placeholder="Buscar bombero por DNI, legajo, nombre o apellido"
                value={busqueda}
                onChange={handleBusqueda}
                className="form-control ps-5 py-3 border-secondary"
              />
            </div>

            {/* Listado de bomberos con paginación reutilizable */}
            <div className='rg-pager'>
              <Pagination
                fetchPage={fetchBomberosPage}
                initialPage={1}
                initialPageSize={PAGE_SIZE_DEFAULT}
                filters={{ q: busqueda, _tick: reloadTick }}
                showControls
                labels={{
                  prev: '‹ Anterior',
                  next: 'Siguiente ›',
                  of: '/',
                  showing: (shown, total) => `Mostrando ${shown} de ${total} bomberos`
                }}
              >
                {({ items, loading, error }) => (
                  <>
                    {error && (
                      <div className="alert alert-danger mb-3">
                        {String(error)}
                      </div>
                    )}

                    {loading && (
                      <div className="text-center mb-3">
                        <div className="spinner-border text-danger" role="status"></div>
                      </div>
                    )}

                    <div className="table-responsive rounded border">
                      <table className="table table-hover align-middle mb-0 rg-table">
                        <thead className="bg-light">
                          <tr>
                            <th className="border-end text-center">Nombre completo</th>
                            <th className="border-end text-center">DNI</th>
                            <th className="border-end text-center col-legajo">Legajo</th>
                            <th className="border-end text-center col-telefono">Teléfono</th>
                            <th className="border-end text-center col-grupo">Grupo</th>
                            <th className="text-center">Seleccionar</th>
                          </tr>
                        </thead>

                        <tbody>
                          {items.map((b) => {
                            const yaEstaEnGrupoActual = grupo.some((g) => g.dni === b.dni)
                            const asignado = b.grupos !== 'No asignado'

                            let perteneceAOtroGrupo = false
                            if (modoEdicion && asignado) {
                              const gruposAsignados = b.grupos.split(',').map((g) => g.trim().toLowerCase())
                              perteneceAOtroGrupo = !gruposAsignados.includes((nombreGrupo || '').toLowerCase())
                            } else if (!modoEdicion && asignado) {
                              perteneceAOtroGrupo = true
                            }

                            const deshabilitarBtn = yaEstaEnGrupoActual || perteneceAOtroGrupo
                            const mostrarTooltip = asignado

                            return (
                              <tr key={b.dni} className="border-b">
                                <td className="border-end px-3" data-label="Nombre">{b.nombre} {b.apellido}</td>
                                <td className="border-end px-3" data-label="DNI">{b.dni}</td>
                                <td className="border-end px-3" data-label="Legajo">{b.legajo || '-'}</td>
                                <td className="border-end px-3" data-label="Teléfono">{b.telefono}</td>
                                <td className="border-end px-3" data-label="Grupo">{b.grupos}</td>
                                <td className="border-end px-3 text-center" data-label="Acción">
                                  <div className="tooltip-container">
                                    <button
                                      onClick={() => agregarAlGrupo(b)}
                                      disabled={deshabilitarBtn}
                                      className={`btn-sm btn-add ${deshabilitarBtn ? 'disabled' : ''}`}
                                    >
                                      <Plus className="h-4 w-4" />
                                    </button>
                                    {mostrarTooltip && (
                                      <div className="tooltip">
                                        Pertenece a: {b.grupos}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {!loading && items.length === 0 && (
                      <div className="text-center py-3 text-muted">
                        {mensaje || 'No hay resultados para la búsqueda.'}
                      </div>
                    )}
                  </>
                )}
              </Pagination>
            </div>


            {/* Bomberos seleccionados */}
            <div className="mt-4">
              <div className="mb-3 d-flex align-items-center gap-2">
                <h5 className="mb-2 text-dark">Bomberos en el Grupo</h5>
              </div>

              <div className="table-responsive rounded border">
                <table className="table table-hover align-middle mb-0 rg-table">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-end text-center">Nombre completo</th>
                      <th className="border-end text-center">DNI</th>
                      <th className="border-end text-center col-legajo">Legajo</th>
                      <th className="border-end text-center col-telefono">Teléfono</th>
                      <th className="border-end text-center">Quitar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grupo.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center p-4 text-gray-500">
                          No hay bomberos seleccionados en el grupo
                        </td>
                      </tr>
                    ) : (
                      grupo.map((b) => (
                        <tr key={b.dni} className="border-b">
                          <td className="border-end text-center" data-label="Nombre">{b.nombre} {b.apellido}</td>
                          <td className="border-end text-center" data-label="DNI">{b.dni}</td>
                          <td className="border-end text-center" data-label="Legajo">{b.legajo || '-'}</td>
                          <td className="border-end text-center" data-label="Teléfono">{b.telefono}</td>
                          <td className="border-end text-center" data-label="Quitar">
                            <button
                              onClick={() => quitarDelGrupo(b.dni)}
                              className="btn btn-outline-danger btn-detail btn-trash"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        {/* Botones */}
        <div className="d-flex justify-content-center align-items-center gap-3 mb-3">
          <BackToMenuButton onClick={onVolver} />
          <button
            type="button"
            onClick={guardarGrupo}
            disabled={loading}
            className="btn btn-accept btn-lg btn-medium"
          >
            <Users size={16} className="me-1" />
            {loading ? 'Espere...' : modoEdicion ? 'Actualizar Grupo' : 'Guardar Grupo'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RegistrarGuardia
