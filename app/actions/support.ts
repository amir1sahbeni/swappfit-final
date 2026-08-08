'use server'

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendSupportEmail(data: {
  subject: string
  message: string
  userEmail: string
  userName: string
}) {
  const { subject, message, userEmail, userName } = data

  const { error } = await resend.emails.send({
    from: 'support@swappfit.me',
    to: 'swappfit.support@gmail.com',
    subject: `[SwappFit Support] ${subject}`,
    html: `
      <h2>Support Request from ${userName}</h2>
      <p><strong>Email:</strong> ${userEmail}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `
  })

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}
