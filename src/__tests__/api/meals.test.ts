/**
 * @jest-environment node
 */

// ──────────────────────────────────────────────
// Chainable Supabase mock
// ──────────────────────────────────────────────
const mockGetUser = jest.fn()
const mockSingle = jest.fn()

// Универсальная цепочка для from().select/insert/update/delete.eq.eq.order/single
function makeChain(terminalResolve?: () => Promise<any>) {
  const chain: any = {}
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'order']
  methods.forEach(m => { chain[m] = jest.fn(() => chain) })
  if (terminalResolve) {
    chain.single = jest.fn(terminalResolve)
    // Делаем сам chain awaitable для DELETE (нет .single())
    chain.then = (resolve: any, reject: any) =>
      terminalResolve().then(resolve, reject)
  } else {
    chain.single = mockSingle
  }
  return chain
}

let currentChain = makeChain()

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: jest.fn(() => currentChain),
  })),
}))

import { GET, POST, PATCH, DELETE } from '../../app/api/meals/route'

function makeReq(
  method: string,
  url: string,
  body?: Record<string, unknown>,
  token = 'valid-token',
) {
  return {
    headers: { get: (k: string) => (k === 'authorization' ? `Bearer ${token}` : null) },
    nextUrl: new URL(url),
    json: async () => body ?? {},
  } as any
}

const authed = { data: { user: { id: 'user-1' } }, error: null }
const unauthed = { data: { user: null }, error: new Error('Unauthorized') }

// ──────────────────────────────────────────────
describe('GET /api/meals', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue(authed)
    currentChain = makeChain()
    currentChain.order.mockResolvedValue({ data: [{ id: '1', name: 'Суп', cal: 200 }], error: null })
  })

  it('возвращает 401 если нет токена', async () => {
    const req = {
      headers: { get: () => null },
      nextUrl: new URL('http://localhost/api/meals?date=2025-01-15'),
      json: async () => ({}),
    } as any
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('возвращает 401 если пользователь не авторизован', async () => {
    mockGetUser.mockResolvedValue(unauthed)
    const res = await GET(makeReq('GET', 'http://localhost/api/meals?date=2025-01-15'))
    expect(res.status).toBe(401)
  })

  it('возвращает 200 и массив блюд при успехе', async () => {
    const res = await GET(makeReq('GET', 'http://localhost/api/meals?date=2025-01-15'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data[0].name).toBe('Суп')
  })

  it('возвращает 500 при ошибке БД', async () => {
    currentChain.order.mockResolvedValue({ data: null, error: { message: 'DB error' } })
    const res = await GET(makeReq('GET', 'http://localhost/api/meals?date=2025-01-15'))
    expect(res.status).toBe(500)
  })
})

// ──────────────────────────────────────────────
describe('POST /api/meals', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue(authed)
    mockSingle.mockResolvedValue({ data: { id: 'new-id', name: 'Суп', cal: 300 }, error: null })
    currentChain = makeChain()
    currentChain.single = mockSingle
  })

  it('возвращает 401 без токена', async () => {
    const req = {
      headers: { get: () => null },
      nextUrl: new URL('http://localhost/api/meals'),
      json: async () => ({ name: 'Суп', cal: 300, p: 10, f: 5, c: 40 }),
    } as any
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('создаёт блюдо и возвращает 200', async () => {
    const body = { name: 'Суп', cal: 300, p: 10, f: 5, c: 40 }
    const res = await POST(makeReq('POST', 'http://localhost/api/meals', body))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.name).toBe('Суп')
  })

  it('принимает явную meal_date в теле запроса', async () => {
    const body = { name: 'Суп', cal: 300, p: 10, f: 5, c: 40, meal_date: '2025-01-10' }
    const res = await POST(makeReq('POST', 'http://localhost/api/meals', body))
    expect(res.status).toBe(200)
  })

  it('возвращает 500 при ошибке БД', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'DB Error' } })
    const body = { name: 'Суп', cal: 300 }
    const res = await POST(makeReq('POST', 'http://localhost/api/meals', body))
    expect(res.status).toBe(500)
  })
})

// ──────────────────────────────────────────────
describe('PATCH /api/meals', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue(authed)
    mockSingle.mockResolvedValue({
      data: { id: 'meal-1', name: 'Суп обновлённый', cal: 350 },
      error: null,
    })
    currentChain = makeChain()
    currentChain.single = mockSingle
  })

  it('возвращает 401 без токена', async () => {
    const req = {
      headers: { get: () => null },
      nextUrl: new URL('http://localhost/api/meals'),
      json: async () => ({}),
    } as any
    const res = await PATCH(req)
    expect(res.status).toBe(401)
  })

  it('обновляет блюдо и возвращает 200', async () => {
    const body = { id: 'meal-1', name: 'Суп обновлённый', cal: 350, p: 12, f: 6, c: 45 }
    const res = await PATCH(makeReq('PATCH', 'http://localhost/api/meals', body))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.name).toBe('Суп обновлённый')
  })

  it('возвращает 500 при ошибке БД', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'DB Error' } })
    const body = { id: 'meal-1', name: 'Суп', cal: 300, p: 10, f: 5, c: 40 }
    const res = await PATCH(makeReq('PATCH', 'http://localhost/api/meals', body))
    expect(res.status).toBe(500)
  })
})

// ──────────────────────────────────────────────
describe('DELETE /api/meals', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue(authed)
    // DELETE вызывает chain без .single() — awaitable через .then
    currentChain = makeChain(async () => ({ error: null }))
  })

  it('возвращает 401 без токена', async () => {
    const req = {
      headers: { get: () => null },
      nextUrl: new URL('http://localhost/api/meals'),
      json: async () => ({}),
    } as any
    const res = await DELETE(req)
    expect(res.status).toBe(401)
  })

  it('удаляет блюдо и возвращает { ok: true }', async () => {
    const body = { id: 'meal-1' }
    const res = await DELETE(makeReq('DELETE', 'http://localhost/api/meals', body))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.ok).toBe(true)
  })

  it('возвращает 500 при ошибке БД', async () => {
    currentChain = makeChain(async () => ({ error: { message: 'DB Error' } }))
    const body = { id: 'meal-1' }
    const res = await DELETE(makeReq('DELETE', 'http://localhost/api/meals', body))
    expect(res.status).toBe(500)
  })
})
