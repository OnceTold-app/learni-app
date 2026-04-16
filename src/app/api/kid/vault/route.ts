import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get('childId')
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  const { data: learner } = await supabase
    .from('learners')
    .select('vault_tier, jar_split, goal_vault, vault_unlocked_modules')
    .eq('id', childId)
    .single()

  return NextResponse.json({
    vaultTier: learner?.vault_tier || 1,
    jarSplit: learner?.jar_split || { save: 50, spend: 40, give: 10 },
    goalVault: learner?.goal_vault || null,
    unlockedModules: learner?.vault_unlocked_modules || [],
  })
}

export async function PATCH(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get('childId')
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  const body = await req.json()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  const updates: Record<string, unknown> = {}
  if (body.jarSplit) updates.jar_split = body.jarSplit
  if (body.goalVault !== undefined) updates.goal_vault = body.goalVault
  if (body.vaultTier) updates.vault_tier = body.vaultTier
  if (body.unlockedModule) {
    // Append module to unlocked list and check if tier should upgrade
    const { data: learner } = await supabase
      .from('learners')
      .select('vault_unlocked_modules, vault_tier')
      .eq('id', childId)
      .single()
    const current = learner?.vault_unlocked_modules || []
    if (!current.includes(body.unlockedModule)) {
      const newModules = [...current, body.unlockedModule]
      updates.vault_unlocked_modules = newModules
      // Auto-upgrade vault tier based on modules completed
      const tier2Modules = ['what-is-saving']
      const tier3Modules = ['spending-wisely', 'setting-a-goal']
      const tier4Modules = ['giving-and-why']
      if (tier4Modules.every((m: string) => newModules.includes(m)) && (learner?.vault_tier || 1) < 4)
        updates.vault_tier = 4
      else if (tier3Modules.every((m: string) => newModules.includes(m)) && (learner?.vault_tier || 1) < 3)
        updates.vault_tier = 3
      else if (tier2Modules.every((m: string) => newModules.includes(m)) && (learner?.vault_tier || 1) < 2)
        updates.vault_tier = 2
    }
  }

  await supabase.from('learners').update(updates).eq('id', childId)
  return NextResponse.json({ ok: true })
}
