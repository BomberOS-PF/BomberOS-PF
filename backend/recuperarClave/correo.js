import dotenv from 'dotenv'
dotenv.config()

import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.CORREO_ORIGEN,
    pass: process.env.CORREO_APP_PASS
  }
})

export const enviarCorreo = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: `"BomberOS" <${process.env.CORREO_ORIGEN}>`,
    to,
    subject,
    html
  })
}
