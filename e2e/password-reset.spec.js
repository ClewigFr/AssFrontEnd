import { execSync } from 'node:child_process'
import { expect, test } from '@playwright/test'
import { login, newAccount } from './support.js'

// Without SMTP settings, the dev backend logs the emails instead of sending them: read the link there
function resetLink (email) {
  const logs = execSync('docker logs ass-e2e-backend 2>&1', { encoding: 'utf8', maxBuffer: 50e6 })
  const mail = logs.split('Email to ').filter(block => block.startsWith(email)).pop()
  return mail?.match(/(\/#\/reset\?token=[A-Za-z0-9_-]+)/)?.[1]
}

test('resets a forgotten password with the emailed link', async ({ page }) => {
  test.skip(!!process.env.E2E_BACKEND_URL, 'reads the email in the logs of the docker backend')
  const email = await newAccount(page)

  await page.goto('/login')
  await page.getByRole('link', { name: 'Mot de passe oublié ?' }).click()
  await page.getByPlaceholder('Adresse email').fill(email)
  await page.getByRole('button', { name: 'Envoyer le lien' }).click()
  await expect(page.getByText('un mail vient de partir')).toBeVisible()

  let link
  await expect(() => { link = resetLink(email); expect(link).toBeTruthy() }).toPass({ timeout: 10_000 })
  await page.goto(link)
  await page.getByPlaceholder('Nouveau mot de passe (8 caractères minimum)').fill('reset-secret-3')
  await page.getByPlaceholder('Nouveau mot de passe, encore').fill('reset-secret-3')
  await page.getByRole('button', { name: 'Changer le mot de passe' }).click()
  await expect(page.getByText('Mot de passe changé.')).toBeVisible()

  // The link only works once
  await page.goto(link)
  await page.getByPlaceholder('Nouveau mot de passe (8 caractères minimum)').fill('reset-secret-4')
  await page.getByPlaceholder('Nouveau mot de passe, encore').fill('reset-secret-4')
  await page.getByRole('button', { name: 'Changer le mot de passe' }).click()
  await expect(page.getByText('plus valable')).toBeVisible()

  await login(page, email, 'reset-secret-3')
  await expect(page.getByRole('heading', { name: 'Mes applications' })).toBeVisible()
})
