import { expect, test } from '@playwright/test'
import { createApp, login, newAccount } from './support.js'

test('shares an application with a reader, who sees it with a badge and can leave', async ({ browser }) => {
  const ownerPage = await (await browser.newContext()).newPage()
  const readerPage = await (await browser.newContext()).newPage()
  const owner = await newAccount(ownerPage)
  const reader = await newAccount(readerPage)

  await login(ownerPage, owner)
  await createApp(ownerPage, 'Partagée')
  await ownerPage.getByPlaceholder('Email du compte').fill('nobody-' + reader)
  await ownerPage.getByRole('button', { name: 'Partager' }).click()
  await expect(ownerPage.getByRole('alert')).toContainText('Aucun compte avec cet email')

  await ownerPage.getByPlaceholder('Email du compte').fill(reader)
  await ownerPage.getByRole('button', { name: 'Partager' }).click()
  await expect(ownerPage.locator('.members')).toContainText(reader)

  await login(readerPage, reader)
  await expect(readerPage.getByText('Partagée · Lecture')).toBeVisible()
  await readerPage.getByRole('link', { name: 'Partagée', exact: true }).click()
  await readerPage.getByRole('tab', { name: 'Configuration' }).click()
  await expect(readerPage.getByText(`${owner} partage cette application avec vous`)).toBeVisible()
  await expect(readerPage.getByPlaceholder('Nom de la nouvelle page')).toHaveCount(0)
  await expect(readerPage.getByRole('button', { name: 'Supprimer l\'application' })).toHaveCount(0)

  readerPage.once('dialog', dialog => dialog.accept())
  await readerPage.getByRole('button', { name: 'Quitter cette application' }).click()
  await expect(readerPage.getByText('Aucune application pour l\'instant')).toBeVisible()
  await ownerPage.reload()
  await expect(ownerPage.getByText('Cette application n\'est partagée avec personne.')).toBeVisible()
})
