import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''

function getSupabase(token: string) {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
}

interface PeriodRange {
  period: string
  min: number
  max: number
}

function getPeriodRange(hour: number): PeriodRange {
  if (hour >= 5 && hour < 11) return { period: 'breakfast', min: 5, max: 11 }
  if (hour >= 11 && hour < 16) return { period: 'lunch', min: 11, max: 16 }
  if (hour >= 16 && hour < 22) return { period: 'dinner', min: 16, max: 22 }
  return { period: 'snack', min: 22, max: 29 }
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? null
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabase(token)
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const tzOffset = parseInt(searchParams.get('tz') ?? '0', 10) // minutes west of UTC (JS convention)
  const hour = parseInt(searchParams.get('hour') ?? String(new Date().getHours()), 10)
  const { period, min, max } = getPeriodRange(hour)

  const { data, error } = await supabase
    .from('meals')
    .select('name, created_at')
    .eq('user_id', user.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const periodCount: Record<string, number> = {}
  const allCount: Record<string, number> = {}

  for (const meal of data) {
    const mealHour = new Date(new Date(meal.created_at).getTime() - tzOffset * 60000).getUTCHours()
    const name: string = meal.name

    allCount[name] = (allCount[name] || 0) + 1

    let inPeriod = false
    if (period === 'snack') {
      inPeriod = mealHour >= 22 || mealHour < 5
    } else {
      inPeriod = mealHour >= min && mealHour < max
    }
    if (inPeriod) periodCount[name] = (periodCount[name] || 0) + 1
  }

  const sorted = Object.keys(allCount).sort((a, b) => {
    const diff = (periodCount[b] || 0) - (periodCount[a] || 0)
    return diff !== 0 ? diff : allCount[b] - allCount[a]
  })

  return Response.json({ period, hints: sorted })
}
