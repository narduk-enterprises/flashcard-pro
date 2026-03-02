import { test, expect } from '@playwright/test'

test.describe('API', () => {
  test('GET /api/decks returns 200 and array', async ({ request }) => {
    const response = await request.get('/api/decks')
    expect(response.ok(), `Expected 2xx, got ${response.status()} ${await response.text()}`).toBeTruthy()
    const body = await response.json()
    expect(Array.isArray(body)).toBeTruthy()
  })

  test('GET /api/decks?q= returns 200 and array', async ({ request }) => {
    const response = await request.get('/api/decks?q=test')
    expect(response.ok()).toBeTruthy()
    const body = await response.json()
    expect(Array.isArray(body)).toBeTruthy()
  })

  test('POST /api/decks without auth returns 401', async ({ request }) => {
    const response = await request.post('/api/decks', {
      data: { name: 'E2E Unauthed', description: '' },
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    })
    expect(response.status()).toBe(401)
  })
})
