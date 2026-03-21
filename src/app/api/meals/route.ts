import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''

function getSupabase(token: string) {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
}

async function getUser(req: NextRequest): Promise<{ error: string | null; token: string | null; userId: string | null }> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? null
  if (!token) return { error: 'Unauthorized', token: null, userId: null }
  const supabase = getSupabase(token)
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { error: 'Unauthorized', token: null, userId: null }
  return { error: null, token, userId: user.id }
}

const TODAY = () => new Date().toISOString().slice(0, 10)

export async function GET(req: NextRequest) {
  const { error, token, userId } = await getUser(req)
  if (error || !token) return Response.json({ error }, { status: 401 })

  const date = req.nextUrl.searchParams.get('date') ?? TODAY()
  const supabase = getSupabase(token)
  const { data, error: dbErr } = await supabase
    .from('meals')
    .select('*')
    .eq('meal_date', date)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (dbErr) return Response.json({ error: dbErr.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(req: NextRequest) {
  const { error, token, userId } = await getUser(req)
  if (error || !token) return Response.json({ error }, { status: 401 })

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

export async function PATCH(req: NextRequest) {
  const { error, token, userId } = await getUser(req)
  if (error || !token) return Response.json({ error }, { status: 401 })

  const supabase = getSupabase(token)
  const { id, name, cal, p, f, c } = await req.json()
  const { data, error: dbErr } = await supabase
    .from('meals')
    .update({ name, cal, p, f, c })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (dbErr) return Response.json({ error: dbErr.message }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(req: NextRequest) {
  const { error, token, userId } = await getUser(req)
  if (error || !token) return Response.json({ error }, { status: 401 })

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
