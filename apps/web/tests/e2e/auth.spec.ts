import { test, expect } from '@playwright/test'

test.describe('Auth', () => {
  test('register creates account and redirects', async ({ page }) => {
    const email = `e2e-reg-${Date.now()}@example.com`
    await page.goto('/register')
    await expect(
      page.getByRole('heading', { name: /sign up/i }).or(page.getByPlaceholder('you@example.com')),
    ).toBeVisible({ timeout: 10_000 })
    await page.getByPlaceholder('you@example.com').fill(email)
    await page.getByPlaceholder(/at least 8 characters/i).fill('e2e-password-123')
    await page.getByRole('button', { name: /sign up/i }).click()
    await expect(page).toHaveURL(/\/(?!register|login)/, { timeout: 8_000 })
    await page.goto('/decks/new')
    await expect(page).toHaveURL(/\/decks\/new/, { timeout: 5_000 })
    await expect(page.getByRole('textbox', { name: /name/i })).toBeVisible({ timeout: 5_000 })
  })

  test('login with valid credentials redirects to home', async ({ page }) => {
    const email = `e2e-login-${Date.now()}@example.com`
    await page.goto('/register')
    await expect(
      page.getByRole('heading', { name: /sign up/i }).or(page.getByPlaceholder('you@example.com')),
    ).toBeVisible({ timeout: 10_000 })
    await page.getByPlaceholder('you@example.com').fill(email)
    await page.getByPlaceholder(/at least 8 characters/i).fill('e2e-password-123')
    await page.getByRole('button', { name: /sign up/i }).click()
    await expect(page).toHaveURL(/\/(?!register|login)/, { timeout: 8_000 })

    await page.goto('/login')
    await page.getByPlaceholder('you@example.com').fill(email)
    await page.getByPlaceholder('••••••••').fill('e2e-password-123')
    await page.getByRole('button', { name: /log in/i }).click()
    await expect(page).toHaveURL(/\/(?!login)/, { timeout: 8_000 })
    await page.goto('/decks/new')
    await expect(page).toHaveURL(/\/decks\/new/, { timeout: 5_000 })
  })

  test('visiting /decks/new when not logged in redirects to login', async ({ page }) => {
    await page.goto('/decks/new')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
    await expect(page.getByRole('heading', { name: /log in/i })).toBeVisible()
  })

  test('logout clears session', async ({ page }) => {
    const email = `e2e-logout-${Date.now()}@example.com`
    await page.goto('/register')
    await expect(
      page.getByRole('heading', { name: /sign up/i }).or(page.getByPlaceholder('you@example.com')),
    ).toBeVisible({ timeout: 10_000 })
    await page.getByPlaceholder('you@example.com').fill(email)
    await page.getByPlaceholder(/at least 8 characters/i).fill('e2e-password-123')
    await page.getByRole('button', { name: /sign up/i }).click()
    await expect(page).toHaveURL(/\/(?!register|login)/, { timeout: 8_000 })
    await page.goto('/decks/new')
    await expect(page).toHaveURL(/\/decks\/new/, { timeout: 5_000 })
    await page.getByRole('button', { name: /log out/i }).click({ timeout: 10_000 })
    await expect(page).toHaveURL(/\//)
    await page.goto('/decks/new')
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 })
  })
})
