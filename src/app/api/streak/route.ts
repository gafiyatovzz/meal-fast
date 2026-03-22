import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''

function getSupabase(token: string) {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? null
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabase(token)
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const todayParam = req.nextUrl.searchParams.get('today')
  const todayStr = todayParam && /^\d{4}-\d{2}-\d{2}$/.test(todayParam)
    ? todayParam
    : new Date().toISOString().slice(0, 10)

  const { data } = await supabase
    .from('meals')
    .select('meal_date')
    .eq('user_id', user.id)
    .lte('meal_date', todayStr)
    .order('meal_date', { ascending: false })

  if (!data || data.length === 0) return Response.json({ streak: 0 })

  const dates = new Set(data.map(r => r.meal_date as string))

  let streak = 0
  const cursor = new Date(todayStr + 'T12:00:00')
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  return Response.json({ streak })
}
