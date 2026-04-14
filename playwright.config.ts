import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  use: {
    baseURL: 'https://learniapp.co',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  reporter: [['list'], ['json', { outputFile: '/root/.openclaw/workspace/data/playwright-results.json' }]],
})
