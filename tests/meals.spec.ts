import { test, expect, Page } from '@playwright/test'

// Тесты требуют переменных окружения для тестового пользователя:
// TEST_USER_EMAIL и TEST_USER_PASSWORD
// Если не заданы — тесты пропускаются

const TEST_EMAIL = process.env.TEST_USER_EMAIL ?? ''
const TEST_PASS = process.env.TEST_USER_PASSWORD ?? ''

async function signIn(page: Page) {
  await page.goto('http://localhost:3000')
  await page.locator('input[type="email"]').fill(TEST_EMAIL)
  await page.locator('input[type="password"]').fill(TEST_PASS)
  await page.locator('button[type="submit"]').click()
  // Ждём появления трекера
  await page.waitForSelector('text=Meal Fix', { timeout: 10000 })
}

test.describe('Аутентификация — расширенные сценарии', () => {
  test('страница логина не даёт войти с пустым паролем', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.locator('input[type="email"]').fill('test@example.com')
    // Пароль не заполняем
    await page.locator('button[type="submit"]').click()
    // Браузерная валидация или ошибка сервера
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('форма регистрации показывает все поля', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.locator('text=Зарегистрироваться').last().click()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toContainText('Зарегистрироваться')
  })
})

test.describe('Управление блюдами', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!TEST_EMAIL || !TEST_PASS, 'Нужны TEST_USER_EMAIL и TEST_USER_PASSWORD')
    await signIn(page)
  })

  test('главная страница трекера содержит все основные элементы', async ({ page }) => {
    await expect(page.locator('text=Meal Fix')).toBeVisible()
    // Поле ввода
    await expect(page.locator('textarea[placeholder*="Что съел"]')).toBeVisible()
    // Кнопки навигации по датам
    await expect(page.locator('text=←')).toBeVisible()
    await expect(page.locator('text=→')).toBeVisible()
  })

  test('можно ввести текст в поле ввода', async ({ page }) => {
    const textarea = page.locator('textarea[placeholder*="Что съел"]')
    await textarea.fill('Тестовое блюдо 100г')
    await expect(textarea).toHaveValue('Тестовое блюдо 100г')
  })

  test('кнопка отправки становится активной при вводе текста', async ({ page }) => {
    const textarea = page.locator('textarea[placeholder*="Что съел"]')
    const sendBtn = page.locator('[aria-label="Отправить"]')

    // Изначально disabled
    await expect(sendBtn).toBeDisabled()

    // После ввода текста — активна
    await textarea.fill('Гречка 200г')
    await expect(sendBtn).not.toBeDisabled()
  })

  test('можно добавить блюдо и оно появляется в списке', async ({ page }) => {
    const textarea = page.locator('textarea[placeholder*="Что съел"]')
    await textarea.fill('Тест-блюдо-playwright')
    await page.locator('[aria-label="Отправить"]').click()

    // Ждём появления блюда в списке (AI обрабатывает, может занять время)
    await expect(page.locator('text=Тест-блюдо-playwright')).toBeVisible({ timeout: 30000 })
  })

  test('можно удалить блюдо из списка', async ({ page }) => {
    // Сначала добавляем блюдо
    const textarea = page.locator('textarea[placeholder*="Что съел"]')
    await textarea.fill('Блюдо-для-удаления')
    await page.locator('[aria-label="Отправить"]').click()
    await expect(page.locator('text=Блюдо-для-удаления')).toBeVisible({ timeout: 30000 })

    // Удаляем — кнопка ✕ рядом с блюдом
    const mealCard = page.locator('text=Блюдо-для-удаления').locator('..')
    await mealCard.locator('text=✕').click()

    // Блюдо должно исчезнуть
    await expect(page.locator('text=Блюдо-для-удаления')).not.toBeVisible({ timeout: 5000 })
  })

  test('можно нажать Enter для отправки формы', async ({ page }) => {
    const textarea = page.locator('textarea[placeholder*="Что съел"]')
    await textarea.fill('Яблоко')
    await textarea.press('Enter')
    // Загрузчик должен появиться или блюдо появится
    await expect(
      page.locator('[class*="loader"], [class*="dots"], text=Яблоко')
    ).toBeVisible({ timeout: 30000 })
  })
})

test.describe('Выход из системы', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!TEST_EMAIL || !TEST_PASS, 'Нужны TEST_USER_EMAIL и TEST_USER_PASSWORD')
    await signIn(page)
  })

  test('кнопка "выйти" возвращает на страницу логина', async ({ page }) => {
    await page.locator('text=выйти').click()
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 })
  })
})
