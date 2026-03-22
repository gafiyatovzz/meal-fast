/**
 * @jest-environment node
 */

const mockGetUser = jest.fn()
const mockSingle = jest.fn()
const mockUpsert = jest.fn()

function makeChain() {
  const c: any = {}
  ;['select', 'eq'].forEach(m => { c[m] = jest.fn(() => c) })
  c.single = mockSingle
  c.upsert = jest.fn(() => ({ error: null, then: undefined }))
  return c
}

let chain = makeChain()

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: jest.fn(() => chain),
  })),
}))

import { GET, POST } from '../../app/api/keys/route'

const authed = { data: { user: { id: 'user-1' } }, error: null }

function makeReq(body?: Record<string, unknown>, token = 'tok') {
  return {
    headers: { get: (k: string) => k === 'authorization' ? `Bearer ${token}` : null },
    nextUrl: new URL('http://localhost/api/keys'),
    json: async () => body ?? {},
  } as any
}

describe('GET /api/keys', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue(authed)
    chain = makeChain()
    chain.single = mockSingle
  })

  it('401 без токена', async () => {
    const req = { headers: { get: () => null }, nextUrl: new URL('http://localhost/api/keys'), json: async () => ({}) } as any
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('возвращает флаги наличия ключей', async () => {
    mockSingle.mockResolvedValue({
      data: { anthropic_key: 'enc-key', openai_key: null, gemini_key: 'enc-key2', provider: 'anthropic' },
      error: null,
    })
    const res = await GET(makeReq())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.anthropic_set).toBe(true)
    expect(data.openai_set).toBe(false)
    expect(data.gemini_set).toBe(true)
    expect(data.provider).toBe('anthropic')
  })

  it('возвращает дефолтные значения если нет записи', async () => {
    mockSingle.mockResolvedValue({ data: null, error: null })
    const res = await GET(makeReq())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.anthropic_set).toBe(false)
    expect(data.openai_set).toBe(false)
    expect(data.gemini_set).toBe(false)
    expect(data.provider).toBe('anthropic')
  })
})

describe('POST /api/keys', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue(authed)
    chain = makeChain()
    // GET existing row
    chain.single = jest.fn().mockResolvedValue({
      data: { anthropic_key: null, openai_key: null, gemini_key: null },
      error: null,
    })
    // Upsert returns no error
    chain.upsert = jest.fn().mockResolvedValue({ error: null })
  })

  it('401 без токена', async () => {
    const req = { headers: { get: () => null }, nextUrl: new URL('http://localhost/api/keys'), json: async () => ({}) } as any
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('возвращает { ok: true } при успехе', async () => {
    const body = { anthropic: 'sk-ant-new-key', openai: '', gemini: null, provider: 'anthropic' }
    const res = await POST(makeReq(body))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
  })

  it('шифрует новый ключ (не сохраняет plain text)', async () => {
    let savedRow: Record<string, unknown> | null = null
    chain.upsert = jest.fn().mockImplementation((row: Record<string, unknown>) => {
      savedRow = row
      return { error: null }
    })
    const body = { anthropic: 'sk-ant-secret', openai: '', gemini: '', provider: 'anthropic' }
    await POST(makeReq(body))
    // Ключ должен быть зашифрован, не равен исходному
    expect(savedRow?.anthropic_key).not.toBe('sk-ant-secret')
    expect(typeof savedRow?.anthropic_key).toBe('string')
  })

  it('удаляет ключ если передан null', async () => {
    let savedRow: Record<string, unknown> | null = null
    chain.upsert = jest.fn().mockImplementation((row: Record<string, unknown>) => {
      savedRow = row
      return { error: null }
    })
    const body = { anthropic: null, openai: '', gemini: '', provider: 'anthropic' }
    await POST(makeReq(body))
    expect(savedRow?.anthropic_key).toBeNull()
  })

  it('сохраняет provider', async () => {
    let savedRow: Record<string, unknown> | null = null
    chain.upsert = jest.fn().mockImplementation((row: Record<string, unknown>) => {
      savedRow = row
      return { error: null }
    })
    const body = { anthropic: '', openai: 'sk-openai', gemini: '', provider: 'openai' }
    await POST(makeReq(body))
    expect(savedRow?.provider).toBe('openai')
  })

  it('500 при ошибке БД', async () => {
    chain.upsert = jest.fn().mockResolvedValue({ error: { message: 'DB Error' } })
    const res = await POST(makeReq({ anthropic: null, openai: null, gemini: null, provider: 'anthropic' }))
    expect(res.status).toBe(500)
  })
})
