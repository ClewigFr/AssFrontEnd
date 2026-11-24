import { defineConfig, devices } from '@playwright/test'

// End-to-end tests: the built dashboard against a real backend (docker image, in-memory H2 database).
// npm run e2e starts both; set E2E_BACKEND_URL to use a backend that is already running instead.
const DASHBOARD_PORT = 4173
const BACKEND_PORT = 8102
const BACKEND_IMAGE = process.env.E2E_BACKEND_IMAGE || 'ghcr.io/clewigfr/assbackend:latest'
export const BACKEND_URL = process.env.E2E_BACKEND_URL || `http://localhost:${BACKEND_PORT}`
const DASHBOARD_URL = `http://localhost:${DASHBOARD_PORT}`

// Small quotas, so the tests reach them quickly
const backendEnv = {
  KTOR_ENV: 'dev',
  REGISTRATION_OPEN: 'true',
  CORS_ORIGINS: DASHBOARD_URL,
  AUTH_RATE_LIMIT: '0',
  // The tests register through the API: no form token, no email to open
  EMAIL_VERIFICATION: 'false',
  SIGNUP_MIN_SECONDS: '0',
  MAX_APPS: '2',
  MAX_PAGES_PER_APP: '5',
  MAX_MONTHLY_VIEWS: '3'
}
// Playwright stops the docker CLI, not the container: remove it before starting and in the teardown
const backend = {
  command: 'docker rm -f ass-e2e-backend > /dev/null 2>&1; ' +
    `docker run --rm --name ass-e2e-backend -p 127.0.0.1:${BACKEND_PORT}:8080 ` +
    Object.entries(backendEnv).map(([k, v]) => `-e ${k}=${v}`).join(' ') + ` ${BACKEND_IMAGE}`,
  url: `${BACKEND_URL}/health`,
  timeout: 120_000,
  reuseExistingServer: !process.env.CI
}

export default defineConfig({
  testDir: 'e2e',
  globalTeardown: process.env.E2E_BACKEND_URL ? undefined : './e2e/teardown.js',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: DASHBOARD_URL,
    trace: 'retain-on-failure'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    ...(process.env.E2E_BACKEND_URL ? [] : [backend]),
    {
      command: `vite build && vite preview --port ${DASHBOARD_PORT} --strictPort`,
      env: { BACKEND_URL },
      url: DASHBOARD_URL,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI
    }
  ]
})
