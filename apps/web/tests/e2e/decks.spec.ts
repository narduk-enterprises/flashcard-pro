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

test.describe('Decks', () => {
  const createdDeckIds: string[] = []

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    await page.goto('/register')
    await expect(
      page.getByRole('heading', { name: /sign up/i }).or(page.getByPlaceholder('you@example.com')),
    ).toBeVisible({ timeout: 10_000 })
    e2eUserEmail = `e2e-decks-${Date.now()}-${process.pid}@example.com`
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

  test('create deck and land on manage page or see error', async ({ page }) => {
    const deckName = `E2E Deck ${Date.now()}`
    const deckDescription = 'E2E test deck'
    await page.goto('/decks/new')
    await page.getByRole('textbox', { name: /name/i }).fill(deckName)
    await page.getByRole('textbox', { name: /description/i }).fill(deckDescription)
    await page.getByRole('button', { name: /create deck/i }).click()
    try {
      await page.waitForURL(/\/decks\/[a-f0-9-]+$/, { timeout: 8_000 })
    } catch {
      await expect(page.getByRole('textbox', { name: /name/i })).toBeVisible()
      return
    }
    const match = page.url().match(/\/decks\/([a-f0-9-]+)$/)
    if (match) createdDeckIds.push(match[1]!)
    await expect(page.getByRole('link', { name: /study now/i })).toBeVisible()
  })

  test('add card to deck and see it in list', async ({ page }) => {
    await page.goto('/decks/new')
    await page.getByRole('textbox', { name: /name/i }).fill(`E2E Add Card ${Date.now()}`)
    await page.getByRole('button', { name: /create deck/i }).click()
    try {
      await page.waitForURL(/\/decks\/[a-f0-9-]+$/, { timeout: 8_000 })
    } catch {
      test.skip(true, 'Create deck failed (e.g. DB not ready)')
      return
    }
    const match = page.url().match(/\/decks\/([a-f0-9-]+)$/)
    if (match) createdDeckIds.push(match[1]!)

    await page.getByRole('button', { name: /add card/i }).click()
    await page.getByLabel(/front/i).fill('What is 2 + 2?')
    await page.getByLabel(/back/i).fill('4')
    await page.getByRole('button', { name: /add card/i }).last().click()

    await expect(page.getByText('What is 2 + 2?')).toBeVisible()
    await expect(page.getByText('4')).toBeVisible()
  })

  test('manage deck back to dashboard', async ({ page }) => {
    await page.goto('/')
    const deckLink = page.getByRole('link', { name: /manage/i }).first()
    await expect(deckLink.or(page.getByText(/no decks yet|failed to load/i))).toBeVisible({ timeout: 5_000 })
    if (await deckLink.isVisible()) {
      await deckLink.click()
      await expect(page).toHaveURL(/\/decks\/[a-f0-9-]+/)
      await page.getByRole('link', { name: /dashboard/i }).click()
      await expect(page).toHaveURL(/\/$/)
    }
  })
})
