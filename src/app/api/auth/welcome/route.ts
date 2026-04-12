import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const SMTP_HOST = 'smtppro.zoho.com.au'
const SMTP_PORT = 587
const EMAIL = 'hello@learniapp.co'
const PASSWORD = 'K!eyboard12345!'

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json()

    if (!email || !name) {
      return NextResponse.json({ error: 'email and name required' }, { status: 400 })
    }

    const firstName = name.split(' ')[0]

    const htmlBody = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, 'Nunito', 'Segoe UI', sans-serif; color: #0d2b28; line-height: 1.65; max-width: 560px; margin: 0 auto; padding: 20px; background: #ffffff;">

  <div style="text-align: center; margin-bottom: 32px; padding: 32px 0 24px;">
    <div style="font-family: 'Nunito', sans-serif; font-size: 28px; font-weight: 900; color: #0d2b28; letter-spacing: -0.5px;">
      learni<span style="color: #2ec4b6;">.</span>
    </div>
    <div style="margin-top: 24px; font-size: 48px;">👋</div>
  </div>

  <div style="font-size: 15px; color: #0d2b28;">
    <p style="margin: 0 0 16px; font-family: 'Nunito', sans-serif; font-size: 22px; font-weight: 900; color: #0d2b28;">
      Hey ${firstName}! Welcome aboard.
    </p>

    <p style="margin: 0 0 16px; color: #3a6660;">
      I'm Earni — the AI tutor behind Learni. Your 14-day free trial has started, and I'm genuinely excited to work with your child.
    </p>

    <p style="margin: 0 0 20px; font-weight: 600; color: #0d2b28;">Here's how to get started in 2 minutes:</p>

    <div style="background: #f7fafa; border-radius: 16px; padding: 20px 24px; margin-bottom: 24px;">
      <div style="display: flex; align-items: flex-start; margin-bottom: 14px;">
        <div style="background: #2ec4b6; color: white; width: 24px; height: 24px; border-radius: 50%; font-family: 'Nunito', sans-serif; font-weight: 900; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 12px; margin-top: 1px;">1</div>
        <div style="font-size: 14px; color: #0d2b28;">Go to your <a href="https://learniapp.co/dashboard" style="color: #2ec4b6; font-weight: 700; text-decoration: none;">Parent Hub</a> and add your child — name, age, year level</div>
      </div>
      <div style="display: flex; align-items: flex-start; margin-bottom: 14px;">
        <div style="background: #2ec4b6; color: white; width: 24px; height: 24px; border-radius: 50%; font-family: 'Nunito', sans-serif; font-weight: 900; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 12px; margin-top: 1px;">2</div>
        <div style="font-size: 14px; color: #0d2b28;">Your child picks a username and 4-digit PIN — that's their login</div>
      </div>
      <div style="display: flex; align-items: flex-start; margin-bottom: 14px;">
        <div style="background: #2ec4b6; color: white; width: 24px; height: 24px; border-radius: 50%; font-family: 'Nunito', sans-serif; font-weight: 900; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 12px; margin-top: 1px;">3</div>
        <div style="font-size: 14px; color: #0d2b28;">First session: I run a quick baseline to find their level automatically</div>
      </div>
      <div style="display: flex; align-items: flex-start;">
        <div style="background: #2ec4b6; color: white; width: 24px; height: 24px; border-radius: 50%; font-family: 'Nunito', sans-serif; font-weight: 900; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 12px; margin-top: 1px;">4</div>
        <div style="font-size: 14px; color: #0d2b28;">Sessions take 15–20 min. Kids earn stars ⭐ that convert to real pocket money 💰</div>
      </div>
    </div>

    <div style="text-align: center; margin-bottom: 28px;">
      <a href="https://learniapp.co/dashboard" style="display: inline-block; background: #2ec4b6; color: white; padding: 14px 32px; border-radius: 30px; font-family: 'Nunito', sans-serif; font-weight: 900; font-size: 16px; text-decoration: none; box-shadow: 0 6px 24px rgba(46,196,182,0.35);">
        Go to my Hub →
      </a>
    </div>

    <p style="margin: 0 0 8px; font-size: 14px; color: #5a8a84;">
      Questions? Just reply — I read everything. Or visit <a href="https://learniapp.co" style="color: #2ec4b6; text-decoration: none;">learniapp.co</a>
    </p>
  </div>

  <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 28px; border-top: 1px solid #e8f0ef; padding-top: 20px; width: 100%;">
    <tr>
      <td style="vertical-align: top; padding-right: 16px; width: 64px;">
        <div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(145deg, #2ec4b6, #1a9e92); text-align: center; line-height: 48px; font-size: 24px; color: white; font-weight: 900; font-family: 'Nunito', sans-serif;">E</div>
      </td>
      <td style="vertical-align: top;">
        <div style="font-family: 'Nunito', sans-serif; font-weight: 900; font-size: 16px; color: #0d2b28;">Earni</div>
        <div style="font-size: 12px; color: #5a8a84; margin-top: 2px;">AI Tutor at Learni</div>
        <div style="margin-top: 8px;">
          <a href="https://learniapp.co" style="color: #2ec4b6; text-decoration: none; font-size: 13px; font-weight: 600;">learniapp.co</a>
          <span style="color: #ccc; margin: 0 6px;">·</span>
          <a href="mailto:hello@learniapp.co" style="color: #5a8a84; text-decoration: none; font-size: 13px;">hello@learniapp.co</a>
        </div>
        <div style="margin-top: 10px; font-size: 11px; color: #8abfba; font-style: italic;">Learn it. Earn it. ✨</div>
      </td>
    </tr>
  </table>
</body></html>`

    const plainBody = `Hey ${firstName}!

I'm Earni — the AI tutor behind Learni. Your 14-day free trial has started.

Here's how to get going in 2 minutes:

1. Go to your Hub → learniapp.co/dashboard
2. Add your child (name, age, year level)
3. They pick a username and PIN — that's their login
4. First session: I'll run a baseline assessment to find their level

Sessions take 15–20 min. Kids earn stars ⭐ for correct answers, which convert to real pocket money 💰

Questions? Just reply to this email.

— Earni
AI Tutor at Learni | learniapp.co`

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: false,
      requireTLS: true,
      auth: {
        user: EMAIL,
        pass: PASSWORD,
      },
    })

    await transporter.sendMail({
      from: `Earni from Learni <${EMAIL}>`,
      to: email,
      subject: 'Welcome to Learni 👋',
      text: plainBody,
      html: htmlBody,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Welcome email error:', error)
    // Don't fail signup if email fails
    return NextResponse.json({ ok: false, error: String(error) }, { status: 200 })
  }
}
