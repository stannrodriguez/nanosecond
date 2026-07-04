import { defineConfig } from '@playwright/test'

// The remote build environment pre-installs browsers here; harmless locally
// if you've run `playwright install` (it falls back to the default path).
process.env.PLAYWRIGHT_BROWSERS_PATH ??= '/opt/pw-browsers'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5173',
    viewport: { width: 1024, height: 800 },
  },
  webServer: {
    command: 'pnpm dev --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
