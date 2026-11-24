import { expect, test } from '@playwright/test'
import { login, newAccount } from './support.js'

test('presents the service to visitors and leads to sign-up', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /anonymes par conception/ })).toBeVisible()
  await expect(page.getByText('com.github.ClewigFr:AssAndroid:')).toBeVisible()
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
