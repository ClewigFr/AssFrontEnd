import { expect, test } from '@playwright/test'
import { createApp, login, newAccount, PASSWORD, sendViews } from './support.js'

test('refuses a wrong password, then logs in and out', async ({ page }) => {
  const email = await newAccount(page)
  await login(page, email, 'not-the-password')
  await expect(page.getByRole('alert')).toContainText('Identifiant ou mot de passe incorrect')

  await login(page, email)
  await expect(page.getByRole('heading', { name: 'Mes applications' })).toBeVisible()
  await expect(page.getByText('Aucune application pour l\'instant')).toBeVisible()

  await page.getByRole('link', { name: 'Se déconnecter' }).click()
  await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible()
  // The session is really over: the apps page sends back to login
  await page.goto('/#/apps')
  await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible()
})

test('creates an application and its pages, imports and exports the CSV', async ({ page }) => {
  await login(page, await newAccount(page))
  const app = await createApp(page, 'Boutique')

  // A new application opens on its configuration
  await expect(page.getByRole('tab', { name: 'Configuration' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText(app).first()).toBeVisible()

  await page.getByPlaceholder('Nom de la nouvelle page').fill('Accueil')
  await page.getByRole('button', { name: 'Ajouter' }).click()
  await expect(page.getByRole('cell', { name: 'Accueil' })).toBeVisible()

  await page.locator('input[type=file]').setInputFiles({
    name: 'ass-pages.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('name,source\nAccueil,ui/Home.kt\nPanier,ui/Cart.kt\n"Paiement, étape 1",ui/Pay.kt\n')
  })
  await expect(page.getByText('2 pages créées, 1 existait déjà.')).toBeVisible()
  await expect(page.getByText('3 / 5 pages')).toBeVisible()

  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exporter en CSV' }).click()
  const csv = (await (await (await download).createReadStream()).toArray()).join('')
  const lines = csv.replace(/^\uFEFF/, '').trim().split(/\r?\n/)
  expect(lines[0]).toBe('name,id,app_id')
  expect(lines).toHaveLength(4)
  expect(csv).toContain('"Paiement, étape 1"')
  expect(lines.slice(1).every(line => line.endsWith(',' + app))).toBe(true)

  // Deleting a page
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('row', { name: /Panier/ }).getByRole('button', { name: 'Supprimer' }).click()
  await expect(page.getByRole('cell', { name: 'Panier' })).toHaveCount(0)
  await expect(page.getByText('2 / 5 pages')).toBeVisible()
})

test('shows the stats of the views received', async ({ page }) => {
  await login(page, await newAccount(page))
  const app = await createApp(page, 'Stats')
  await page.getByPlaceholder('Nom de la nouvelle page').fill('Accueil')
  await page.getByRole('button', { name: 'Ajouter' }).click()
  const pageId = (await page.getByRole('row', { name: /Accueil/ }).locator('code').textContent()).trim()

  await sendViews(page, app, pageId, 2)
  // Views are written within a fraction of a second; stats may be cached for 5 s
  await expect(async () => {
    await page.reload()
    await page.getByRole('tab', { name: 'Statistiques' }).click()
    // Every page is listed: wait for its views column
    await expect(page.getByRole('row', { name: /Accueil/ }).getByRole('cell').nth(1)).toHaveText('2', { timeout: 1000 })
  }).toPass({ timeout: 20_000 })
})

test('enforces the quotas and alerts on the monthly views', async ({ page }) => {
  await login(page, await newAccount(page))
  const app = await createApp(page, 'Première')
  await page.getByPlaceholder('Nom de la nouvelle page').fill('Accueil')
  await page.getByRole('button', { name: 'Ajouter' }).click()
  const pageId = (await page.getByRole('row', { name: /Accueil/ }).locator('code').textContent()).trim()

  // Too many pages in a CSV: refused before anything is created
  await page.locator('input[type=file]').setInputFiles({
    name: 'big.csv', mimeType: 'text/csv', buffer: Buffer.from('a\nb\nc\nd\ne\nf\n')
  })
  await expect(page.getByText(/Ce fichier ajouterait 6 pages/)).toBeVisible()

  await page.getByRole('link', { name: 'Applications', exact: true }).click()
  await createApp(page, 'Deuxième')
  await page.getByRole('link', { name: 'Applications', exact: true }).click()
  await expect(page.getByText('2 / 2 applications')).toBeVisible()
  await page.getByPlaceholder('Nom de la nouvelle application').fill('Troisième')
  await expect(page.getByRole('button', { name: 'Créer' })).toBeDisabled()

  // Over the monthly views: the views are kept, an alert shows on every page
  await sendViews(page, app, pageId, 4)
  await expect(async () => {
    await page.reload()
    await expect(page.getByRole('alert').filter({ hasText: 'Quota dépassé' })).toBeVisible({ timeout: 1000 })
  }).toPass({ timeout: 20_000 })
  await page.getByRole('link', { name: 'Mon compte' }).click()
  await expect(page.getByText('4 / 3')).toBeVisible()
})

test('changes the password and deletes the account', async ({ page, browser }) => {
  const email = await newAccount(page)
  await login(page, email)
  await expect(page.getByRole('heading', { name: 'Mes applications' })).toBeVisible()

  // A second device, logged in too
  const other = await browser.newPage()
  await login(other, email)
  await expect(other.getByRole('heading', { name: 'Mes applications' })).toBeVisible()

  await page.getByRole('link', { name: 'Mon compte' }).click()
  await page.getByPlaceholder('Mot de passe actuel').fill('wrong-password')
  await page.getByPlaceholder('Nouveau mot de passe (8 caractères minimum)').fill('new-secret-2')
  await page.getByPlaceholder('Nouveau mot de passe, encore').fill('new-secret-2')
  await page.getByRole('button', { name: 'Changer le mot de passe' }).click()
  await expect(page.getByText('Mot de passe actuel incorrect.')).toBeVisible()

  await page.getByPlaceholder('Mot de passe actuel').fill(PASSWORD)
  await page.getByRole('button', { name: 'Changer le mot de passe' }).click()
  await expect(page.getByText('Mot de passe changé.')).toBeVisible()

  // This device stays logged in, the other one is signed out
  await page.getByRole('link', { name: 'Applications', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Mes applications' })).toBeVisible()
  await other.reload()
  await expect(other.getByRole('heading', { name: 'Connexion' })).toBeVisible()
  await login(other, email, 'new-secret-2')
  await expect(other.getByRole('heading', { name: 'Mes applications' })).toBeVisible()
  await other.close()

  await page.getByRole('link', { name: 'Mon compte' }).click()
  await page.getByPlaceholder('Mot de passe', { exact: true }).fill('new-secret-2')
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: 'Supprimer mon compte' }).click()
  await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible()
  await login(page, email, 'new-secret-2')
  await expect(page.getByRole('alert')).toContainText('Identifiant ou mot de passe incorrect')
})

test('deletes the views of a period', async ({ page }) => {
  await login(page, await newAccount(page))
  const app = await createApp(page, 'Nettoyage')
  await page.getByPlaceholder('Nom de la nouvelle page').fill('Accueil')
  await page.getByRole('button', { name: 'Ajouter' }).click()
  const pageId = (await page.getByRole('row', { name: /Accueil/ }).locator('code').textContent()).trim()
  await sendViews(page, app, pageId, 3)

  // The default period is the last hour: it holds the views just sent (written within a second)
  page.on('dialog', dialog => dialog.accept())
  await expect(async () => {
    await page.getByRole('button', { name: 'Supprimer les vues de cette période' }).click()
    await expect(page.getByText('3 vues supprimées.')).toBeVisible({ timeout: 1000 })
  }).toPass({ timeout: 10_000 })
})
