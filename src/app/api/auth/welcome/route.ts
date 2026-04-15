import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const SMTP_HOST = 'smtppro.zoho.com.au'
const SMTP_PORT = 587
const EMAIL = 'hello@learniapp.co'
const PASSWORD = process.env.SMTP_PASSWORD || ''

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json()

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

              <!-- Greeting -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-bottom:8px;">
                    <span style="font-size:36px;">👋</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:12px;">
                    <h1 style="margin:0;font-family:Georgia,serif;font-size:26px;font-weight:900;color:#0d2b28;line-height:1.2;">Hey ${firstName}, welcome to Learni!</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:32px;">
                    <p style="margin:0;font-size:15px;color:#4a7a74;line-height:1.7;">I&apos;m Earni — your child&apos;s new AI tutor. Your 7-day free trial has started. Let&apos;s get your first session going.</p>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding-bottom:24px;border-top:1px solid #e8f5f3;">&nbsp;</td>
                </tr>

                <!-- Steps heading -->
                <tr>
                  <td style="padding-bottom:20px;">
                    <p style="margin:0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#2ec4b6;">Get started in 3 steps</p>
                  </td>
                </tr>

                <!-- Step 1 -->
                <tr>
                  <td style="padding-bottom:16px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td width="40" valign="top" style="padding-right:14px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td width="32" height="32" align="center" valign="middle" style="background-color:#2ec4b6;border-radius:50%;width:32px;height:32px;">
                                <span style="font-size:13px;font-weight:900;color:#ffffff;line-height:32px;">1</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td valign="middle">
                          <p style="margin:0;font-size:14px;color:#0d2b28;line-height:1.6;"><strong>Open your <a href="https://learniapp.co/dashboard" style="color:#2ec4b6;text-decoration:none;">Parent Hub</a></strong> and add your child — name, age, and year level.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Step 2 -->
                <tr>
                  <td style="padding-bottom:16px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td width="40" valign="top" style="padding-right:14px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td width="32" height="32" align="center" valign="middle" style="background-color:#2ec4b6;border-radius:50%;width:32px;height:32px;">
                                <span style="font-size:13px;font-weight:900;color:#ffffff;line-height:32px;">2</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td valign="middle">
                          <p style="margin:0;font-size:14px;color:#0d2b28;line-height:1.6;"><strong>Your child picks a username and 4-digit PIN</strong> — that&apos;s their personal login.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Step 3 -->
                <tr>
                  <td style="padding-bottom:32px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td width="40" valign="top" style="padding-right:14px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td width="32" height="32" align="center" valign="middle" style="background-color:#2ec4b6;border-radius:50%;width:32px;height:32px;">
                                <span style="font-size:13px;font-weight:900;color:#ffffff;line-height:32px;">3</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td valign="middle">
                          <p style="margin:0;font-size:14px;color:#0d2b28;line-height:1.6;"><strong>First session starts</strong> — I run a quick baseline to find their exact level, then we&apos;re off. Sessions take 15&ndash;20 min. ⭐</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- CTA Button -->
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="background-color:#2ec4b6;border-radius:50px;padding:0;">
                          <a href="https://learniapp.co/dashboard" style="display:inline-block;padding:16px 40px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:50px;letter-spacing:-0.2px;">Go to my Hub &rarr;</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Reward note -->
                <tr>
                  <td style="background:#f0faf9;border-radius:12px;padding:16px 20px;">
                    <p style="margin:0;font-size:13px;color:#4a7a74;line-height:1.7;">💰 <strong>Don&apos;t forget to set your reward rate</strong> in the Hub — kids earn stars for correct answers, and you decide how much each star is worth. Real money, real motivation.</p>
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
                      <span style="color:#ccc;margin:0 6px;">&middot;</span>
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
              <p style="margin:0;font-size:11px;color:#a0c8c4;">Momentum Ventures Limited &middot; Auckland, New Zealand</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`

    const plainBody = `Hey ${firstName}!

I'm Earni — your child's new AI tutor. Your 7-day free trial has started.

Get started in 3 steps:

1. Open your Hub → learniapp.co/dashboard and add your child (name, age, year level)
2. Your child picks a username and 4-digit PIN — that's their login
3. First session: I run a quick baseline to find their exact level, then we're off

Sessions take 15-20 min. Kids earn stars ⭐ for correct answers — you set the reward rate in the Hub.

Go to your Hub → https://learniapp.co/dashboard

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
      subject: `Welcome to Learni, ${firstName}! 👋`,
      text: plainBody,
      html: htmlBody,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Welcome email error:', error)
    return NextResponse.json({ ok: false, error: String(error) }, { status: 200 })
  }
}
