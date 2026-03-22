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

export async function GET(req: NextRequest) {
  const { error, token, userId } = await getUser(req)
  if (error || !token) return Response.json({ error }, { status: 401 })

  const days = Math.min(parseInt(req.nextUrl.searchParams.get('days') ?? '30'), 90)
  const todayParam = req.nextUrl.searchParams.get('today')
  const todayDate = todayParam && /^\d{4}-\d{2}-\d{2}$/.test(todayParam)
    ? new Date(todayParam + 'T12:00:00')
    : new Date()
  const from = new Date(todayDate)
  from.setDate(from.getDate() - days + 1)
  const fromDate = from.toISOString().slice(0, 10)

  const supabase = getSupabase(token)
  const { data, error: dbErr } = await supabase
    .from('meals')
    .select('meal_date, cal, p, f, c')
    .eq('user_id', userId)
    .gte('meal_date', fromDate)
    .order('meal_date', { ascending: true })

  if (dbErr) return Response.json({ error: dbErr.message }, { status: 500 })

  // Aggregate by day
  const map = new Map<string, { cal: number; p: number; f: number; c: number }>()
  for (const row of (data ?? [])) {
    const d = row.meal_date as string
    const prev = map.get(d) ?? { cal: 0, p: 0, f: 0, c: 0 }
    map.set(d, {
      cal: prev.cal + (row.cal ?? 0),
      p:   prev.p   + (row.p   ?? 0),
      f:   prev.f   + (row.f   ?? 0),
      c:   prev.c   + (row.c   ?? 0),
    })
  }

  // Fill all dates in range (including days with no meals as zeros)
  const result = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(todayDate)
    d.setDate(d.getDate() - i)
    const date = d.toISOString().slice(0, 10)
    result.push({ date, ...(map.get(date) ?? { cal: 0, p: 0, f: 0, c: 0 }) })
  }

  return Response.json(result)
}
