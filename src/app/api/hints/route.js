import { createClient } from '@supabase/supabase-js'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

function getSupabase(token) {
  return createClient(URL, KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
}

// Returns hour range [start, end) for each meal period
function getPeriodRange(hour) {
  if (hour >= 5 && hour < 11) return { period: 'breakfast', min: 5, max: 11 }
  if (hour >= 11 && hour < 16) return { period: 'lunch', min: 11, max: 16 }
  if (hour >= 16 && hour < 22) return { period: 'dinner', min: 16, max: 22 }
  return { period: 'snack', min: 22, max: 29 } // 22-5 wraps, handled below
}

export async function GET(req) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = getSupabase(token)
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Get hour from query param (client sends current hour)
  const { searchParams } = new URL(req.url)
  const hour = parseInt(searchParams.get('hour') ?? new Date().getHours(), 10)
  const { period, min, max } = getPeriodRange(hour)

  // Fetch all meals for this user with their hour
  const { data, error } = await supabase
    .from('meals')
    .select('name, created_at')
    .eq('user_id', user.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Count meal name frequency for current period vs all time
  const periodCount = {}
  const allCount = {}

  for (const meal of data) {
    const mealHour = new Date(meal.created_at).getHours()
    const name = meal.name

    allCount[name] = (allCount[name] || 0) + 1

    let inPeriod = false
    if (period === 'snack') {
      inPeriod = mealHour >= 22 || mealHour < 5
    } else {
      inPeriod = mealHour >= min && mealHour < max
    }
    if (inPeriod) periodCount[name] = (periodCount[name] || 0) + 1
  }

  // Sort by period frequency, fallback to allCount
  const sorted = Object.keys(allCount).sort((a, b) => {
    const diff = (periodCount[b] || 0) - (periodCount[a] || 0)
    return diff !== 0 ? diff : allCount[b] - allCount[a]
  })

  return Response.json({ period, hints: sorted })
}
