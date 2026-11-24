import { execSync } from 'node:child_process'

// Stops the backend container started by playwright.config.js (kept when it was reused).
export default function teardown () {
  if (process.env.E2E_KEEP_BACKEND) return
  try {
    execSync('docker rm -f ass-e2e-backend', { stdio: 'ignore' })
  } catch {
    // Already gone
  }
}
