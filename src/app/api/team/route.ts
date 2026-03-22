import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''

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

// GET /api/team — получить свою команду (null если не в команде)
export async function GET(req: NextRequest) {
  const { error, token, userId } = await getUser(req)
  if (error || !token) return Response.json({ error }, { status: 401 })

  const supabase = getSupabase(token)

  const { data: membership } = await supabase
    .from('team_members')
    .select('team_id, display_name')
    .eq('user_id', userId)
    .maybeSingle()

  if (!membership) return Response.json(null)

  const { data: team, error: teamErr } = await supabase
    .from('teams')
    .select('id, name, invite_code, created_at')
    .eq('id', membership.team_id)
    .single()

  if (teamErr || !team) return Response.json(null)

  const { data: members } = await supabase
    .from('team_members')
    .select('user_id, display_name, joined_at')
    .eq('team_id', team.id)

  return Response.json({ ...team, members: members ?? [] })
}

// POST /api/team — создать команду
export async function POST(req: NextRequest) {
  const { error, token, userId } = await getUser(req)
  if (error || !token) return Response.json({ error }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const name: string = (body.name ?? 'Команда').trim() || 'Команда'
  const displayName: string = (body.display_name ?? '').trim()
  if (!displayName) return Response.json({ error: 'display_name обязателен' }, { status: 400 })

  const supabase = getSupabase(token)

  // Проверяем, что пользователь ещё не в команде
  const { data: existing } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) return Response.json({ error: 'Вы уже состоите в команде' }, { status: 400 })

  // Создаём команду (используем anon key — RLS policy "anyone can create team")
  const adminSupabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_KEY)
  const { data: team, error: createErr } = await adminSupabase
    .from('teams')
    .insert({ name })
    .select()
    .single()

  if (createErr || !team) return Response.json({ error: createErr?.message ?? 'Ошибка создания' }, { status: 500 })

  // Добавляем создателя как участника
  const { error: memberErr } = await supabase
    .from('team_members')
    .insert({ team_id: team.id, user_id: userId, display_name: displayName })

  if (memberErr) {
    // откатываем команду
    await adminSupabase.from('teams').delete().eq('id', team.id)
    return Response.json({ error: memberErr.message }, { status: 500 })
  }

  return Response.json({ ...team, members: [{ user_id: userId, display_name: displayName, joined_at: new Date().toISOString() }] })
}
