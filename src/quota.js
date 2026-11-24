// Account limits, as returned by GET /account ({ quotas, usage }). A limit of 0 means none.

const formatter = new Intl.NumberFormat('fr-FR')
export const formatCount = (n) => formatter.format(n)

export const isFull = (used, max) => max > 0 && used >= max

/** The alert to show when this month's views reach the limit, or '' (views are still recorded). */
export function viewsAlert (account) {
  if (!account?.usage || !account.quotas) return ''
  const { monthViews } = account.usage
  const max = account.quotas.maxMonthlyViews
  if (!isFull(monthViews, max)) return ''
  return `Quota dépassé : ${formatCount(monthViews)} vues ce mois-ci pour ${formatCount(max)} incluses. ` +
    'Les vues sont toujours enregistrées.'
}

/** "12 / 30", or just "12" without a limit. */
export const usageText = (used, max) => max > 0 ? `${formatCount(used)} / ${formatCount(max)}` : formatCount(used)

/** Share of the limit used, from 0 to 100, for a progress bar. */
export const usagePercent = (used, max) => max > 0 ? Math.min(100, Math.round(used * 100 / max)) : 0

/** Message for a 403 of the backend's quotas, or '' for another error. */
export function quotaError (error) {
  if (error?.status !== 403 || typeof error.body !== 'string' || !error.body.startsWith('quota')) return ''
  const max = error.body.match(/\d+/)?.[0]
  if (error.body.includes('applications')) return `Limite atteinte : ${max} applications au maximum par compte.`
  return `Limite atteinte : ${max} pages au maximum par application.`
}
