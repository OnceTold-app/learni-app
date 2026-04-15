import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function PATCH(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, email } = body

  if (!name && !email) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  // Update account record
  const updates: Record<string, string> = {}
  if (name) updates.full_name = name

  if (Object.keys(updates).length > 0) {
    await supabase.from('accounts').update(updates).eq('user_id', user.id)
  }

  // Update email in Supabase auth if changed
  if (email && email !== user.email) {
    const { error: emailError } = await supabase.auth.admin.updateUserById(user.id, { email })
    if (emailError) {
      return NextResponse.json({ error: 'Failed to update email: ' + emailError.message }, { status: 400 })
    }
  }

  return NextResponse.json({ ok: true })
}
