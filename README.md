# earni.

AI voice tutor that pays children real money to learn.  
Built for Lia (9) and Demi (7). Turquoise is Demi's favourite colour.

---

## What this is

Earni is a Next.js web app. Parents sign up, add a child, and the child completes AI-guided maths lessons. Every correct answer earns stars. Stars convert to real dollars tracked in The Hub. Parents pay outside the app — Earni is a ledger, not a bank.

**Stack:** Next.js 15 · TypeScript · Tailwind · Supabase · Stripe · Claude Haiku API

---

## First thing to do

Read the full developer brief before writing any code:  
→ Send Mo a message and he'll share the `earni-stirling-brief.html` file

Order of operations:
1. Run the schema SQL in Supabase (see below)
2. Get Mo to review and sign off on the schema
3. Only then start building UI

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/stirlingaiagent/earni.git
cd earni
npm install
```

### 2. Environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local` with values from Mo. You need:
- Supabase URL + anon key + service role key
- Anthropic API key
- Stripe publishable key + secret key + webhook secret

### 3. Database

Open the Supabase dashboard → SQL Editor → paste and run `supabase/schema.sql`

This creates all tables, RLS policies, and indexes.  
**Never skip the RLS step.** Test it by logging in as two different users and confirming each can only see their own data.

### 4. Run locally

```bash
npm run dev
```

App runs at `http://localhost:3000`

### 5. Stripe webhook (local testing)

```bash
# Install Stripe CLI first: https://stripe.com/docs/stripe-cli
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook secret it prints and put it in `.env.local` as `STRIPE_WEBHOOK_SECRET`.

---

## Project structure

```
src/
├── app/
│   ├── api/
│   │   ├── lesson/route.ts          ← Claude lesson explanations
│   │   ├── session/complete/route.ts ← Save session, award stars
│   │   └── stripe/
│   │       ├── checkout/route.ts    ← Create Stripe checkout
│   │       └── webhook/route.ts    ← Handle Stripe events
│   ├── (auth pages — build: login, signup)
│   ├── (hub pages — build: hub home, rewards, settings)
│   ├── (learn pages — build: child home, session, complete)
│   ├── layout.tsx
│   └── page.tsx                     ← Redirects to /signup for now
├── components/
│   ├── earni/
│   │   ├── avatar-display.tsx       ← SVG avatar renderer ✅
│   │   └── avatar-builder.tsx       ← Port from HTML file (TODO)
│   ├── hub/
│   │   ├── stars-owed.tsx           ← Mark-as-paid component ✅
│   │   └── jar-tracker.tsx          ← Spend/Save/Give jars ✅
│   └── ui/
│       ├── button.tsx               ✅
│       └── card.tsx                 ✅
├── lib/
│   ├── claude.ts                    ← generateExplanation, generateGreeting ✅
│   ├── stars.ts                     ← calculateStarsEarned, starsToDollars ✅
│   ├── stripe.ts                    ← Stripe client + price IDs ✅
│   └── supabase/
│       ├── client.ts                ← Browser client ✅
│       └── server.ts                ← Server component client ✅
├── middleware.ts                    ← Auth protection ✅
└── types/index.ts                   ← All TypeScript interfaces ✅
```

---

## Phase 1 build tasks (in order)

- [ ] **Task 1** — Schema + RLS (done here, run in Supabase)
- [ ] **Task 2** — Auth pages: `/signup` and `/login` using Supabase email/password
- [ ] **Task 3** — On signup: create `accounts` row automatically
- [ ] **Task 4** — Stripe products: create Starter ($19 NZD) + Family ($29 NZD) in dashboard, copy price IDs to `.env.local`
- [ ] **Task 5** — Plan selection page → Stripe checkout → webhook updates `accounts` row
- [ ] **Task 6** — Add learner flow: `/hub/learners/new` → creates `learners`, `earni_profiles`, `reward_settings`, `jar_allocations` rows
- [ ] **Task 7** — Avatar builder: port the `earni-avatar-builder.html` file into `avatar-builder.tsx`, wire save to Supabase
- [ ] **Task 8** — Lesson engine: tap mode, 5 question types (Mo supplies JSON). Call `/api/lesson` for wrong-answer explanations.
- [ ] **Task 9** — Session complete screen: call `/api/session/complete`, show stars animation, jar allocation
- [ ] **Task 10** — Child home screen: show avatar, stars this week, jars, today's lesson card
- [ ] **Task 11** — Hub home: learner card, recent sessions list, `StarsOwed` component
- [ ] **Task 12** — Hub rewards page: jar balances, mark-as-paid history
- [ ] **Task 13** — Hub settings: account email, plan name, Stripe Customer Portal link

**Phase 1 is done when:** Mo can log in, add Demi as a learner, Demi completes a 6-question maths session, stars appear in the Hub, and Mo can tap "Mark as paid."

---

## Key rules

**Never break these:**

- `RLS must be on` — test with two users before shipping anything
- `No real money movement` — the ledger tracks what's owed. Parent pays outside the app. Never add transfer/payout functionality.
- `Stripe webhook must verify signature` — `stripe.webhooks.constructEvent()` is already in the webhook route. Never remove it.
- `All API routes check auth first` — `supabase.auth.getUser()` before any data operation. Already done in all routes.
- `Children never have logins` — all data sits under the parent account. Learners have a PIN for the child UI only.
- `Dollar amounts as numeric(10,2)` — never floats. `starsToDollars()` in `lib/stars.ts` handles rounding.
- `Claude model string` — always import `CLAUDE_MODEL` from `lib/claude.ts`. Never hardcode it elsewhere.
- `Server components fetch data` — no client-side Supabase calls except for auth state and form submissions.

---

## Environment variables reference

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (never expose client-side) |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe dashboard → Developers → API keys |
| `STRIPE_SECRET_KEY` | Stripe dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe CLI output when running `stripe listen` |
| `STRIPE_PRICE_STARTER` | Stripe dashboard → Products → price ID |
| `STRIPE_PRICE_FAMILY` | Stripe dashboard → Products → price ID |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` for dev, `https://earni.app` for prod |

---

## Questions?

Message Mo on Telegram. If you're blocked for more than 2 hours, send a message — don't spend a day going in circles.

Mo writes the lesson content (question banks, prompts). Stirling builds the tech. Everything else is in the brief.
