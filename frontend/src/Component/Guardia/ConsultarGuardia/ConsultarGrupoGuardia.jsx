import React, { useEffect, useState } from 'react';
import { API_URLS } from '../../../config/api';
import '../RegistrarGuardia.css';
import '../../DisenioFormulario/DisenioFormulario.css';

const ConsultarGrupoGuardia = ({ onVolver }) => {
  const [nombreGrupo, setNombreGrupo] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [paginaActual, setPaginaActual] = useState(1);
  const [limite] = useState(10);
  const [total, setTotal] = useState(0);
  const [bomberos, setBomberos] = useState([]);
  const [grupo, setGrupo] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [grupos, setGrupos] = useState([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null)


  useEffect(() => {
    fetchGrupos();
  }, [paginaActual, busqueda]);

  const fetchGrupos = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_URLS.grupos.buscar}?pagina=${paginaActual}&limite=${limite}&busqueda=${busqueda}`);
        
      const data = await res.json();

      console.log('📡 Llamando a:', `${API_URLS.grupos.buscar}?pagina=${paginaActual}&limite=${limite}&busqueda=${busqueda}`)
      console.log('📥 Respuesta:', data)

      if (res.ok && data.success) {
      
        setGrupos(data.data || [])
        console.log('📦 Grupos recibidos:', data.data)
        setTotal(data.total || 0)
        setMensaje('')

      } else {
        setMensaje(data.message || 'Error al obtener grupos');
        setBomberos([]);
      }
    } catch (error) {
      setMensaje('Error de conexión. Verifique que el servidor esté funcionando.');
      setBomberos([]);
    } finally {
      setLoading(false);
    }
  };

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
      setMensaje('Error de conexión al eliminar grupo')
    } finally {
      setLoading(false)
    }
  }

  

  const handleBusqueda = (e) => {
    setBusqueda(e.target.value);
    setPaginaActual(1);
  };

  return (
    <div className="container mt-4 formulario-consistente">
      <h2 className="text-black mb-3">Grupos de Guardias</h2>
      {mensaje && <div className="alert alert-warning">{mensaje}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

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
              <th>Descripcion</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {grupos.map((grupo) => (
              <tr key={grupo.idGrupo}>
                
                <td>{grupo.nombre}</td>
                <td>Una descripcion</td>
                <td>
                            <button
                              className="btn btn-outline-light btn-sm me-2"
                              onClick={() => setGrupoSeleccionado(grupo)}
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
          <div className="text-black mt-3 text-center">
            No se encontraron grupos.
          </div>
        )}

      </div>

      <div className="pagination mb-3">
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
        
        <button className="btn btn-secondary me-3 w-100" onClick={onVolver} disabled={loading}>
          Volver
        </button>
      </div>
    </div>
  );
};

export default ConsultarGrupoGuardia;
