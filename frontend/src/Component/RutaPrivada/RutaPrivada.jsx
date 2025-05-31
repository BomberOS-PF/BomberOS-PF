import { Navigate } from 'react-router-dom'

const RutaPrivada = ({ user, children }) => {
  return user ? children : <Navigate to="/login" replace />
}

export default RutaPrivada
