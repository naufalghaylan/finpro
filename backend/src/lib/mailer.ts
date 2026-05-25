import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import handlebars from 'handlebars'

dotenv.config()

const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io',
  port: Number(process.env.MAILTRAP_PORT) || 2525,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
})

// Load and compile the template
// process.cwd() will point to the backend root directory where package.json is located
const templatePath = path.join(process.cwd(), 'templates', 'verification.hbs')
const templateSource = fs.readFileSync(templatePath, 'utf8')
const compiledTemplate = handlebars.compile(templateSource)

export const sendVerificationEmail = async (email: string, token: string) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  const verificationLink = `${frontendUrl}/verify?token=${token}`

  // Inject data into the template
  const htmlToSend = compiledTemplate({ verificationLink })

  const mailOptions = {
    from: '"PanenMart" <noreply@panenmart.com>',
    to: email,
    subject: 'Verifikasi Akun PanenMart Anda',
    html: htmlToSend,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('[MAILER] Verification email sent to:', email, 'MessageId:', info.messageId)
  } catch (error) {
    console.error('[MAILER] Error sending email:', error)
    throw new Error('Failed to send verification email')
  }
}
