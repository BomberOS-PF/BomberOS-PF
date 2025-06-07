import './BurbujaFormulario.css'
import AccidenteTransito from '../AccidenteTransito/AccidenteTransito.jsx'
import FactorClimatico from '../FactorClimatico/FactorClimatico.jsx'
import IncendioEstructural from '../IncendioEstructural/IncendioEstructural.jsx'
import IncendioForestal from '../IncendioForestal/IncendioForestal.jsx'
import MaterialPeligroso from '../MaterialPeligroso/MaterialPeligroso.jsx'
import Rescate from '../Rescate/Rescate.jsx'

const BurbujaFormulario = ({ id, tipo, datosPrevios, onCerrar, minimizada, onToggleMinimizada }) => {
  const renderContenido = () => {
    switch (tipo) {
      case 'Accidente':
        return <AccidenteTransito datosPrevios={datosPrevios} />
      case 'Factores Climáticos':
        return <FactorClimatico datosPrevios={datosPrevios} />
      case 'Incendio Estructural':
        return <IncendioEstructural datosPrevios={datosPrevios} />
      case 'Incendio Forestal':
        return <IncendioForestal datosPrevios={datosPrevios} />
      case 'Material Peligroso':
        return <MaterialPeligroso datosPrevios={datosPrevios} />
      case 'Rescate':
        return <Rescate datosPrevios={datosPrevios} />
      default:
        return <p>Tipo no reconocido</p>
    }
  }

  return (
    <div className="burbuja-formulario">
      <div className="burbuja-header">
        <span>{tipo} (ID: {id})</span>
        <div>
          <button onClick={() => onToggleMinimizada(id)}>
            {minimizada ? '🔼' : '🔽'}
          </button>
          <button onClick={() => onCerrar(id)}>✖</button>
        </div>
      </div>
      {!minimizada && <div className="burbuja-body">{renderContenido()}</div>}
    </div>
  )
}

export default BurbujaFormulario
