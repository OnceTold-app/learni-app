import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const SMTP_HOST = 'smtppro.zoho.com.au'
const SMTP_PORT = 587
const EMAIL = 'hello@learniapp.co'
const PASSWORD = process.env.SMTP_PASSWORD || ''

export async function POST(request: Request) {
  try {
    const { email, name, childName, childUsername, childPin, trialEndDate } = await request.json()

    if (!email || !name) {
      return NextResponse.json({ error: 'email and name required' }, { status: 400 })
    }

    const firstName = name.split(' ')[0]

    const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Welcome to Learni</title>
</head>
<body style="margin:0;padding:0;background-color:#f0faf9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0faf9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-family:Georgia,serif;font-size:30px;font-weight:900;color:#0d2b28;letter-spacing:-1px;">learni<span style="color:#2ec4b6;">.</span></span>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background:#ffffff;border-radius:20px;padding:40px 40px 32px;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                <!-- Greeting -->
                <tr>
                  <td style="padding-bottom:20px;">
                    <h1 style="margin:0;font-family:Georgia,serif;font-size:26px;font-weight:900;color:#0d2b28;line-height:1.3;">Hey ${firstName},</h1>
                  </td>
                </tr>

                <!-- Intro -->
                <tr>
                  <td style="padding-bottom:24px;">
                    <p style="margin:0;font-size:15px;color:#4a7a74;line-height:1.8;">Welcome to Learni. I'm Earni${childName ? ` — ${childName}'s new study buddy` : ''}.</p>
                    ${trialEndDate ? `<p style="margin:12px 0 0;font-size:15px;color:#4a7a74;line-height:1.8;">Your 7-day free trial has started. It ends on <strong style="color:#0d2b28;">${trialEndDate}</strong>.</p>` : '<p style="margin:12px 0 0;font-size:15px;color:#4a7a74;line-height:1.8;">Your 7-day free trial has started.</p>'}
                  </td>
                </tr>

                ${childName && childUsername && childPin ? `
                <!-- Login details -->
                <tr>
                  <td style="padding-bottom:24px;">
                    <p style="margin:0 0 12px;font-size:15px;color:#0d2b28;font-weight:700;">Here's how ${childName} logs in:</p>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background:#f0faf9;border-radius:12px;padding:16px 20px;width:100%;">
                      <tr>
                        <td style="padding:6px 0;font-size:14px;color:#4a7a74;line-height:1.8;">
                          → Go to <a href="https://learniapp.co/kid-login" style="color:#2ec4b6;text-decoration:none;font-weight:600;">learniapp.co/kid-login</a><br>
                          → Username: <strong style="color:#0d2b28;">${childUsername}</strong><br>
                          → PIN: <strong style="color:#0d2b28;">${childPin}</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ` : ''}

                <!-- Divider -->
                <tr>
                  <td style="padding-bottom:24px;border-top:1px solid #e8f5f3;">&nbsp;</td>
                </tr>

                <!-- Reward nudge -->
                <tr>
                  <td style="padding-bottom:28px;">
                    <p style="margin:0;font-size:15px;color:#4a7a74;line-height:1.8;">One thing worth doing first: head to your Hub and set a reward rate. Even $1 for every 20 stars makes a difference — kids notice when effort actually pays off.</p>
                  </td>
                </tr>

                <!-- CTA Button -->
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="background-color:#2ec4b6;border-radius:50px;padding:0;">
                          <a href="https://learniapp.co/dashboard" style="display:inline-block;padding:16px 40px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:50px;letter-spacing:-0.2px;">Open my Hub →</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Sign-off -->
                <tr>
                  <td style="padding-bottom:8px;">
                    <p style="margin:0;font-size:15px;color:#4a7a74;line-height:1.8;">Any questions, just reply to this email.</p>
                    <p style="margin:12px 0 0;font-size:15px;color:#0d2b28;font-weight:700;">— Earni</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 8px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="48" valign="top" style="padding-right:14px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="44" height="44" align="center" valign="middle" style="background-color:#2ec4b6;border-radius:50%;width:44px;height:44px;">
                          <span style="font-size:20px;font-weight:900;color:#ffffff;line-height:44px;">E</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td valign="top">
                    <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#0d2b28;">Earni</p>
                    <p style="margin:0 0 8px;font-size:12px;color:#7aada8;">AI Tutor at Learni</p>
                    <p style="margin:0;font-size:13px;">
                      <a href="https://learniapp.co" style="color:#2ec4b6;text-decoration:none;font-weight:600;">learniapp.co</a>
                      <span style="color:#ccc;margin:0 6px;">·</span>
                      <a href="mailto:hello@learniapp.co" style="color:#7aada8;text-decoration:none;">hello@learniapp.co</a>
                    </p>
                    <p style="margin:10px 0 0;font-size:11px;color:#a0c8c4;font-style:italic;">Learn it. Earn it. ✨</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Unsubscribe -->
          <tr>
            <td align="center" style="padding-top:16px;">
              <p style="margin:0;font-size:11px;color:#a0c8c4;">Momentum Ventures Limited · Auckland, New Zealand</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`

    const plainBody = `Hey ${firstName},

Welcome to Learni. I'm Earni${childName ? ` — ${childName}'s new study buddy` : ''}.

${trialEndDate ? `Your 7-day free trial has started. It ends on ${trialEndDate}.` : 'Your 7-day free trial has started.'}
${childName && childUsername && childPin ? `
Here's how ${childName} logs in:
→ Go to learniapp.co/kid-login
→ Username: ${childUsername}
→ PIN: ${childPin}
` : ''}
One thing worth doing first: head to your Hub and set a reward rate. Even $1 for every 20 stars makes a difference — kids notice when effort actually pays off.

Open my Hub → https://learniapp.co/dashboard

Any questions, just reply to this email.

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
      subject: childName
        ? `Welcome to Learni, ${firstName}! ${childName} is all set 🎉`
        : `Welcome to Learni, ${firstName}! 👋`,
      text: plainBody,
      html: htmlBody,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Welcome email error:', error)
    return NextResponse.json({ ok: false, error: String(error) }, { status: 200 })
  }
}
