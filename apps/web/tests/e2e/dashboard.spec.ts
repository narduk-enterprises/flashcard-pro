import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test('home page loads with title and main actions', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/FlashCardPro/)
    await expect(page.getByRole('heading', { name: /your decks/i })).toBeVisible()
    await expect(
      page.getByRole('link', { name: /discover/i }).or(page.getByRole('button', { name: /discover/i })).first(),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('new deck link navigates to create form or login', async ({ page }) => {
    await page.goto('/')
    const newDeckLink = page.getByRole('link', { name: /new deck/i }).or(page.getByRole('button', { name: /new deck/i })).first()
    if (!(await newDeckLink.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip(true, 'New deck link only visible when logged in')
      return
    }
    await newDeckLink.click()
    await expect(page).toHaveURL(/\/(login|decks\/new)/, { timeout: 8_000 })
    await expect(
      page.getByRole('textbox', { name: /name/i }).or(page.getByRole('heading', { name: /log in/i })),
    ).toBeVisible({ timeout: 5_000 })
  })

  test('decks API succeeds: no "Failed to load decks"', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText(/failed to load decks/i)).not.toBeVisible({ timeout: 8_000 })
    const hasEmptyState = page.getByText(/no decks yet/i).isVisible()
    const hasDeckList = page.getByRole('listitem').first().isVisible()
    expect(await hasEmptyState || await hasDeckList).toBeTruthy()
  })
})
