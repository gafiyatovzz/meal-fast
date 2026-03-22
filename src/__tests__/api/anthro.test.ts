/**
 * @jest-environment node
 */

const mockGetUser = jest.fn()
const mockSingle = jest.fn()

function makeChain() {
  const c: any = {}
  ;['select', 'upsert', 'eq'].forEach(m => { c[m] = jest.fn(() => c) })
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

import { GET, POST } from '../../app/api/anthro/route'

const authed = { data: { user: { id: 'user-1' } }, error: null }

function makeReq(body?: Record<string, unknown>, token = 'tok') {
  return {
    headers: { get: (k: string) => k === 'authorization' ? `Bearer ${token}` : null },
    json: async () => body ?? {},
  } as any
}

describe('GET /api/anthro', () => {
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

  it('возвращает антропометрические данные', async () => {
    const anthro = { weight: '75', height: '180', age: '30', gender: 'м' }
    mockSingle.mockResolvedValue({ data: anthro, error: null })
    const res = await GET(makeReq())
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.weight).toBe('75')
  })

  it('возвращает null если нет записи (PGRST116)', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'no row' } })
    const res = await GET(makeReq())
    expect(res.status).toBe(200)
    expect(await res.json()).toBeNull()
  })

  it('500 при ошибке БД', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: 'OTHER', message: 'error' } })
    const res = await GET(makeReq())
    expect(res.status).toBe(500)
  })
})

describe('POST /api/anthro', () => {
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

  it('сохраняет данные и возвращает их', async () => {
    const body = { weight: '80', height: '175', age: '25', gender: 'ж' }
    mockSingle.mockResolvedValue({ data: body, error: null })
    const res = await POST(makeReq(body))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.gender).toBe('ж')
  })

  it('500 при ошибке БД', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'Error' } })
    const res = await POST(makeReq({ weight: '70' }))
    expect(res.status).toBe(500)
  })
})
