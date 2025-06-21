import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import FormularioRol from './FormularioRol'

const ModificarRol = ({ onVolver }) => {
  const { id } = useParams()
  const [rol, setRol] = useState(null)
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    const fetchRol = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/roles/${id}`)
        const data = await res.json()
        if (data.success) {
          setRol(data.rol)
        } else {
          setMensaje('No se pudo cargar el rol')
        }
      } catch (err) {
        console.error('Error al cargar rol:', err)
        setMensaje('Error de conexión')
      }
    }

    fetchRol()
  }, [id])

  const handleGuardar = async (datosActualizados) => {
    try {
      const res = await fetch(`http://localhost:3000/api/roles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosActualizados)
      })

      if (res.ok) {
        setMensaje('Rol actualizado correctamente')
        onVolver()
      } else {
        const err = await res.json()
        setMensaje(err.error || 'Error al actualizar rol')
      }
    } catch (error) {
      console.error('Error al guardar:', error)
      setMensaje('Error de conexión')
    }
  }

  return (
    <div className="container mt-4">
      <h2 className="text-white mb-3">Modificar Rol</h2>

      {mensaje && <div className="alert alert-info">{mensaje}</div>}

      {rol ? (
        <FormularioRol
          modo="edicion"
          datosIniciales={rol}
          onSubmit={handleGuardar}
          onVolver={onVolver}
        />
      ) : (
        <p className="text-white">Cargando rol...</p>
      )}
    </div>
  )
}

export default ModificarRol
