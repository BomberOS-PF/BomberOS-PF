import express from 'express'
import cors from 'cors'
import pool from './db.js'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// Ruta para login
app.post('/login', async (req, res) => {
  const { usuario, contrasena } = req.body
  
  if (!usuario || !contrasena) {
    return res.status(400).json({ error: 'Faltan campos requeridos' })
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM login WHERE user = ? AND pass = ?',
      [usuario, contrasena]
    )

    if (rows.length > 0) {
      res.json({ success: true, usuario: rows[0] })
    } else {
      res.status(401).json({ success: false, error: 'Credenciales incorrectas' })
    }
  } catch (error) {
    console.error('Error en login:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Ruta de prueba
app.get('/login', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM login')
    res.json(rows)
  } catch (error) {
    console.error('Error al consultar login:', error)
    res.status(500).json({ error: 'Error al obtener login' })
  }
})

app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en http://localhost:${PORT}`)
})

//ruta registrar usuario
app.post('/registrar-usuario', async (req, res) => {
  const { user, pass } = req.body

  if (!user || !pass) {
    return res.status(400).json({ error: 'Faltan campos requeridos' })
  }

  try {
    const [existing] = await pool.query('SELECT * FROM usuario WHERE user = ?', [user])
    if (existing.length > 0) {
      return res.status(409).json({ error: 'El usuario ya existe' })
    }

    await pool.query('INSERT INTO usuario (user, pass) VALUES (?, ?)', [user, pass])
    res.status(201).json({ success: true, message: 'Usuario registrado exitosamente' })
  } catch (error) {
    console.error('Error al registrar usuario:', error)
    res.status(500).json({ error: 'Error del servidor' })
  }
})

