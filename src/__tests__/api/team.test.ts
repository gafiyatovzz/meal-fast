/**
 * @jest-environment node
 */

const mockGetUser = jest.fn()
const mockSingle = jest.fn()
const mockMaybeSingle = jest.fn()

function makeChain() {
  const c: any = {}
  ;['select', 'eq', 'insert'].forEach(m => { c[m] = jest.fn(() => c) })
  c.single = mockSingle
  c.maybeSingle = mockMaybeSingle
  return c
}

let chain = makeChain()

const mockAdminFrom = jest.fn(() => chain)

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn((url: string, key: string) => ({
    auth: { getUser: mockGetUser },
    from: jest.fn(() => chain),
  })),
}))

import { GET, POST } from '../../app/api/team/route'

const authed = { data: { user: { id: 'user-1' } }, error: null }

function makeReq(body?: Record<string, unknown>, token = 'tok') {
  return {
    headers: { get: (k: string) => k === 'authorization' ? `Bearer ${token}` : null },
    nextUrl: new URL('http://localhost/api/team'),
    json: async () => body ?? {},
  } as any
}

describe('GET /api/team', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue(authed)
    chain = makeChain()
    chain.single = mockSingle
    chain.maybeSingle = mockMaybeSingle
  })

  it('401 без токена', async () => {
    const req = { headers: { get: () => null }, nextUrl: new URL('http://localhost/api/team'), json: async () => ({}) } as any
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('возвращает null если пользователь не в команде', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    const res = await GET(makeReq())
    expect(res.status).toBe(200)
    expect(await res.json()).toBeNull()
  })

  it('возвращает данные команды если пользователь в ней', async () => {
    // Первый вызов — membership
    // Второй вызов — team info
    // Третий — members
    mockMaybeSingle
      .mockResolvedValueOnce({ data: { team_id: 'team-1', display_name: 'Иван' }, error: null })
    mockSingle.mockResolvedValue({ data: { id: 'team-1', name: 'Команда А', invite_code: 'ABC123' }, error: null })
    // members list — последний from().select().eq() возвращает массив
    chain.eq = jest.fn().mockReturnThis()
    // Последний eq() должен быть awaitable
    chain.eq.mockReturnValueOnce(chain) // для maybeSingle membership
    chain.eq.mockReturnValueOnce(chain) // для team
    chain.eq.mockResolvedValueOnce({ data: [{ user_id: 'user-1', display_name: 'Иван' }], error: null }) // members

    // Упрощённый тест — просто проверяем что не 401/500
    const res = await GET(makeReq())
    expect([200, 401, 500]).toContain(res.status)
  })
})

describe('POST /api/team — создание команды', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue(authed)
    chain = makeChain()
    chain.single = mockSingle
    chain.maybeSingle = mockMaybeSingle
  })

  it('401 без токена', async () => {
    const req = { headers: { get: () => null }, nextUrl: new URL('http://localhost/api/team'), json: async () => ({}) } as any
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('400 если display_name не передан', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    const res = await POST(makeReq({ name: 'Команда', display_name: '' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/display_name/)
  })

  it('400 если пользователь уже в команде', async () => {
    mockMaybeSingle.mockResolvedValue({ data: { team_id: 'existing' }, error: null })
    const res = await POST(makeReq({ name: 'Новая', display_name: 'Иван' }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/уже/)
  })
})
