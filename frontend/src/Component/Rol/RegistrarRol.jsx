import FormularioRol from './FormularioRol'

const RegistrarRol = ({ onVolver }) => {
  const handleCrearRol = async (datos) => {
  try {
    console.log('➡️ Enviando al backend:', datos) // 👈 clave

    const res = await fetch('http://localhost:3000/api/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    })

    if (res.ok) {
      alert('Rol creado correctamente')
      onVolver()
    } else {
      const error = await res.json()
      alert(error.error || 'Error al crear rol')
    }
  } catch (err) {
    console.error('Error al crear rol:', err)
    alert('Error de conexión')
  }
}

  return (
    <FormularioRol
      modo="alta"
      onSubmit={handleCrearRol}
      onVolver={onVolver}
    />
  )
}

export default RegistrarRol
