import { test, expect, Page } from '@playwright/test'

const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? ''
const TEST_PASS = process.env.TEST_USER_PASSWORD ?? ''

async function signIn(page: Page) {
  await page.goto('http://localhost:3000')
  await page.locator('input[type="email"]').fill(TEST_EMAIL)
  await page.locator('input[type="password"]').fill(TEST_PASS)
  await page.locator('button[type="submit"]').click()
  await page.waitForSelector('text=Meal Fix', { timeout: 10000 })
}

test.describe('Навигация по датам', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!TEST_EMAIL || !TEST_PASS, 'Нужны TEST_USER_EMAIL и TEST_USER_PASSWORD')
    await signIn(page)
  })

  test('кнопка → заблокирована на сегодняшней дате', async ({ page }) => {
    const nextBtn = page.locator('text=→').locator('..')
    await expect(nextBtn).toBeDisabled()
  })

  test('кнопка ← переключает на вчера', async ({ page }) => {
    const initialText = await page.locator('[class*="label"]').first().textContent()
    await page.locator('text=←').click()
    const newText = await page.locator('[class*="label"]').first().textContent()
    expect(newText).not.toBe(initialText)
  })

  test('появляется кнопка "сегодня" после перехода назад', async ({ page }) => {
    await expect(page.locator('text=сегодня')).not.toBeVisible()
    await page.locator('text=←').click()
    await expect(page.locator('text=сегодня')).toBeVisible()
  })

  test('кнопка "сегодня" возвращает к текущей дате', async ({ page }) => {
    const todayLabel = await page.locator('[class*="label"]').first().textContent()

    await page.locator('text=←').click()
    await page.locator('text=сегодня').click()

    const label = await page.locator('[class*="label"]').first().textContent()
    expect(label).toBe(todayLabel)
  })
})

test.describe('Модал настроек', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!TEST_EMAIL || !TEST_PASS, 'Нужны TEST_USER_EMAIL и TEST_USER_PASSWORD')
    await signIn(page)
  })

  test('кнопка "⚙ цели" открывает модал настроек', async ({ page }) => {
    await page.locator('text=⚙ цели').click()
    // Должны появиться поля настроек целей
    await expect(page.locator('text=Калории').or(page.locator('[placeholder*="ккал"]'))).toBeVisible({ timeout: 3000 })
  })

  test('модал настроек можно закрыть', async ({ page }) => {
    await page.locator('text=⚙ цели').click()
    // Ищем кнопку закрытия или Отмена
    await page.locator('text=Отмена').or(page.locator('[class*="overlay"]')).first().click()
    // Модал должен закрыться
    await expect(page.locator('text=Отмена')).not.toBeVisible({ timeout: 3000 })
  })

  test('можно ввести значения калорий в настройках', async ({ page }) => {
    await page.locator('text=⚙ цели').click()
    const calInput = page.locator('input[placeholder*="2000"], input[type="number"]').first()
    await calInput.fill('2200')
    await expect(calInput).toHaveValue('2200')
  })
})

test.describe('Модал статистики', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!TEST_EMAIL || !TEST_PASS, 'Нужны TEST_USER_EMAIL и TEST_USER_PASSWORD')
    await signIn(page)
  })

  test('кнопка "📊" открывает модал статистики', async ({ page }) => {
    await page.locator('text=📊').click()
    // Должны появиться кнопки выбора периода
    await expect(
      page.locator('text=7 дней').or(page.locator('text=14 дней')).or(page.locator('text=30 дней'))
    ).toBeVisible({ timeout: 3000 })
  })

  test('в статистике можно переключать периоды 7/14/30 дней', async ({ page }) => {
    await page.locator('text=📊').click()
    await page.locator('text=14 дней').click()
    await expect(page.locator('text=14 дней')).toBeVisible()
    await page.locator('text=30 дней').click()
    await expect(page.locator('text=30 дней')).toBeVisible()
  })
})

test.describe('API: Barcode endpoint (без авторизации)', () => {
  test('возвращает 400 на невалидный баркод', async ({ request }) => {
    const res = await request.get('http://localhost:3000/api/barcode?barcode=123')
    expect(res.status()).toBe(400)
  })

  test('возвращает 400 если баркод не передан', async ({ request }) => {
    const res = await request.get('http://localhost:3000/api/barcode')
    expect(res.status()).toBe(400)
  })

  test('возвращает 400 на баркод с буквами', async ({ request }) => {
    const res = await request.get('http://localhost:3000/api/barcode?barcode=abc12345')
    expect(res.status()).toBe(400)
  })
})

test.describe('API: защищённые endpoint-ы требуют авторизацию', () => {
  test('GET /api/meals без токена возвращает 401', async ({ request }) => {
    const res = await request.get('http://localhost:3000/api/meals?date=2025-01-15')
    expect(res.status()).toBe(401)
  })

  test('POST /api/meals без токена возвращает 401', async ({ request }) => {
    const res = await request.post('http://localhost:3000/api/meals', {
      data: { name: 'Тест', cal: 100 },
    })
    expect(res.status()).toBe(401)
  })

  test('GET /api/goals без токена возвращает 401', async ({ request }) => {
    const res = await request.get('http://localhost:3000/api/goals')
    expect(res.status()).toBe(401)
  })

  test('GET /api/hints без токена возвращает 401', async ({ request }) => {
    const res = await request.get('http://localhost:3000/api/hints?hour=12')
    expect(res.status()).toBe(401)
  })

  test('GET /api/stats без токена возвращает 401', async ({ request }) => {
    const res = await request.get('http://localhost:3000/api/stats?days=7')
    expect(res.status()).toBe(401)
  })

  test('GET /api/keys без токена возвращает 401', async ({ request }) => {
    const res = await request.get('http://localhost:3000/api/keys')
    expect(res.status()).toBe(401)
  })
})
