import { test, expect } from '@playwright/test'

test.describe('Auth', () => {
  test('shows login form on root', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await expect(page.locator('.logo, [class*="logo"]').first()).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('toggles between login and signup', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await expect(page.locator('button[type="submit"]')).toContainText('Войти')
    await page.locator('text=Зарегистрироваться').last().click()
    await expect(page.locator('button[type="submit"]')).toContainText('Зарегистрироваться')
    await page.locator('text=Войти').last().click()
    await expect(page.locator('button[type="submit"]')).toContainText('Войти')
  })

  test('shows error on invalid login', async ({ page }) => {
    await page.goto('http://localhost:3000')
    await page.locator('input[type="email"]').fill('wrong@test.com')
    await page.locator('input[type="password"]').fill('wrongpass')
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('.err, [class*="err"]')).toBeVisible({ timeout: 8000 })
  })
})
