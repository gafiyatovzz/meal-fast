import { createClient } from '@supabase/supabase-js'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

function getSupabase(token) {
  return createClient(URL, KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
}

async function getUser(req) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return { error: 'Unauthorized', token: null, userId: null }
  const supabase = getSupabase(token)
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { error: 'Unauthorized', token: null, userId: null }
  return { error: null, token, userId: user.id }
}

const TODAY = () => new Date().toISOString().slice(0, 10)

export async function GET(req) {
  const { error, token, userId } = await getUser(req)
  if (error) return Response.json({ error }, { status: 401 })

  const supabase = getSupabase(token)
  const { data, error: dbErr } = await supabase
    .from('meals')
    .select('*')
    .eq('meal_date', TODAY())
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (dbErr) return Response.json({ error: dbErr.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(req) {
  const { error, token, userId } = await getUser(req)
  if (error) return Response.json({ error }, { status: 401 })

  const supabase = getSupabase(token)
  const body = await req.json()
  const { data, error: dbErr } = await supabase
    .from('meals')
    .insert({ ...body, meal_date: TODAY(), user_id: userId })
    .select()
    .single()

  if (dbErr) return Response.json({ error: dbErr.message }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(req) {
  const { error, token, userId } = await getUser(req)
  if (error) return Response.json({ error }, { status: 401 })

  const supabase = getSupabase(token)
  const { id } = await req.json()
  const { error: dbErr } = await supabase
    .from('meals')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (dbErr) return Response.json({ error: dbErr.message }, { status: 500 })
  return Response.json({ ok: true })
}
