'use server'

import { Resend } from 'resend'

export async function sendSupportEmail(data: {
  subject: string
  message: string
  userEmail: string
  userName: string
}) {
  console.log('sendSupportEmail called', data)
  console.log('API KEY EXISTS:', !!process.env.RESEND_API_KEY)

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)

    const { data: resendData, error } = await resend.emails.send({
      from: 'Support <onboarding@resend.dev>',
      to: 'amir.sahbeni1@gmail.com',
      replyTo: data.userEmail,
      subject: `Support: ${data.subject}`,
      html: `
        <p><strong>Name:</strong> ${data.userName}</p>
        <p><strong>Email:</strong> ${data.userEmail}</p>
        <p><strong>Subject:</strong> ${data.subject}</p>
        <p><strong>Message:</strong><br/>${data.message}</p>
      `
    })

    if (error) {
      console.error('Resend error:', error)
      return { error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    console.error('sendSupportEmail catch error:', err)
    return { error: err.message || 'Unknown error occurred' }
  }
}
