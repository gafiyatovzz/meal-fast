/**
 * @jest-environment node
 */

const mockGetUser = jest.fn()
const mockSingle = jest.fn()

function makeChain() {
  const c: any = {}
  ;['select', 'from', 'upsert', 'eq'].forEach(m => { c[m] = jest.fn(() => c) })
  c.single = mockSingle
  return c
}

let chain = makeChain()

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: jest.fn(() => chain),
  })),
}))

import { GET, POST } from '../../app/api/goals/route'

const authed = { data: { user: { id: 'user-1' } }, error: null }

function makeReq(method: string, body?: Record<string, unknown>, token = 'tok') {
  return {
    headers: { get: (k: string) => k === 'authorization' ? `Bearer ${token}` : null },
    json: async () => body ?? {},
  } as any
}

describe('GET /api/goals', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue(authed)
    chain = makeChain()
    chain.single = mockSingle
  })

  it('401 без токена', async () => {
    const req = { headers: { get: () => null }, json: async () => ({}) } as any
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('возвращает цели пользователя', async () => {
    mockSingle.mockResolvedValue({ data: { cal: 2000, p: 150 }, error: null })
    const res = await GET(makeReq('GET'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.cal).toBe(2000)
  })

  it('возвращает null если записи нет (PGRST116)', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'no row' } })
    const res = await GET(makeReq('GET'))
    expect(res.status).toBe(200)
    expect(await res.json()).toBeNull()
  })

  it('500 при другой ошибке БД', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: '23505', message: 'DB error' } })
    const res = await GET(makeReq('GET'))
    expect(res.status).toBe(500)
  })
})

describe('POST /api/goals', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue(authed)
    chain = makeChain()
    chain.single = mockSingle
  })

  it('401 без токена', async () => {
    const req = { headers: { get: () => null }, json: async () => ({}) } as any
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('сохраняет цели и возвращает их', async () => {
    const goals = { cal: 2200, p: 160, f: 75, c: 220 }
    mockSingle.mockResolvedValue({ data: goals, error: null })
    const res = await POST(makeReq('POST', goals))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.cal).toBe(2200)
  })

  it('500 при ошибке БД', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'DB Error' } })
    const res = await POST(makeReq('POST', { cal: 2000 }))
    expect(res.status).toBe(500)
  })
})
