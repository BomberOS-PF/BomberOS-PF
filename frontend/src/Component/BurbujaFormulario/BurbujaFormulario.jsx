// BurbujaFormulario.jsx
import './BurbujaFormulario.css'

const BurbujaFormulario = ({ id, tipo, minimizada, onToggleMinimizada, onCerrar }) => {
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
    </div>
  )
}

export default BurbujaFormulario
