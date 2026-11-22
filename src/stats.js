// Formatting and derived values for the per-period stats returned by the backend.
// Kept DOM-free so it can be unit tested.

export const PERIODS = [
  { key: 'day', label: 'Jour' },
  { key: 'week', label: 'Semaine' },
  { key: 'month', label: 'Mois' },
  { key: 'year', label: 'Année' }
]

const PREVIOUS_LABEL = {
  day: 'la veille',
  week: 'les 7 jours précédents',
  month: 'les 30 jours précédents',
  year: 'les 12 mois précédents'
}

// Minutes east of UTC for the browser (what the backend's ?tz= expects)
export function timeZoneOffsetMinutes (date = new Date()) {
  return -date.getTimezoneOffset()
}

// Label of a chart slot, from its start instant
export function formatBucket (start, granularity) {
  const date = new Date(start)
  if (granularity === 'hour') return `${date.getHours()}h`
  if (granularity === 'month') return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'numeric' })
}

// Human description of [from, to) for the period selector
export function formatRange (from, to, period) {
  const first = new Date(from)
  const last = new Date(to - 1)
  if (period === 'day') {
    return first.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }
  if (period === 'year') {
    const month = { month: 'short', year: 'numeric' }
    return `${first.toLocaleDateString('fr-FR', month)} – ${last.toLocaleDateString('fr-FR', month)}`
  }
  const day = { day: 'numeric', month: 'short' }
  return `${first.toLocaleDateString('fr-FR', day)} – ${last.toLocaleDateString('fr-FR', { ...day, year: 'numeric' })}`
}

// "42 s", "3 min 20 s", "1 h 05 min"
export function formatDuration (ms) {
  const seconds = Math.round((ms || 0) / 1000)
  if (seconds < 60) return `${seconds} s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return seconds % 60 ? `${minutes} min ${seconds % 60} s` : `${minutes} min`
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`
}

export function formatPercent (ratio) {
  return `${Math.round((ratio || 0) * 100)} %`
}

export function formatNumber (value, decimals = 0) {
  return (value || 0).toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

// Change versus the previous period: { label: "+12 %", trend: "up" | "down" | "flat" } or null without history
export function delta (current, previous) {
  if (!previous) return current ? { label: 'nouveau', trend: 'up' } : null
  const change = (current - previous) / previous
  const pct = Math.round(change * 100)
  if (pct === 0) return { label: '=', trend: 'flat' }
  return { label: `${pct > 0 ? '+' : ''}${pct} %`, trend: pct > 0 ? 'up' : 'down' }
}

// The indicator cards. "better" says whether a rise is good news (it isn't for the bounce rate).
export function kpis (stats) {
  const c = stats.current
  const p = stats.previous
  return [
    { key: 'views', label: 'Pages vues', value: formatNumber(c.views), delta: delta(c.views, p.views), better: 'up' },
    { key: 'sessions', label: 'Sessions', value: formatNumber(c.sessions), delta: delta(c.sessions, p.sessions), better: 'up' },
    { key: 'pps', label: 'Pages / session', value: formatNumber(c.pagesPerSession, 1), delta: delta(c.pagesPerSession, p.pagesPerSession), better: 'up' },
    { key: 'duration', label: 'Durée moyenne', value: formatDuration(c.avgSessionMs), delta: delta(c.avgSessionMs, p.avgSessionMs), better: 'up' },
    { key: 'bounce', label: 'Taux de rebond', value: formatPercent(c.bounceRate), delta: delta(c.bounceRate, p.bounceRate), better: 'down' }
  ].map(k => ({ ...k, previousLabel: PREVIOUS_LABEL[stats.period] }))
}

// Chart series
export function bucketSeries (stats) {
  return {
    categories: stats.buckets.map(b => formatBucket(b.start, stats.granularity)),
    views: stats.buckets.map(b => b.views),
    sessions: stats.buckets.map(b => b.sessions)
  }
}

// Pages table rows: those whose name contains filter, with their share of all views
export function pageRows (pages, filter, totalViews) {
  const shown = filter ? pages.filter(p => p.name.toLowerCase().includes(filter.toLowerCase())) : pages
  return shown.map(p => ({ ...p, share: totalViews ? p.views / totalViews : 0 }))
}
