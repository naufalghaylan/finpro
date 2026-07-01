import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import handlebars from 'handlebars'

dotenv.config()

const mailUser = process.env.MAIL_USER || process.env.MAILTRAP_USER
const mailPass = process.env.MAIL_PASS || process.env.MAILTRAP_PASS

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'sandbox.smtp.mailtrap.io',
  port: Number(process.env.MAIL_PORT) || 2525,
  auth: {
    user: mailUser,
    pass: mailPass,
  },
})

// Load and compile the templates
// process.cwd() will point to the backend root directory where package.json is located
const verificationTemplatePath = path.join(process.cwd(), 'templates', 'verification.hbs')
const verificationTemplateSource = fs.readFileSync(verificationTemplatePath, 'utf8')
const compiledVerificationTemplate = handlebars.compile(verificationTemplateSource)

const resetPasswordTemplatePath = path.join(process.cwd(), 'templates', 'reset-password.hbs')
const resetPasswordTemplateSource = fs.readFileSync(resetPasswordTemplatePath, 'utf8')
const compiledResetPasswordTemplate = handlebars.compile(resetPasswordTemplateSource)

const orderNotificationTemplatePath = path.join(
  process.cwd(),
  'templates',
  'order-notification.hbs',
)
const orderNotificationTemplateSource = fs.readFileSync(orderNotificationTemplatePath, 'utf8')
const compiledOrderNotificationTemplate = handlebars.compile(orderNotificationTemplateSource)

const newsletterTemplatePath = path.join(process.cwd(), 'templates', 'newsletter.hbs')
const newsletterTemplateSource = fs.readFileSync(newsletterTemplatePath, 'utf8')
const compiledNewsletterTemplate = handlebars.compile(newsletterTemplateSource)

export type OrderNotificationEmailItem = {
  name: string
  quantity: number
  subtotal: string
}

export type OrderNotificationEmailParams = {
  email: string
  subject: string
  customerName: string
  title: string
  message: string
  orderNumber: string
  statusLabel: string
  totalAmount: string
  actionUrl: string
  actionLabel: string
  items: OrderNotificationEmailItem[]
  paymentMethod?: string
  paymentDeadline?: string
  shippingInfo?: string
  recipientAddress?: string
  cancelReason?: string
}

export const sendVerificationEmail = async (email: string, token: string) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  const verificationLink = `${frontendUrl}/verify?token=${token}`

  // Inject data into the template
  const htmlToSend = compiledVerificationTemplate({ verificationLink })

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

export const sendResetPasswordEmail = async (email: string, token: string) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  const resetLink = `${frontendUrl}/reset-password?token=${token}`

  // Inject data into the template
  const htmlToSend = compiledResetPasswordTemplate({ resetLink })

  const mailOptions = {
    from: '"PanenMart" <noreply@panenmart.com>',
    to: email,
    subject: 'Reset Password Akun PanenMart Anda',
    html: htmlToSend,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('[MAILER] Reset password email sent to:', email, 'MessageId:', info.messageId)
  } catch (error) {
    console.error('[MAILER] Error sending reset password email:', error)
    throw new Error('Failed to send reset password email')
  }
}

export const sendOrderNotificationEmail = async ({
  email,
  subject,
  ...templateData
}: OrderNotificationEmailParams) => {
  const htmlToSend = compiledOrderNotificationTemplate(templateData)
  const itemSummary = templateData.items
    .map((item) => `${item.name} (${item.quantity}x) - ${item.subtotal}`)
    .join('\n')

  const mailOptions = {
    from: 'PanenMart <noreply@panenmart.com>',
    to: email,
    subject,
    text: [
      `Halo ${templateData.customerName},`,
      templateData.message,
      `Nomor pesanan: ${templateData.orderNumber}`,
      `Status: ${templateData.statusLabel}`,
      itemSummary,
      `Total: ${templateData.totalAmount}`,
      templateData.cancelReason ? `Alasan pembatalan: ${templateData.cancelReason}` : null,
      `Lihat pesanan: ${templateData.actionUrl}`,
    ].filter(Boolean).join('\n\n'),
    html: htmlToSend,
  }

  const info = await transporter.sendMail(mailOptions)
  console.log(
    '[MAILER] Order notification email sent to:',
    email,
    'MessageId:',
    info.messageId,
  )
}

export const sendNewsletterSubscriptionEmail = async (email: string) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

  const htmlToSend = compiledNewsletterTemplate({ frontendUrl })

  const mailOptions = {
    from: '"PanenMart" <noreply@panenmart.com>',
    to: email,
    subject: 'Terima Kasih Telah Berlangganan Promo PanenMart',
    html: htmlToSend,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('[MAILER] Newsletter subscription email sent to:', email, 'MessageId:', info.messageId)
  } catch (error) {
    console.error('[MAILER] Error sending newsletter email:', error)
    throw new Error('Failed to send newsletter email')
  }
}
