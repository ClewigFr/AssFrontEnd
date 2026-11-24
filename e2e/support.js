import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'
import { BACKEND_URL } from '../playwright.config.js'

export { BACKEND_URL }
export const PASSWORD = 'e2e-secret-1'

/** A fresh account for each test, so tests don't depend on each other. */
export async function newAccount (page) {
  const email = `e2e-${randomUUID().slice(0, 8)}@ass.test`
  const response = await page.request.post(`${BACKEND_URL}/register`, {
    form: { email, password: PASSWORD, displayName: 'E2E' }
  })
  expect(response.status()).toBe(201)
  // Registering logged the API client in; start the dashboard logged out, through the login page
  await page.context().clearCookies()
  return email
}

export async function login (page, email, password = PASSWORD) {
  await page.goto('/#/login')
  await page.getByPlaceholder('Identifiant').fill(email)
  await page.getByPlaceholder('Mot de passe').fill(password)
  await page.getByRole('button', { name: 'Se connecter' }).click()
}

export async function createApp (page, name) {
  await page.getByPlaceholder('Nom de la nouvelle application').fill(name)
  await page.getByRole('button', { name: 'Créer' }).click()
  await expect(page.getByRole('heading', { name })).toBeVisible()
  return page.url().match(/apps\/([0-9a-f-]{36})/)[1]
}

/** Send page views as the Android library would. */
export async function sendViews (page, app, pageId, count) {
  const sessionId = randomUUID()
  const pageViews = Array.from({ length: count }, () => ({ page: pageId, sessionId, timestamp: 1000 }))
  const response = await page.request.post(`${BACKEND_URL}/views`, { data: { app, pageViews } })
  expect(response.status()).toBe(200)
}
