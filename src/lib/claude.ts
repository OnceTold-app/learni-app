import Anthropic from '@anthropic-ai/sdk'

// ─── NEVER hardcode the model string in other files ───
// Always import CLAUDE_MODEL from here
export const CLAUDE_MODEL = 'claude-haiku-4-5-20251001'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// ─────────────────────────────────────────────────────
// generateExplanation
// Called when a child answers incorrectly.
// Returns a warm 1-2 sentence explanation.
// Earni NEVER says "wrong" or "incorrect".
// ─────────────────────────────────────────────────────
export async function generateExplanation(
  question: string,
  correctAnswer: string,
  childName: string,
  yearLevel: number
): Promise<string> {
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 120,
    system: `You are Earni, a warm and encouraging AI tutor for children.
You are talking to ${childName} who is in Year ${yearLevel}.
When a child gets an answer wrong, NEVER say "wrong", "incorrect", or "not quite".
Give a short, warm 1-2 sentence explanation that helps them understand why.
Use simple language appropriate for Year ${yearLevel}.
Be encouraging. End with gentle reassurance.
Maximum 2 sentences. No markdown. No emojis.`,
    messages: [
      {
        role: 'user',
        content: `Question: "${question}"
Correct answer: ${correctAnswer}
Generate a warm explanation for ${childName}.`,
      },
    ],
  })

  return response.content[0].type === 'text'
    ? response.content[0].text
    : `Let me show you how that works!`
}

// ─────────────────────────────────────────────────────
// generateGreeting
// Earni's opening message at the start of a session.
// References the child's name, topic, and streak.
// ─────────────────────────────────────────────────────
export async function generateGreeting(
  childName: string,
  topic: string,
  streakDays: number
): Promise<string> {
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 80,
    system: `You are Earni, an enthusiastic but calm AI tutor.
Write ONE short greeting sentence. 
Mention the child's name. Reference today's topic briefly.
If streak > 0, briefly celebrate it (keep it light, not over the top).
Sound warm and encouraging. No markdown. No emojis.`,
    messages: [
      {
        role: 'user',
        content: `Child: ${childName}, Topic: ${topic}, Streak: ${streakDays} days`,
      },
    ],
  })

  return response.content[0].type === 'text'
    ? response.content[0].text
    : `Hi ${childName}! Ready to learn some ${topic} today?`
}

// ─────────────────────────────────────────────────────
// generateSessionSummary
// Short summary shown on the reward screen.
// ─────────────────────────────────────────────────────
export async function generateSessionSummary(
  childName: string,
  topic: string,
  correct: number,
  total: number,
  starsEarned: number
): Promise<string> {
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 60,
    system: `You are Earni. Write ONE encouraging sentence summarising this session.
Mention stars earned. Be celebratory but genuine — not over the top.
No markdown. No emojis in the text.`,
    messages: [
      {
        role: 'user',
        content: `${childName} got ${correct}/${total} on ${topic} and earned ${starsEarned} stars.`,
      },
    ],
  })

  return response.content[0].type === 'text'
    ? response.content[0].text
    : `Great session, ${childName} — ${starsEarned} stars earned!`
}
