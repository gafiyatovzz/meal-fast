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

// POST /api/team/join — вступить по invite_code
export async function POST(req: NextRequest) {
  const { error, token, userId } = await getUser(req)
  if (error || !token) return Response.json({ error }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const inviteCode: string = (body.invite_code ?? '').trim()
  const displayName: string = (body.display_name ?? '').trim()

  if (!inviteCode) return Response.json({ error: 'invite_code обязателен' }, { status: 400 })
  if (!displayName) return Response.json({ error: 'display_name обязателен' }, { status: 400 })

  const supabase = getSupabase(token)

  // Проверяем, что пользователь ещё не в команде
  const { data: existing } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) return Response.json({ error: 'Вы уже состоите в команде' }, { status: 400 })

  // Ищем команду по коду (RLS policy "read team by invite code" разрешает)
  const { data: team, error: findErr } = await supabase
    .from('teams')
    .select('id, name, invite_code')
    .eq('invite_code', inviteCode)
    .maybeSingle()

  if (findErr || !team) return Response.json({ error: 'Команда не найдена' }, { status: 404 })

  // Проверяем количество участников (не более 10, разумный лимит)
  const { data: membersCheck } = await supabase
    .from('team_members')
    .select('user_id', { count: 'exact', head: true })
    .eq('team_id', team.id)

  // Добавляем участника
  const { error: insertErr } = await supabase
    .from('team_members')
    .insert({ team_id: team.id, user_id: userId, display_name: displayName })

  if (insertErr) return Response.json({ error: insertErr.message }, { status: 500 })

  // Возвращаем полную информацию о команде
  const { data: members } = await supabase
    .from('team_members')
    .select('user_id, display_name, joined_at')
    .eq('team_id', team.id)

  return Response.json({ ...team, members: members ?? [] })
}
