import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './Component/Login/Login.jsx'
import RecuperarClave from './Component/RecuperarClave/RecuperarClave.jsx'
import RutaPrivada from './Component/RutaPrivada/RutaPrivada.jsx'
import Menu from './Component/Menu/Menu.jsx'
import RegistrarBombero from './Component/Bombero/RegistrarBombero/RegistrarBombero.jsx'
import RegistrarUsuario from './Component/Usuario/RegistrarUsuario/RegistrarUsuario.jsx'
import CargarIncidente from './Component/CargarIncidente/CargarIncidente.jsx'
import RegistrarRol from './Component/RegistrarRol/RegistrarRol.jsx'
import AccidenteTransito from './Component/AccidenteTransito/AccidenteTransito.jsx'
import FactorClimatico from './Component/FactorClimatico/FactorClimatico.jsx'
import IncendioEstructural from './Component/IncendioEstructural/IncendioEstructural.jsx'
import IncendioForestal from './Component/IncendioForestal/IncendioForestal'
import MaterialPeligroso from './Component/MaterialPeligroso/MaterialPeligroso.jsx'
import Rescate from './Component/Rescate/Rescate.jsx'
import ParticipacionIncidente from './Component/ParticipacionIncidente/ParticipacionIncidente.jsx'
import VehiculoInvolucrado from './Component/VehiculoInvolucrado/VehiculoInvolucrado'

const App = () => {
  const [user, setUser] = useState('')

  return (
    <Routes>
      <Route path="/login" element={<Login setUser={setUser} user={user}/>} />
      <Route path="/recuperar-clave" element={<RecuperarClave />} />
      <Route path="/"element={<RutaPrivada user={user}><Menu user={user} setUser={setUser} /></RutaPrivada>} />
      <Route path="/registrar-bombero" element={<RutaPrivada user={user}> <RegistrarBombero /></RutaPrivada>} />
      <Route path="/cargar-incidente"element={<RutaPrivada user={user}><CargarIncidente /></RutaPrivada>} />
      <Route path="/registrar-rol" element={<RutaPrivada user={user}><RegistrarRol /></RutaPrivada>} />
      <Route path="/registrar-usuario" element={<RutaPrivada user={user}><RegistrarUsuario /></RutaPrivada>} />
      <Route path="/accidente-transito" element={<RutaPrivada user={user}><AccidenteTransito /></RutaPrivada> } />
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
