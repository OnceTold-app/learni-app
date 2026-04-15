import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import Anthropic from '@anthropic-ai/sdk'
import { CLAUDE_MODEL } from '@/lib/claude'

const SMTP_HOST = 'smtppro.zoho.com.au'
const SMTP_PORT = 587
const EMAIL_FROM = 'hello@learniapp.co'
const EMAIL_PASS = process.env.SMTP_PASSWORD || ''

const BRANDED_SIGNATURE = `
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
`

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )
}

// POST /api/session/daily-summary
// Called on kid logout. Schedules a summary email after 10 minutes.
// If the kid logs back in before 10 mins, call DELETE to cancel.
export async function POST(req: NextRequest) {
  try {
    const { childId } = await req.json()
    if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

    const supabase = getSupabase()
    const sendAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // Upsert pending summary — one row per child, replaced each logout
    const { error } = await supabase
      .from('pending_summaries')
      .upsert({ learner_id: childId, send_at: sendAt, sent: false }, { onConflict: 'learner_id' })

    if (error) {
      console.error('pending_summaries upsert error:', error)
      return NextResponse.json({ error: 'Failed to schedule summary' }, { status: 500 })
    }

    console.log(`Daily summary scheduled for child ${childId} at ${sendAt}`)
    return NextResponse.json({ success: true, sendAt })
  } catch (err) {
    console.error('daily-summary POST error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// DELETE /api/session/daily-summary
// Called on kid login — cancels any pending summary (they came back within 10 mins)
export async function DELETE(req: NextRequest) {
  try {
    const { childId } = await req.json()
    if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

    const supabase = getSupabase()
    await supabase
      .from('pending_summaries')
      .update({ sent: true }) // Mark as sent so cron skips it
      .eq('learner_id', childId)
      .eq('sent', false)

    console.log(`Daily summary cancelled for child ${childId} — returned within 10 mins`)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('daily-summary DELETE error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// GET /api/session/daily-summary
// Called by cron every 5 minutes — fires any due summaries
export async function GET(req: NextRequest) {
  // Verify cron secret
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()

  // Find pending summaries that are due and not yet sent
  const { data: pending, error } = await supabase
    .from('pending_summaries')
    .select('learner_id, send_at')
    .eq('sent', false)
    .lte('send_at', new Date().toISOString())
    .limit(20)

  if (error) {
    console.error('pending_summaries fetch error:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  if (!pending || pending.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  let sent = 0
  for (const row of pending) {
    try {
      await sendDailySummary(row.learner_id, supabase)
      // Mark as sent
      await supabase
        .from('pending_summaries')
        .update({ sent: true })
        .eq('learner_id', row.learner_id)
      sent++
    } catch (err) {
      console.error(`Failed to send summary for ${row.learner_id}:`, err)
    }
  }

  return NextResponse.json({ sent })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendDailySummary(childId: string, supabase: any) {
  // Get learner + account
  const { data: learner } = await supabase
    .from('learners')
    .select('name, year_level, account_id')
    .eq('id', childId)
    .single()

  if (!learner?.account_id) throw new Error('Learner not found')

  const { data: account } = await supabase
    .from('accounts')
    .select('email, full_name')
    .eq('id', learner.account_id)
    .single()

  if (!account?.email) throw new Error('Account email not found')

  // Get today's sessions (NZ timezone — use UTC and accept ±1 day edge case)
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data: sessions } = await supabase
    .from('sessions')
    .select('stars_earned, questions_correct, questions_total, subject, duration_seconds, weak_topics, strong_topics, completed_at')
    .eq('learner_id', childId)
    .gte('completed_at', todayStart.toISOString())
    .order('completed_at', { ascending: true })

  if (!sessions || sessions.length === 0) {
    console.log(`No sessions today for ${childId} — skipping email`)
    return
  }

  // Aggregate across all sessions
  const totalStars = sessions.reduce((s: number, r: Record<string, unknown>) => s + ((r.stars_earned as number) || 0), 0)
  const totalCorrect = sessions.reduce((s: number, r: Record<string, unknown>) => s + ((r.questions_correct as number) || 0), 0)
  const totalQuestions = sessions.reduce((s: number, r: Record<string, unknown>) => s + ((r.questions_total as number) || 0), 0)
  const totalDuration = Math.round(sessions.reduce((s: number, r: Record<string, unknown>) => s + ((r.duration_seconds as number) || 0), 0) / 60)
  const subjectSet = new Set(sessions.flatMap((s: Record<string, unknown>) => ((s.subject as string) || '').split(', ').map((x: string) => x.trim()).filter(Boolean)))
  const subjects = Array.from(subjectSet)
  const weakTopics = [...new Set(sessions.flatMap((s: Record<string, unknown>) => (s.weak_topics as string[]) || []))]
  const strongTopics = [...new Set(sessions.flatMap((s: Record<string, unknown>) => (s.strong_topics as string[]) || []))]

  // Get all-time star total
  const { data: starRows } = await supabase
    .from('star_ledger')
    .select('stars')
    .eq('learner_id', childId)
  const allTimeStars = (starRows || []).reduce((s: number, r: Record<string, unknown>) => s + ((r.stars as number) || 0), 0)

  // Get streak
  const { data: recentSessions } = await supabase
    .from('sessions')
    .select('completed_at')
    .eq('learner_id', childId)
    .order('completed_at', { ascending: false })
    .limit(30)

  let streakDays = 0
  if (recentSessions && recentSessions.length > 0) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const seenDays = new Set<string>()
    for (const s of recentSessions) {
      const d = new Date(s.completed_at)
      d.setHours(0, 0, 0, 0)
      seenDays.add(d.toISOString().slice(0, 10))
    }
    let check = new Date(today)
    while (seenDays.has(check.toISOString().slice(0, 10))) {
      streakDays++
      check.setDate(check.getDate() - 1)
    }
  }

  // Get jar allocation
  const { data: jar } = await supabase
    .from('jar_allocations')
    .select('save_pct, spend_pct, give_pct')
    .eq('learner_id', childId)
    .single()

  const jarAllocation = { save: jar?.save_pct || 50, spend: jar?.spend_pct || 30, give: jar?.give_pct || 20 }

  // Generate email with Claude
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const sessionCount = sessions.length
  const sessionWord = sessionCount === 1 ? 'session' : 'sessions'

  const prompt = `You are Earni, the AI tutor at Learni (learniapp.co). Write a daily summary email to ${account.full_name || 'there'} about ${learner.name}'s learning today.

## TODAY'S SUMMARY
- Sessions completed: ${sessionCount} ${sessionWord}
- Total time: ${totalDuration} minutes
- Subjects covered: ${subjects.join(', ') || 'Mixed'}
- Stars earned today: ${totalStars} (all-time total: ${allTimeStars})
- Questions: ${totalCorrect}/${totalQuestions} correct
- Streak: ${streakDays} day${streakDays !== 1 ? 's' : ''} in a row
- Jar split: Save ${jarAllocation.save}% / Spend ${jarAllocation.spend}% / Give ${jarAllocation.give}%
- Strong areas: ${strongTopics.join(', ') || 'Solid across the board'}
- Needs work: ${weakTopics.join(', ') || 'Nothing specific — great day'}

## EMAIL STRUCTURE
1. One specific win from today — be concrete
2. What to focus on next time (if anything)
3. Stars earned + jar allocation
4. Streak celebration (if > 1 day)
5. One warm closing line from Earni

## RULES
- Keep it SHORT — parents skim. 6-8 lines max.
- Warm but not gushy. Specific, not generic.
- Sign off as "— Earni"
- Return plain text only, no HTML, no markdown.`

  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  })

  const plainBody = response.content[0].type === 'text'
    ? response.content[0].text
    : `Hi ${account.full_name || 'there'}, ${learner.name} had a great day on Learni — ${totalStars} stars earned across ${sessionCount} ${sessionWord}! — Earni`

  // Convert to HTML
  const htmlContent = plainBody
    .split('\n\n')
    .filter(p => p.trim())
    .map(p => `<p style="margin: 0 0 14px; font-size: 15px; color: #3a6660; line-height: 1.6;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('')

  const htmlBody = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, 'Nunito', 'Segoe UI', sans-serif; color: #0d2b28; line-height: 1.65; max-width: 560px; margin: 0 auto; padding: 20px; background: #ffffff;">
  <div style="text-align: center; margin-bottom: 24px; padding: 24px 0 16px;">
    <div style="font-family: 'Nunito', sans-serif; font-size: 26px; font-weight: 900; color: #0d2b28; letter-spacing: -0.5px;">
      learni<span style="color: #2ec4b6;">.</span>
    </div>
    <div style="margin-top: 16px; font-size: 36px;">⭐</div>
  </div>
  <div style="font-size: 15px; color: #0d2b28;">
    ${htmlContent}
    <div style="background: #f7fafa; border-radius: 14px; padding: 16px 20px; margin: 20px 0; font-size: 14px; color: #5a8a84;">
      <strong style="color: #0d2b28;">Today's stats:</strong>
      ${totalStars} stars earned · 
      ${totalCorrect}/${totalQuestions} correct · 
      ${totalDuration} min · 
      ${sessionCount} ${sessionWord}${streakDays > 1 ? ` · 🔥 ${streakDays}-day streak` : ''}
    </div>
    <div style="text-align: center; margin: 24px 0;">
      <a href="https://learniapp.co/dashboard" style="display: inline-block; background: #2ec4b6; color: white; padding: 12px 28px; border-radius: 28px; font-family: 'Nunito', sans-serif; font-weight: 900; font-size: 15px; text-decoration: none; box-shadow: 0 4px 16px rgba(46,196,182,0.3);">
        View the Hub →
      </a>
    </div>
  </div>
  ${BRANDED_SIGNATURE}
</body></html>`

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    requireTLS: true,
    auth: { user: EMAIL_FROM, pass: EMAIL_PASS },
  })

  await transporter.sendMail({
    from: `Earni from Learni <${EMAIL_FROM}>`,
    to: account.email,
    subject: `${learner.name}'s day on Learni ⭐`,
    text: plainBody,
    html: htmlBody,
  })

  console.log(`Daily summary sent to ${account.email} for ${learner.name} (${sessionCount} sessions, ${totalStars} stars)`)
}
