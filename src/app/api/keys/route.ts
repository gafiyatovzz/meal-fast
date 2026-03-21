import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { encrypt } from '../../../lib/encrypt'

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

const PROVIDERS = ['anthropic', 'openai', 'gemini'] as const

export async function GET(req: NextRequest) {
  const { error, token, userId } = await getUser(req)
  if (error || !token) return Response.json({ error }, { status: 401 })

  const supabase = getSupabase(token)
  const { data } = await supabase
    .from('user_api_keys')
    .select('anthropic_key, openai_key, gemini_key, provider')
    .eq('user_id', userId)
    .single()

  return Response.json({
    anthropic_set: !!data?.anthropic_key,
    openai_set:    !!data?.openai_key,
    gemini_set:    !!data?.gemini_key,
    provider:      data?.provider ?? 'anthropic',
  })
}

export async function POST(req: NextRequest) {
  const { error, token, userId } = await getUser(req)
  if (error || !token) return Response.json({ error }, { status: 401 })

  const supabase = getSupabase(token)
  const body = await req.json()

  // Fetch existing row to preserve untouched keys
  const { data: existing } = await supabase
    .from('user_api_keys')
    .select('anthropic_key, openai_key, gemini_key')
    .eq('user_id', userId)
    .single()

  const row: Record<string, string | null> = {
    user_id:    userId,
    provider:   body.provider ?? 'anthropic',
    updated_at: new Date().toISOString(),
  }

  for (const p of PROVIDERS) {
    const field = `${p}_key`
    const incoming = body[p]          // null = delete, '' = keep, string = new key
    if (incoming === null) {
      row[field] = null               // delete
    } else if (incoming) {
      row[field] = encrypt(incoming)  // encrypt new key
    } else {
      row[field] = (existing as Record<string, string | null> | null)?.[field] ?? null  // keep existing
    }
  }

  const { error: dbErr } = await supabase.from('user_api_keys').upsert(row)
  if (dbErr) return Response.json({ error: dbErr.message }, { status: 500 })
  return Response.json({ ok: true })
}
