import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { decrypt } from '../../../lib/encrypt'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? ''

const SYSTEM = `Ты — нутрициолог. Оцени стандартную порцию блюда. Верни ТОЛЬКО JSON без markdown:
{"name":"Короткое название (рус)","cal":число,"p":число,"f":число,"c":число}
cal=калории, p=белки г, f=жиры г, c=углеводы г. Все значения — целые числа. Несколько блюд — суммируй.`

// ─── Resolve user's preferred provider + key, fall back to project key ─────────

async function resolveProvider(authHeader: string | null): Promise<{ provider: string; key: string }> {
  const fallback = { provider: 'anthropic', key: process.env.ANTHROPIC_API_KEY ?? '' }
  if (!authHeader) return fallback

  const token = authHeader.replace('Bearer ', '')
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return fallback

    const { data } = await supabase
      .from('user_api_keys')
      .select('anthropic_key, openai_key, gemini_key, provider')
      .eq('user_id', user.id)
      .single()

    if (!data) return fallback

    const provider = data.provider ?? 'anthropic'
    const encKey = (data as Record<string, string | null>)[`${provider}_key`]
    if (!encKey) return fallback // key not set for chosen provider → project key

    return { provider, key: decrypt(encKey) }
  } catch {
    return fallback
  }
}

// ─── Provider implementations ──────────────────────────────────────────────────

async function callAnthropic(key: string, text: string, imageBase64?: string, imageType?: string): Promise<string> {
  type Block = { type: 'image'; source: { type: 'base64'; media_type: string; data: string } } | { type: 'text'; text: string }
  const content: string | Block[] = imageBase64
    ? [
        { type: 'image', source: { type: 'base64', media_type: imageType || 'image/jpeg', data: imageBase64 } },
        { type: 'text', text: text ? `На фото еда. Дополнительно: ${text}` : 'Что на фото? Оцени КБЖУ порции.' },
      ]
    : text

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      system: SYSTEM,
      messages: [{ role: 'user', content }],
    }),
  })
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  return data.content.map((b: { text?: string }) => b.text || '').join('')
}

async function callOpenAI(key: string, text: string, imageBase64?: string, imageType?: string): Promise<string> {
  type Part = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }
  const userContent: string | Part[] = imageBase64
    ? [
        { type: 'image_url', image_url: { url: `data:${imageType || 'image/jpeg'};base64,${imageBase64}` } },
        { type: 'text', text: text ? `На фото еда. Дополнительно: ${text}` : 'Что на фото? Оцени КБЖУ порции.' },
      ]
    : text

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 400,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: userContent },
      ],
    }),
  })
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  return data.choices[0].message.content ?? ''
}

async function callGemini(key: string, text: string, imageBase64?: string, imageType?: string): Promise<string> {
  type Part = { text: string } | { inline_data: { mime_type: string; data: string } }
  const parts: Part[] = imageBase64
    ? [
        { inline_data: { mime_type: imageType || 'image/jpeg', data: imageBase64 } },
        { text: `${SYSTEM}\n\n${text ? `На фото еда. Дополнительно: ${text}` : 'Что на фото? Оцени КБЖУ порции.'}` },
      ]
    : [{ text: `${SYSTEM}\n\n${text}` }]

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts }], generationConfig: { maxOutputTokens: 400 } }),
  })
  if (!res.ok) throw new Error(await res.text())
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || '').join('') ?? ''
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { text, imageBase64, imageType } = await req.json()
  const { provider, key } = await resolveProvider(req.headers.get('authorization'))

  let raw: string
  try {
    if (provider === 'openai') {
      raw = await callOpenAI(key, text, imageBase64, imageType)
    } else if (provider === 'gemini') {
      raw = await callGemini(key, text, imageBase64, imageType)
    } else {
      raw = await callAnthropic(key, text, imageBase64, imageType)
    }
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }

  try {
    const meal = JSON.parse(raw.replace(/```json?|```/g, '').trim())
    return Response.json(meal)
  } catch {
    return Response.json({ error: 'Parse error', raw }, { status: 500 })
  }
}
