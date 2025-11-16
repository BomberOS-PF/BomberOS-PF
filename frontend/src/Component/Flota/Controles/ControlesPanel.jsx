import { useState } from 'react'
import NuevoControlMovil from './NuevoControlMovil'
import ControlMovilSemanal from './ControlMovilSemanal'

export default function ControlesMain() {
  const [step, setStep] = useState('nuevo')       // 'nuevo' | 'control'
  const [controlId, setControlId] = useState(null)

  const handleCreated = (idControl /*, res */) => {
    setControlId(idControl)
    setStep('control')
  }

  const handleFinalizado = () => {
    // cuando finalizás el control, volvés a crear otro si querés
    setStep('nuevo')
    setControlId(null)
  }

  return (
    <>
      {step === 'nuevo' && (
        <NuevoControlMovil
          onCreated={handleCreated}
          onCancel={() => {/* si querés cerrar módulo desde el menú, acá */}}
        />
      )}

      {step === 'control' && controlId && (
        <ControlMovilSemanal
          controlId={controlId}
          onFinalizado={handleFinalizado}
          onVolver={() => setStep('nuevo')}
        />
      )}
    </>
  )
}