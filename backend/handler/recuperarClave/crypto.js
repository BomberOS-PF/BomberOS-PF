import crypto from 'crypto'

export const generarToken = () => {
  return crypto.randomBytes(32).toString('hex')
}