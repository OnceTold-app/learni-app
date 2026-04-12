import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import Anthropic from '@anthropic-ai/sdk'
import { CLAUDE_MODEL } from '@/lib/claude'
import { sessionEmailPrompt } from '@/lib/earni-prompts'

const SMTP_HOST = 'smtppro.zoho.com.au'
const SMTP_PORT = 587
const EMAIL_FROM = 'hello@learniapp.co'
const EMAIL_PASS = 'K!eyboard12345!'

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

async function sendSessionSummaryEmail({
  parentEmail,
  parentName,
  childName,
  sessionData,
}: {
  parentEmail: string
  parentName: string
  childName: string
  sessionData: Parameters<typeof sessionEmailPrompt>[2]
}) {
  try {
    // Generate email body with Claude
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const prompt = sessionEmailPrompt(childName, parentName, sessionData)

    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    })

    const plainBody = response.content[0].type === 'text'
      ? response.content[0].text
      : `Hi ${parentName}, ${childName} just completed a session and earned ${sessionData.starsEarned} stars! — Earni`

    // Convert line breaks to HTML paragraphs
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
      <strong style="color: #0d2b28;">Session stats:</strong>
      ${sessionData.starsEarned} stars earned · 
      ${sessionData.correctCount}/${sessionData.totalQuestions} correct · 
      ${sessionData.duration} min${sessionData.streakDays > 1 ? ` · 🔥 ${sessionData.streakDays}-day streak` : ''}
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
      to: parentEmail,
      subject: `${childName} just finished a session 🌟`,
      text: plainBody,
      html: htmlBody,
    })

    console.log(`Session summary email sent to ${parentEmail}`)
  } catch (err) {
    // Don't throw — fire-and-forget
    console.error('Session summary email failed:', err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      childId,
      starsEarned,
      correctCount,
      totalQuestions,
      subjects,
      duration,
      jarAllocation,
      weakTopics,
      strongTopics,
    } = body

    if (!childId) {
      return NextResponse.json({ error: 'childId required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Save session — ACTUAL column names from DB:
    // id, learner_id, subject, topic, questions_total, questions_correct,
    // stars_earned, duration_seconds, input_mode_used, completed_at, weak_topics, strong_topics
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        learner_id: childId,
        duration_seconds: duration || 0,
        stars_earned: starsEarned || 0,
        questions_correct: correctCount || 0,
        questions_total: totalQuestions || 0,
        subject: (subjects || ['Maths']).join(', '),
        topic: (subjects || ['Maths']).join(', '),
        completed_at: new Date().toISOString(),
        weak_topics: weakTopics || [],
        strong_topics: strongTopics || [],
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Session save error:', sessionError)
      return NextResponse.json({ error: 'Failed to save session', detail: sessionError.message }, { status: 500 })
    }

    // Add to star ledger — ACTUAL column names:
    // id, learner_id, session_id, type, stars, dollar_value, note, created_at
    if (starsEarned > 0 && session?.id) {
      const { error: starError } = await supabase.from('star_ledger').insert({
        learner_id: childId,
        session_id: session.id,
        type: 'earned',
        stars: starsEarned,
        note: `Session: ${(subjects || ['Practice']).join(', ')}`,
      })
      if (starError) {
        console.error('Star ledger error:', starError)
      }
    }

    // Update jar allocation if provided
    if (jarAllocation) {
      await supabase.from('jar_allocations').upsert({
        learner_id: childId,
        save_pct: jarAllocation.save || 50,
        spend_pct: jarAllocation.spend || 30,
        give_pct: jarAllocation.give || 20,
      }, { onConflict: 'learner_id' })
    }

    // ── Fire-and-forget session summary email ──
    // Get learner + account info for parent email
    const emailPromise = (async () => {
      try {
        // Get learner with account_id
        const { data: learner } = await supabase
          .from('learners')
          .select('name, account_id')
          .eq('id', childId)
          .single()

        if (!learner?.account_id) return

        // Get parent email from accounts
        const { data: account } = await supabase
          .from('accounts')
          .select('email, full_name')
          .eq('id', learner.account_id)
          .single()

        if (!account?.email) return

        // Get total stars for context
        const { data: starRows } = await supabase
          .from('star_ledger')
          .select('stars')
          .eq('learner_id', childId)

        const totalStars = (starRows || []).reduce((s: number, r: { stars: number }) => s + (r.stars || 0), 0)

        // Get streak (count consecutive days with sessions)
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

        await sendSessionSummaryEmail({
          parentEmail: account.email,
          parentName: account.full_name || 'there',
          childName: learner.name,
          sessionData: {
            duration: Math.round((duration || 0) / 60),
            subjects: subjects || ['Maths'],
            starsEarned: starsEarned || 0,
            totalStars,
            correctCount: correctCount || 0,
            totalQuestions: totalQuestions || 0,
            streakDays,
            jarAllocation: {
              save: jarAllocation?.save || 50,
              spend: jarAllocation?.spend || 30,
              give: jarAllocation?.give || 20,
            },
            strongTopics: strongTopics || [],
            weakTopics: weakTopics || [],
          },
        })
      } catch (err) {
        console.error('Session email background error:', err)
      }
    })()

    // Don't await — fire and forget
    void emailPromise

    return NextResponse.json({
      success: true,
      sessionId: session?.id,
      starsEarned,
    })
  } catch (error) {
    console.error('Session complete error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
