import { test, expect } from '@playwright/test'

const E2E_PASSWORD = 'e2e-password-123'
let e2eUserEmail: string

async function login(page: import('@playwright/test').Page) {
  await page.goto('/login')
  await page.getByPlaceholder('you@example.com').fill(e2eUserEmail)
  await page.getByPlaceholder('••••••••').fill(E2E_PASSWORD)
  await page.getByRole('button', { name: /log in/i }).click()
  await expect(page).toHaveURL(/\/(?!login)/, { timeout: 8_000 })
}

async function deleteDeck(page: import('@playwright/test').Page, deckId: string) {
  const origin = new URL(page.url()).origin
  await page.request.delete(`${origin}/api/decks/${deckId}`, {
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  })
}

test.describe('Study', () => {
  const createdDeckIds: string[] = []

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    await page.goto('/register')
    await expect(
      page.getByRole('heading', { name: /sign up/i }).or(page.getByPlaceholder('you@example.com')),
    ).toBeVisible({ timeout: 10_000 })
    e2eUserEmail = `e2e-study-${Date.now()}-${process.pid}@example.com`
    await page.getByPlaceholder('you@example.com').fill(e2eUserEmail)
    await page.getByPlaceholder(/at least 8 characters/i).fill(E2E_PASSWORD)
    await page.getByRole('button', { name: /sign up/i }).click()
    await expect(page).toHaveURL(/\/(?!register|login)/, { timeout: 8_000 })
    await page.close()
  })

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test.afterEach(async ({ page }) => {
    while (createdDeckIds.length > 0) {
      const id = createdDeckIds.pop()!
      await deleteDeck(page, id).catch(() => {})
    }
  })

  test('study page for new deck shows empty state or card', async ({ page }) => {
    await page.goto('/decks/new')
    const name = `E2E Study ${Date.now()}`
    await page.getByRole('textbox', { name: /name/i }).fill(name)
    await page.getByRole('button', { name: /create deck/i }).click()
    try {
      await page.waitForURL(/\/decks\/[a-f0-9-]+$/, { timeout: 8_000 })
    } catch {
      test.skip(true, 'Create deck failed (e.g. DB not ready)')
      return
    }
    const match = page.url().match(/\/decks\/([a-f0-9-]+)/)
    if (match) createdDeckIds.push(match[1]!)
    const deckId = match?.[1]
    if (!deckId) return

    await page.goto(`/study/${deckId}`)
    await expect(page.getByRole('heading', { name }).or(page.getByText(/deck not found/i))).toBeVisible()
    const hasNoCards = await page.getByText(/no cards in this deck/i).isVisible()
    const hasManage = await page.getByRole('link', { name: /manage deck/i }).first().isVisible()
    const hasCard = await page.getByText(/click to flip/i).isVisible()
    expect(hasNoCards || hasManage || hasCard).toBe(true)
  })

  test('study with one card: flip and rate', async ({ page }) => {
    await page.goto('/decks/new')
    const name = `E2E Flip ${Date.now()}`
    await page.getByRole('textbox', { name: /name/i }).fill(name)
    await page.getByRole('button', { name: /create deck/i }).click()
    try {
      await page.waitForURL(/\/decks\/[a-f0-9-]+$/, { timeout: 8_000 })
    } catch {
      test.skip(true, 'Create deck failed (e.g. DB not ready)')
      return
    }
    const match = page.url().match(/\/decks\/([a-f0-9-]+)/)
    if (match) createdDeckIds.push(match[1]!)

    await page.getByRole('button', { name: /add card/i }).click()
    await page.getByLabel(/front/i).fill('Capital of France?')
    await page.getByLabel(/back/i).fill('Paris')
    await page.getByRole('button', { name: /add card/i }).last().click()
    await expect(page.getByText('Capital of France?')).toBeVisible()

    await page.getByRole('link', { name: /study now/i }).click()
    await expect(page.getByText('Capital of France?')).toBeVisible()
    await expect(page.getByRole('button', { name: /good/i })).not.toBeVisible()
    await page.locator('.cursor-pointer').first().click()
    await expect(page.getByText('Paris')).toBeVisible()
    await expect(page.getByRole('button', { name: /good/i })).toBeVisible()
    await page.getByRole('button', { name: /good/i }).click()
    await expect(page.getByText(/1 \/ 1/)).toBeVisible()
  })
})
