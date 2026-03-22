/**
 * @jest-environment node
 */

const mockGetUser = jest.fn()
const mockOrder = jest.fn()

function makeChain() {
  const c: any = {}
  ;['select', 'eq', 'gte'].forEach(m => { c[m] = jest.fn(() => c) })
  c.order = mockOrder
  return c
}

let chain = makeChain()

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: mockGetUser },
    from: jest.fn(() => chain),
  })),
}))

import { GET } from '../../app/api/stats/route'

const authed = { data: { user: { id: 'user-1' } }, error: null }

function makeReq(params: Record<string, string> = {}, token = 'tok') {
  const url = new URL('http://localhost/api/stats')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return {
    headers: { get: (k: string) => k === 'authorization' ? `Bearer ${token}` : null },
    nextUrl: url,
  } as any
}

describe('GET /api/stats', () => {
  beforeEach(() => {
    mockGetUser.mockResolvedValue(authed)
    chain = makeChain()
    chain.order = mockOrder
  })

  it('401 без токена', async () => {
    const req = { headers: { get: () => null }, nextUrl: new URL('http://localhost/api/stats?days=7') } as any
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('возвращает массив за 7 дней', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null })
    const res = await GET(makeReq({ days: '7', today: '2025-01-15' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(7)
  })

  it('возвращает массив за 30 дней', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null })
    const res = await GET(makeReq({ days: '30', today: '2025-03-01' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(30)
  })

  it('ограничивает до 90 дней', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null })
    const res = await GET(makeReq({ days: '200', today: '2025-01-31' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(90)
  })

  it('заполняет дни без блюд нулями', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null })
    const res = await GET(makeReq({ days: '7', today: '2025-01-15' }))
    const data = await res.json()
    data.forEach((d: any) => {
      expect(d.cal).toBe(0)
      expect(d.p).toBe(0)
    })
  })

  it('агрегирует несколько блюд за один день', async () => {
    mockOrder.mockResolvedValue({
      data: [
        { meal_date: '2025-01-15', cal: 300, p: 20, f: 10, c: 30 },
        { meal_date: '2025-01-15', cal: 500, p: 40, f: 15, c: 50 },
      ],
      error: null,
    })
    const res = await GET(makeReq({ days: '7', today: '2025-01-15' }))
    const data = await res.json()
    const day = data.find((d: any) => d.date === '2025-01-15')
    expect(day.cal).toBe(800)
    expect(day.p).toBe(60)
  })

  it('возвращает даты в хронологическом порядке', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null })
    const res = await GET(makeReq({ days: '7', today: '2025-01-15' }))
    const data = await res.json()
    expect(data[0].date).toBe('2025-01-09')
    expect(data[6].date).toBe('2025-01-15')
  })

  it('500 при ошибке БД', async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: 'DB Error' } })
    const res = await GET(makeReq({ days: '7' }))
    expect(res.status).toBe(500)
  })

  it('использует сегодняшнюю дату если today не передан', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null })
    const res = await GET(makeReq({ days: '7' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(7)
  })
})
