// frontend/src/Component/Common/Button.jsx
import React from 'react'

// Botón "Volver al menú" con fallback si no recibe onClick
export const BackToMenuButton = ({ onClick, to = '/' }) => {
  const handleClick = (e) => {
    if (typeof onClick === 'function') {
      onClick(e)
      return
    }
    // Fallback: redirigir a la home si no vino onClick
    window.location.assign(to) // cambiá 'to' a '/menu' si esa es tu home
  }

  return (
    <button onClick={handleClick} className="btn btn-back btn-medium">
      Volver al menú
    </button>
  )
}
