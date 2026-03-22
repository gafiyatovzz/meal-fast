/**
 * @jest-environment node
 */
import { GET } from '../../app/api/barcode/route'

// Мок для глобального fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

function makeRequest(barcode: string | null) {
  const url = barcode
    ? `http://localhost:3000/api/barcode?barcode=${barcode}`
    : 'http://localhost:3000/api/barcode'
  return {
    nextUrl: new URL(url),
  } as any
}

const goodProduct = {
  status: 1,
  product: {
    product_name_ru: 'Гречка',
    product_name: 'Buckwheat',
    nutriments: {
      'energy-kcal_100g': 343,
      proteins_100g: 13.3,
      fat_100g: 3.4,
      carbohydrates_100g: 62.1,
    },
  },
}

describe('GET /api/barcode', () => {
  beforeEach(() => mockFetch.mockReset())

  it('возвращает 400 если barcode не передан', async () => {
    const res = await GET(makeRequest(null))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('Invalid barcode')
  })

  it('возвращает 400 если barcode меньше 8 цифр', async () => {
    const res = await GET(makeRequest('1234567'))
    expect(res.status).toBe(400)
  })

  it('возвращает 400 если barcode больше 14 цифр', async () => {
    const res = await GET(makeRequest('123456789012345'))
    expect(res.status).toBe(400)
  })

  it('возвращает 400 если barcode содержит буквы', async () => {
    const res = await GET(makeRequest('12345abc'))
    expect(res.status).toBe(400)
  })

  it('возвращает 502 при сетевой ошибке OpenFoodFacts', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    const res = await GET(makeRequest('12345678'))
    expect(res.status).toBe(502)
    const data = await res.json()
    expect(data.error).toBe('Network error')
  })

  it('возвращает 502 если OFF API возвращает не-OK статус', async () => {
    mockFetch.mockResolvedValue({ ok: false })
    const res = await GET(makeRequest('12345678'))
    expect(res.status).toBe(502)
  })

  it('возвращает 404 если продукт не найден (status=0)', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ status: 0 }),
    })
    const res = await GET(makeRequest('12345678'))
    expect(res.status).toBe(404)
  })

  it('возвращает 404 если нет nutritional данных', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 1,
        product: {
          product_name: 'Test',
          nutriments: { 'energy-kcal_100g': 0, proteins_100g: 0, fat_100g: 0, carbohydrates_100g: 0 },
        },
      }),
    })
    const res = await GET(makeRequest('12345678'))
    expect(res.status).toBe(404)
  })

  it('возвращает данные продукта при успешном запросе', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => goodProduct,
    })
    const res = await GET(makeRequest('12345678'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.name).toBe('Гречка')
    expect(data.cal100).toBe(343)
    expect(data.p100).toBe(13)
    expect(data.f100).toBe(3)
    expect(data.c100).toBe(62)
  })

  it('использует product_name_ru в приоритете над product_name', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => goodProduct,
    })
    const res = await GET(makeRequest('12345678'))
    const data = await res.json()
    expect(data.name).toBe('Гречка') // product_name_ru
  })

  it('использует product_name если product_name_ru отсутствует', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 1,
        product: {
          product_name: 'Buckwheat',
          nutriments: { 'energy-kcal_100g': 343, proteins_100g: 13, fat_100g: 3, carbohydrates_100g: 62 },
        },
      }),
    })
    const res = await GET(makeRequest('12345678'))
    const data = await res.json()
    expect(data.name).toBe('Buckwheat')
  })

  it('принимает 8-значный баркод', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => goodProduct })
    const res = await GET(makeRequest('12345678'))
    expect(res.status).toBe(200)
  })

  it('принимает 13-значный баркод', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => goodProduct })
    const res = await GET(makeRequest('1234567890123'))
    expect(res.status).toBe(200)
  })
})
