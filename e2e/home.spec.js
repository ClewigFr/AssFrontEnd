import { expect, test } from '@playwright/test'
import { login, newAccount } from './support.js'

test('presents the service to visitors and leads to sign-up', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /anonymes par conception/ })).toBeVisible()
  await expect(page.getByText('com.github.ClewigFr.AssAndroid:assLib:')).toBeVisible()
  // The limits come from the backend's settings (playwright.config.js: 2 applications, 5 pages, 3 views)
  await expect(page.locator('.limit-grid')).toContainText('2 applications')
  await expect(page.locator('.limit-grid')).toContainText('5 pages par application')
  await page.getByRole('link', { name: 'Commencer gratuitement' }).click()
  await expect(page.getByRole('heading', { name: 'Créer un compte' })).toBeVisible()
})

test('offers the dashboard once logged in', async ({ page }) => {
  await login(page, await newAccount(page))
  await expect(page.getByRole('heading', { name: 'Mes applications' })).toBeVisible()
  await page.goto('/')
  await page.getByRole('link', { name: 'Ouvrir le dashboard' }).first().click()
  await expect(page.getByRole('heading', { name: 'Mes applications' })).toBeVisible()
})

test('shows the legal pages of the instance with one set of links', async ({ page }) => {
  // The instance's own texts (public/legal/) are not in git: serve two pages here
  await page.route('**/legal/pages.json', route => route.fulfill({ json: ['legal', 'privacy'] }))
  await page.route('**/legal/privacy.html', route => route.fulfill({
    contentType: 'text/html', body: '<h1>Politique de confidentialité</h1><p>Conservé {{retention}}.</p>'
  }))
  await page.goto('/#/privacy')
  await expect(page.getByRole('heading', { name: 'Politique de confidentialité' })).toBeVisible()
  await expect(page.getByText(/Conservé \d+ jours/)).toBeVisible()
  await expect(page.getByRole('link', { name: 'Mentions légales' })).toHaveCount(1)
  await expect(page.getByRole('link', { name: "Conditions d'utilisation" })).toHaveCount(0)
})

test('hides the legal links when the instance publishes none', async ({ page }) => {
  await page.route('**/legal/pages.json', route => route.fulfill({ status: 404 }))
  await page.goto('/#/register')
  await expect(page.getByRole('heading', { name: 'Créer un compte' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Mentions légales' })).toHaveCount(0)
  await expect(page.getByText('En créant un compte')).toHaveCount(0)
})
