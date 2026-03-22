import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const barcode = req.nextUrl.searchParams.get('barcode')

  if (!barcode || !/^\d{8,14}$/.test(barcode)) {
    return Response.json({ error: 'Invalid barcode' }, { status: 400 })
  }

  const fields = 'product_name,product_name_ru,nutriments'
  const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=${fields}`

  let res: Response
  try {
    res = await fetch(url, {
      headers: { 'User-Agent': 'NutritionTrackerApp/1.0' },
      next: { revalidate: 86400 },
    })
  } catch {
    return Response.json({ error: 'Network error' }, { status: 502 })
  }

  if (!res.ok) {
    return Response.json({ error: 'OFF API error' }, { status: 502 })
  }

  const data = await res.json()

  if (data.status === 0 || !data.product) {
    return Response.json({ error: 'Product not found' }, { status: 404 })
  }

  const p = data.product
  const name: string = p.product_name_ru || p.product_name || 'Неизвестный продукт'
  const n = p.nutriments ?? {}

  const cal100 = Math.round(n['energy-kcal_100g'] ?? 0)
  const pro100 = Math.round(n.proteins_100g ?? 0)
  const fat100 = Math.round(n.fat_100g ?? 0)
  const carb100 = Math.round(n.carbohydrates_100g ?? 0)

  if (cal100 === 0 && pro100 === 0 && fat100 === 0 && carb100 === 0) {
    return Response.json({ error: 'No nutrition data' }, { status: 404 })
  }

  return Response.json({ name, cal100, p100: pro100, f100: fat100, c100: carb100 })
}
