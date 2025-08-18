export const validarTokenHandler = async (req, res) => {
  const { token } = req.query

  if (!token) {
    return res.status(400).json({ success: false, error: 'Token requerido' })
  }

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM tokensTemporales WHERE token = ? AND expiracion > NOW()',
      [token]
    )

    if (rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Token inválido o expirado' })
    }

    // Devolvemos el email y tipo por si el frontend lo quiere mostrar
    res.json({
      success: true,
      email: rows[0].email,
      tipo: rows[0].tipo
    })
  } catch (error) {
    logger.error('Error al validar token', { error: error.message })
    res.status(500).json({ success: false, error: 'Error interno' })
  }
}
