import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  const { childId, avatar } = await req.json()
  if (!childId || !avatar) {
    return NextResponse.json({ error: 'childId and avatar required' }, { status: 400 })
  }

  // Upsert earni_profiles
  const { error } = await supabase
    .from('earni_profiles')
    .upsert({
      learner_id: childId,
      skin_tone: avatar.skinTone,
      hair_color: avatar.hairColor,
      hair_style: avatar.hairStyle,
      eye_color: avatar.eyeColor,
      accessory: avatar.accessory,
    }, { onConflict: 'learner_id' })

  if (error) {
    // If earni_profiles table doesn't exist or has different columns, store in learners
    const { error: err2 } = await supabase
      .from('learners')
      .update({ avatar_data: avatar })
      .eq('id', childId)

    if (err2) return NextResponse.json({ error: err2.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
