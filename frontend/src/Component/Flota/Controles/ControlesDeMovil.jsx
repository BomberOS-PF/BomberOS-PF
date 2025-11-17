import { useState } from 'react'
import NuevoControlMovil from './NuevoControlMovil'
import ControlMovilSemanal from './ControlMovilSemanal'
import ListarMoviles from '../Moviles/ListarMoviles' // si querés tenerla a mano

export default function ControlesDeMovil() {
  const [view, setView] = useState('nuevo') // 'nuevo' | 'form' | 'list'
  const [controlId, setControlId] = useState(null)

  const handleCreated = (idCtrl /*, ctrlObj */) => {
    setControlId(idCtrl)
    setView('form')
  }

  if (view === 'form' && controlId) {
    return (
      <ControlMovilSemanal
        controlId={controlId}
        onFinalizado={() => setView('nuevo')}
        onVolver={() => setView('nuevo')}
      />
    )
  }

  if (view === 'list') {
    return <ListarMoviles />
  }

  // default: 'nuevo'
  return (
    <NuevoControlMovil
      onCreated={handleCreated}
      onCancel={() => setView('list')}
    />
  )
}
