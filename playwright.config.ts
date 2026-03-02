import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.BASE_URL ?? 'http://localhost:3000'
const isProduction = !!process.env.BASE_URL

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  maxFailures: process.env.CI ? undefined : 1,
  reporter: 'html',
  timeout: 25_000,
  expect: { timeout: 5_000 },
  use: {
    trace: 'on-first-retry',
    actionTimeout: 8_000,
    navigationTimeout: 12_000,
    baseURL,
  },
  ...(isProduction
    ? {}
    : {
        webServer: {
          command: 'pnpm run dev',
          url: 'http://localhost:3000',
          reuseExistingServer: true,
          timeout: 30_000,
        },
      }),
  projects: [
    {
      name: 'web',
      testDir: 'apps/web/tests/e2e',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
