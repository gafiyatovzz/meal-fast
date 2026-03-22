import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_KEY

function getSupabase(token: string) {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
}

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? null
  if (!token) return { error: 'Unauthorized', token: null, userId: null }
  const supabase = getSupabase(token)
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { error: 'Unauthorized', token: null, userId: null }
  return { error: null, token, userId: user.id }
}

// DELETE /api/team/leave — покинуть команду
export async function DELETE(req: NextRequest) {
  const { error, token, userId } = await getUser(req)
  if (error || !token) return Response.json({ error }, { status: 401 })

  const supabase = getSupabase(token)

  const { data: membership } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!membership) return Response.json({ error: 'Вы не состоите в команде' }, { status: 400 })

  const teamId = membership.team_id

  // Удаляем себя из команды
  const { error: deleteErr } = await supabase
    .from('team_members')
    .delete()
    .eq('user_id', userId)
    .eq('team_id', teamId)

  if (deleteErr) return Response.json({ error: deleteErr.message }, { status: 500 })

  // Если команда опустела — удаляем её (через service role)
  const adminSupabase = createClient(SUPABASE_URL, SERVICE_KEY)
  const { count } = await adminSupabase
    .from('team_members')
    .select('user_id', { count: 'exact', head: true })
    .eq('team_id', teamId)

  if (count === 0) {
    await adminSupabase.from('teams').delete().eq('id', teamId)
  }

  return Response.json({ ok: true })
}
