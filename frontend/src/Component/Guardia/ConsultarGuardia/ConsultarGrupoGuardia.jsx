import React, { useEffect, useState } from 'react'
import { API_URLS } from '../../../config/api'
import '../RegistrarGuardia.css'
import RegistrarGuardia from '../RegistrarGuardia/RegistrarGuardia'
import '../../DisenioFormulario/DisenioFormulario.css'
import ConsultarBomberosDelGrupo from './ConsultarBomberosDelGrupo'

const ConsultarGrupoGuardia = ({ onVolver }) => {
  const [busqueda, setBusqueda] = useState('')
  const [paginaActual, setPaginaActual] = useState(1)
  const [limite] = useState(10)
  const [total, setTotal] = useState(0)
  const [grupos, setGrupos] = useState([])
  const [bomberosDelGrupo, setBomberosDelGrupo] = useState([])
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(false)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null)

  useEffect(() => {
    fetchGrupos()
  }, [paginaActual, busqueda])

  const fetchGrupos = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URLS.grupos.buscar}?pagina=${paginaActual}&limite=${limite}&busqueda=${busqueda}`)
      const data = await res.json()
      if (res.ok && data.success) {
        setGrupos(data.data || [])
        setTotal(data.total || 0)
        setMensaje('')
      } else {
        setMensaje(data.message || 'Error al obtener grupos')
        setGrupos([])
      }
    } catch (error) {
      setMensaje('Error de conexión al obtener grupos')
    } finally {
      setLoading(false)
    }
  }

  const eliminarGrupo = async (grupo) => {
    if (!window.confirm(`¿Eliminar grupo "${grupo.nombre}"?`)) return
    setLoading(true)
    try {
      const res = await fetch(API_URLS.grupos.delete(grupo.idGrupo), { method: 'DELETE' })
      const result = await res.json()
      if (res.ok && result.success) {
        setMensaje('Grupo eliminado correctamente')
        fetchGrupos()
      } else {
        setMensaje(result.message || 'No se pudo eliminar el grupo')
      }
    } catch (error) {
      setMensaje('Error al eliminar grupo')
    } finally {
      setLoading(false)
    }
  }

  const fetchBomberosDelGrupo = async (idGrupo) => {
    setLoading(true)
    try {
      
      const res = await fetch(API_URLS.grupos.obtenerBomberosDelGrupo(idGrupo))
      const data = await res.json()
      if (res.ok && data.success) {
        setBomberosDelGrupo(data.data || [])
        const grupo = grupos.find(g => g.idGrupo === idGrupo)
        setGrupoSeleccionado(grupo)
        setMensaje('')
      } else {
        setMensaje(data.message || 'No se pudieron obtener los bomberos del grupo')
      }
    } catch (error) {
      setMensaje('Error de conexión al obtener bomberos del grupo')
    } finally {
      setLoading(false)
    }
  }

  const volverListado = () => {
    setGrupoSeleccionado(null)
    setBomberosDelGrupo([])
    setMensaje('')
  }

  const handleBusqueda = (e) => {
    setBusqueda(e.target.value)
    setPaginaActual(1)
  }

  const editarGrupo = (grupo) => {
  setGrupoSeleccionado(grupo)
  setModoEdicion(true)
  }

if (modoEdicion && grupoSeleccionado) {
  return (
    <RegistrarGuardia
      idGrupo={grupoSeleccionado.idGrupo}
      nombreGrupoInicial={grupoSeleccionado.nombre}
      bomberosIniciales={bomberosDelGrupo}
      onVolver={() => {
        setModoEdicion(false)
        volverListado()
      }}
    />
  )
}

if (grupoSeleccionado) {
  return (
    <ConsultarBomberosDelGrupo
      idGrupo={grupoSeleccionado.idGrupo}
      nombreGrupo={grupoSeleccionado.nombre}
      bomberos={bomberosDelGrupo}
      onVolver={volverListado}
      mensaje={mensaje}
      loading={loading}
      onEditar={editarGrupo}
    />
  )
}


  return (
    <div className="container mt-4 formulario-consistente">
      <h2 className="text-black mb-3">Grupos de Guardias</h2>
      {mensaje && <div className="alert alert-warning">{mensaje}</div>}

      <input
        type="text"
        className="form-control mb-3"
        placeholder="Buscar por nombre del grupo"
        value={busqueda}
        onChange={handleBusqueda}
      />

      <div className="table-responsive">
        <table className="tabla-bomberos mt-3">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {grupos.map((grupo) => (
              <tr key={grupo.idGrupo}>
                <td>{grupo.nombre}</td>
                <td>-</td>
                <td>
                  <button
                    className="btn btn-outline-light btn-sm me-2"
                    onClick={() => fetchBomberosDelGrupo(grupo.idGrupo)}
                    disabled={loading}
                  >
                    Ver detalles
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => eliminarGrupo(grupo)}
                    disabled={loading}
                    title="Eliminar grupo"
                  >
                    ❌
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {grupos.length === 0 && !loading && (
          <div className="text-white mt-3 text-center">No se encontraron grupos.</div>
        )}
      </div>

      <div className="pagination mt-3">
        {Array.from({ length: Math.ceil(total / limite) }, (_, i) => (
          <button
            key={i}
            className={`btn btn-sm me-1 ${paginaActual === i + 1 ? 'btn-secondary' : 'btn-outline-secondary'}`}
            onClick={() => setPaginaActual(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div className="botones-accion mx-auto" style={{ width: '25%' }}>
        <button className="btn btn-secondary w-100" onClick={onVolver} disabled={loading}>
          Volver
        </button>
      </div>
    </div>
  )
}

export default ConsultarGrupoGuardia
