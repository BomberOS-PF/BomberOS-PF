import React, { useEffect, useState } from 'react';
import { API_URLS } from '../../../config/api';
import '../RegistrarGuardia.css';
import '../../DisenioFormulario/DisenioFormulario.css';

const RegistrarGuardia = ({ onVolver }) => {
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

  useEffect(() => {
    fetchBomberos();
  }, [paginaActual, busqueda]);

  const fetchBomberos = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_URLS.bomberos.buscar}?pagina=${paginaActual}&limite=${limite}&busqueda=${busqueda}`
      );
      const data = await res.json();

      if (res.ok && data.success) {
        const bomberosAgrupados = data.data.reduce((acc, bombero) => {
          const grupo =
            bombero.grupoGuardia && bombero.grupoGuardia.length > 0
              ? bombero.grupoGuardia.join(', ')
              : 'No asignado';

          if (!acc[bombero.dni]) {
            acc[bombero.dni] = {
              ...bombero,
              grupos: grupo, // Aquí guardamos los grupos en una sola cadena
            };
          } else {
            acc[bombero.dni].grupos += `, ${grupo}`; // Si ya existe, agregamos el nuevo grupo
          }

          return acc;
        }, {});

        setBomberos(Object.values(bomberosAgrupados));
        setTotal(data.total);
      } else {
        setMensaje(data.message || 'Error al cargar bomberos');
        setBomberos([]);
      }
    } catch (error) {
      setMensaje('Error de conexión. Verifique que el servidor esté funcionando.');
      setBomberos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBusqueda = (e) => {
    setBusqueda(e.target.value);
    setPaginaActual(1);
  };

  const agregarAlGrupo = (bombero) => {
    if (!grupo.find((b) => b.dni === bombero.dni)) {
      setGrupo([...grupo, bombero]);
      setMensaje('');
    }
  };

  const quitarDelGrupo = (dni) => {
    setGrupo(grupo.filter((b) => b.dni !== dni));
  };

  const guardarGrupo = async () => {
    if (!nombreGrupo.trim()) {
      setMensaje('Debes ingresar un nombre para el grupo.');
      return;
    }

    if (grupo.length === 0) {
      setMensaje('Debes seleccionar al menos un bombero para el grupo.');
      return;
    }

    setLoading(true); // Inicia el loading

    try {
      const res = await fetch(API_URLS.grupos.create, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombreGrupo, bomberos: grupo.map((b) => b.dni) }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMessage(`Grupo "${data.data.nombre}" guardado con éxito`);
        setTimeout(() => setSuccessMessage(''), 5000); // El mensaje desaparece después de 5 segundos
        setNombreGrupo('');
        setGrupo([]);
        setMensaje('');

        // Actualizamos la lista de bomberos tras guardar el grupo
        fetchBomberos(); // Recarga los bomberos
      } else {
        setMensaje(data.message || 'Error al guardar el grupo');
      }
    } catch (error) {
      setMensaje('Error de conexión al guardar grupo');
    } finally {
      setLoading(false); // Termina el loading
    }
  };

  return (
    <div className="container mt-4 formulario-consistente">
      <h2 className="text-black mb-3">Crear Grupo de Guardia</h2>
      {mensaje && <div className="alert alert-warning">{mensaje}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      <input
        type="text"
        className="form-control"
        placeholder="Nombre del grupo"
        value={nombreGrupo}
        onChange={(e) => {
          setNombreGrupo(e.target.value);
          setMensaje('');
        }}
      />

      <input
        type="text"
        className="form-control mt-3"
        placeholder="Buscar bombero por dni, legajo, nombre o apellido"
        value={busqueda}
        onChange={handleBusqueda}
      />

      <div className="table-responsive">
        <table className="tabla-bomberos mt-3">
          <thead>
            <tr>
              <th>Seleccionar</th>
              <th>DNI</th>
              <th>Legajo</th>
              <th>Nombre completo</th>
              <th>Teléfono</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {bomberos.map((b) => (
              <tr key={b.dni}>
                <td>
                  <div className="tooltip-container">
                    <button
                      onClick={() => agregarAlGrupo(b)}
                      disabled={b.grupos !== 'No asignado'} // Deshabilitar solo si tiene grupos
                      className={`btn btn-sm ${b.grupos !== 'No asignado' ? 'btn-secondary' : 'btn-success'}`}
                    >
                      ➕
                    </button>
                    {b.grupos !== 'No asignado' && (
                      <div className="tooltip">
                        Pertenece a: {b.grupos}
                      </div>
                    )}
                  </div>
                </td>
                <td>{b.dni}</td>
                <td>{b.legajo}</td>
                <td>{b.nombre && b.apellido ? `${b.nombre} ${b.apellido}` : ''} </td>
                <td>{b.telefono}</td>
                <td>{b.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
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

      <div className="mt-4">
        <h4 className="text-black">Bomberos en el grupo</h4>
        <div className="table-responsive">
          <table className="tabla-bomberos">
            <thead>
              <tr>
                <th>dni</th>
                <th>Legajo</th>
                <th>Nombre completo</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Quitar</th>
              </tr>
            </thead>
            <tbody>
              {grupo.map((b) => (
                <tr key={b.dni}>
                  <td>{b.dni}</td>
                  <td>{b.legajo}</td>
                  <td>{b.nombre && b.apellido ? `${b.nombre} ${b.apellido}` : ''}</td>
                  <td>{b.telefono}</td>
                  <td>{b.email}</td>
                  <td>
                    <button
                      className="btn btn-sm text-danger border-0 bg-transparent"
                      onClick={() => quitarDelGrupo(b.dni)}
                      title="Quitar bombero"
                      style={{ lineHeight: '1', padding: '0 6px' }}
                    >
                      ❌
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="botones-accion mx-auto" style={{ width: '25%' }}>
        <button className="btn btn-danger me-3 w-100" onClick={guardarGrupo} disabled={loading}>
          {loading ? 'Espere...' : 'Guardar Grupo'}
        </button>
        <button className="btn btn-secondary me-3 w-100" onClick={onVolver} disabled={loading}>
          Volver
        </button>
      </div>
    </div>
  );
};

export default RegistrarGuardia;
