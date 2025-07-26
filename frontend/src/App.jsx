import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Login from './Component/Login/Login.jsx'
import RecuperarClave from './Component/RecuperarClave/RecuperarClave.jsx'
import RutaPrivada from './Component/RutaPrivada/RutaPrivada.jsx'
import Menu from './Component/Menu/Menu.jsx'
import RegistrarBombero from './Component/Bombero/RegistrarBombero/RegistrarBombero.jsx'
import RegistrarUsuario from './Component/Usuario/RegistrarUsuario/RegistrarUsuario.jsx'
import CargarIncidente from './Component/Incidente/CargarIncidente/CargarIncidente.jsx'
import AccidenteTransito from './Component/Incidente/TipoIncidente/AccidenteTransito/AccidenteTransito.jsx'
import FactorClimatico from './Component/Incidente/TipoIncidente/FactorClimatico/FactorClimatico.jsx'
import IncendioEstructural from './Component/Incidente/TipoIncidente/IncendioEstructural/IncendioEstructural.jsx'
import IncendioForestal from './Component/Incidente/TipoIncidente/IncendioForestal/IncendioForestal.jsx'
import MaterialPeligroso from './Component/Incidente/TipoIncidente/MaterialPeligroso/MaterialPeligroso.jsx'
import Rescate from './Component/Incidente/TipoIncidente/Rescate/Rescate.jsx'
import ParticipacionIncidente from './Component/Incidente/ParticipacionIncidente/ParticipacionIncidente.jsx'
import VehiculoInvolucrado from './Component/VehiculoInvolucrado/VehiculoInvolucrado.jsx'
import ConsultarRol from './Component/Rol/ConsultarRol.jsx'
import RegistrarRol from './Component/Rol/RegistrarRol.jsx'
import RestablecerClave from './Component/RestablecerClave/RestablecerClave.jsx'

const App = () => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('usuario')
    return saved ? JSON.parse(saved) : null
  })

  const navigate = useNavigate()

  return (
    <Routes>
      <Route path="/login" element={<Login setUser={setUser} user={user} />} />
      <Route path="/recuperar-clave" element={<RecuperarClave onVolver={() => navigate('/login')} />} />
      <Route path="/restablecer-clave" element={<RestablecerClave onVolver={() => navigate('/login')} />} />
      <Route path="/" element={<RutaPrivada user={user}><Menu user={user} setUser={setUser} /></RutaPrivada>} />
      <Route path="/registrar-bombero" element={<RutaPrivada user={user}><RegistrarBombero /></RutaPrivada>} />
      <Route path="/cargar-incidente" element={<RutaPrivada user={user}><CargarIncidente /></RutaPrivada>} />
      <Route path="/registrar-rol" element={<RutaPrivada user={user}><RegistrarRol /></RutaPrivada>} />
      <Route path="/consultar-rol" element={<RutaPrivada user={user}><ConsultarRol /></RutaPrivada>} />
      <Route path="/registrar-usuario" element={<RutaPrivada user={user}><RegistrarUsuario /></RutaPrivada>} />
      <Route path="/accidente-transito" element={<RutaPrivada user={user}><AccidenteTransito /></RutaPrivada>} />
      <Route path="/factor-climatico" element={<RutaPrivada user={user}><FactorClimatico /></RutaPrivada>} />
      <Route path="/incendio-estructural" element={<RutaPrivada user={user}><IncendioEstructural /></RutaPrivada>} />
      <Route path="/incendio-forestal" element={<RutaPrivada user={user}><IncendioForestal /></RutaPrivada>} />
      <Route path="/material-peligroso" element={<RutaPrivada user={user}><MaterialPeligroso /></RutaPrivada>} />
      <Route path="/rescate" element={<RutaPrivada user={user}><Rescate /></RutaPrivada>} />
      <Route path="/participacion-incidente" element={<RutaPrivada user={user}><ParticipacionIncidente /></RutaPrivada>} />
      <Route path="/vehiculo-involucrado" element={<RutaPrivada user={user}><VehiculoInvolucrado /></RutaPrivada>} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
