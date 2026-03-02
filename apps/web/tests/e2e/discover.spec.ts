import { test, expect } from '@playwright/test'

test.describe('Discover', () => {
  test('discover page loads and shows search', async ({ page }) => {
    await page.goto('/discover')
    await expect(page.getByRole('heading', { name: /discover decks/i })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByPlaceholder(/search decks/i)).toBeVisible({ timeout: 10_000 })
  })

  test('discover link in nav goes to discover page', async ({ page }) => {
    await page.goto('/')
    const discoverControl = page
      .getByRole('link', { name: /discover/i })
      .or(page.getByRole('button', { name: /discover/i }))
      .first()
    await expect(discoverControl).toBeVisible({ timeout: 10_000 })
    await discoverControl.click()
    await expect(page).toHaveURL(/\/discover/)
  })

  test('search input filters or shows empty state', async ({ page }) => {
    await page.goto('/discover')
    const input = page.getByPlaceholder(/search decks/i)
    await input.waitFor({ state: 'visible', timeout: 10_000 })
    await input.fill('nonexistent-deck-xyz-12345')
    await expect(
      page.getByText(/no decks match your search|no decks yet/i),
    ).toBeVisible({ timeout: 10_000 })
  })
})
