import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? SUPABASE_KEY

interface Goals { cal: number; p: number; f: number; c: number }

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

function calcScore(totals: Goals, goals: Goals): number {
  if (!goals.cal || !goals.p || !goals.f || !goals.c) return 0
  return Math.round(
    Math.min(totals.cal / goals.cal, 1) * 25 +
    (Math.min(totals.p / goals.p, 1.2) / 1.2) * 25 +
    Math.min(totals.f / goals.f, 1) * 25 +
    Math.min(totals.c / goals.c, 1) * 25
  )
}

function calcStreak(loggedDates: Set<string>, referenceDate: string): number {
  let streak = 0
  const cursor = new Date(referenceDate + 'T12:00:00')
  // Если сегодня уже есть записи — считаем с сегодня, иначе со вчера
  if (!loggedDates.has(referenceDate)) {
    cursor.setDate(cursor.getDate() - 1)
  }
  while (true) {
    const dateStr = cursor.toISOString().slice(0, 10)
    if (!loggedDates.has(dateStr)) break
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

// GET /api/team/progress?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const { error, token, userId } = await getUser(req)
  if (error || !token) return Response.json({ error }, { status: 401 })

  const dateParam = req.nextUrl.searchParams.get('date')
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
    ? dateParam
    : new Date().toISOString().slice(0, 10)

  const supabase = getSupabase(token)
  // Используем service role для чтения данных участников.
  const admin = createClient(SUPABASE_URL, SERVICE_KEY)

  // Находим команду пользователя
  const { data: membership, error: membershipErr } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()

  if (membershipErr) return Response.json({ error: membershipErr.message }, { status: 500 })
  if (!membership) return Response.json({ error: 'Не в команде' }, { status: 400 })

  // Список участников команды читаем через service role, чтобы не зависеть от RLS team_members select.
  const { data: members } = await admin
    .from('team_members')
    .select('user_id, display_name')
    .eq('team_id', membership.team_id)

  if (!members?.length) return Response.json([])

  const memberIds = members.map(m => m.user_id)

  // Дата 90 дней назад для стрика
  const fromDate = new Date(date + 'T12:00:00')
  fromDate.setDate(fromDate.getDate() - 90)
  const fromDateStr = fromDate.toISOString().slice(0, 10)

  // Запрашиваем все даты за 90 дней для всех участников (для стрика)
  const { data: allDates } = await admin
    .from('meals')
    .select('user_id, meal_date')
    .in('user_id', memberIds)
    .gte('meal_date', fromDateStr)
    .lte('meal_date', date)

  // Запрашиваем суммы за конкретную дату
  const { data: dayMeals } = await admin
    .from('meals')
    .select('user_id, cal, p, f, c')
    .in('user_id', memberIds)
    .eq('meal_date', date)

  // Запрашиваем цели всех участников
  const { data: allGoals } = await admin
    .from('user_goals')
    .select('user_id, cal, p, f, c')
    .in('user_id', memberIds)

  const DEFAULT_GOALS: Goals = { cal: 2800, p: 150, f: 80, c: 300 }

  const result = members.map(member => {
    // Цели участника
    const goalRow = allGoals?.find(g => g.user_id === member.user_id)
    const goals: Goals = goalRow
      ? { cal: goalRow.cal, p: goalRow.p, f: goalRow.f, c: goalRow.c }
      : DEFAULT_GOALS

    // Суммы за день
    const dayRows = dayMeals?.filter(m => m.user_id === member.user_id) ?? []
    const totals: Goals = dayRows.reduce(
      (acc, m) => ({ cal: acc.cal + (m.cal ?? 0), p: acc.p + (m.p ?? 0), f: acc.f + (m.f ?? 0), c: acc.c + (m.c ?? 0) }),
      { cal: 0, p: 0, f: 0, c: 0 }
    )

    // Стрик
    const memberDates = new Set(
      (allDates ?? []).filter(d => d.user_id === member.user_id).map(d => d.meal_date as string)
    )
    const streak = calcStreak(memberDates, date)

    return {
      user_id: member.user_id,
      display_name: member.display_name,
      is_self: member.user_id === userId,
      goals,
      totals,
      score: calcScore(totals, goals),
      streak,
      logged_today: dayRows.length > 0,
    }
  })

  return Response.json(result)
}
