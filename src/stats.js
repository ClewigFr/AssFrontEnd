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

// Change of a ratio, in percentage points: 40 % -> 50 % is "+10 pts", not "+25 %"
export function pointsDelta (current, previous) {
  if (current == null || previous == null) return null
  const pts = Math.round((current - previous) * 100)
  if (pts === 0) return { label: '=', trend: 'flat' }
  return { label: `${pts > 0 ? '+' : ''}${pts} pts`, trend: pts > 0 ? 'up' : 'down' }
}

// The indicator cards. "better" says whether a rise is good news (it isn't for the bounce rate).
// How much of the period still has session details (raw views): 'full', 'partial' or 'none'.
// Older views are only kept as counts per page and per day (stats.detailFrom, set by the backend's retention).
export function detailCoverage (stats, from = stats.from, to = stats.to) {
  if (stats.detailFrom == null || from >= stats.detailFrom) return 'full'
  return to <= stats.detailFrom ? 'none' : 'partial'
}

const DAY_MS = 24 * 60 * 60 * 1000

// A sentence explaining what's missing in this period, or null when everything is there
export function detailNote (stats, now = Date.now()) {
  const coverage = detailCoverage(stats)
  if (coverage === 'full') return null
  // detailFrom is a UTC midnight, so the exact gap is a fraction of a day more than the retention
  const days = Math.floor((now - stats.detailFrom) / DAY_MS)
  const since = new Date(stats.detailFrom).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  if (coverage === 'none') {
    return `Au-delà de ${days} jours, seules les vues par page et par jour sont conservées : pas de sessions, de durée, de taux de rebond ni de détail par heure.`
  }
  return `Sessions, pages par session, durée et rebond ne portent que sur la période depuis le ${since} : au-delà de ${days} jours, seules les vues par page et par jour sont conservées.`
}

const SESSION_KPIS = ['sessions', 'pps', 'duration', 'bounce']

export function kpis (stats) {
  const c = stats.current
  const p = stats.previous
  const coverage = detailCoverage(stats)
  // The previous period has the same length and ends where this one starts
  const previousCoverage = detailCoverage(stats, stats.from - (stats.to - stats.from), stats.from)
  return [
    { key: 'views', label: 'Pages vues', value: formatNumber(c.views), delta: delta(c.views, p.views), better: 'up' },
    { key: 'sessions', label: 'Sessions', value: formatNumber(c.sessions), delta: delta(c.sessions, p.sessions), better: 'up' },
    { key: 'pps', label: 'Pages / session', value: formatNumber(c.pagesPerSession, 1), delta: delta(c.pagesPerSession, p.pagesPerSession), better: 'up' },
    { key: 'duration', label: 'Durée moyenne', value: formatDuration(c.avgSessionMs), delta: delta(c.avgSessionMs, p.avgSessionMs), better: 'up' },
    { key: 'bounce', label: 'Taux de rebond', value: formatPercent(c.bounceRate), delta: pointsDelta(c.bounceRate, p.bounceRate), better: 'down' }
  ].map(k => {
    if (!SESSION_KPIS.includes(k.key)) return k
    // Session figures can't be compared with a period that lost them, and don't exist when it's all gone
    if (coverage === 'none') return { ...k, value: '—', delta: null }
    if (coverage !== 'full' || previousCoverage !== 'full') return { ...k, delta: null }
    return k
  }).map(k => ({ ...k, previousLabel: PREVIOUS_LABEL[stats.period] }))
}

// Chart series
export function bucketSeries (stats) {
  const previous = stats.previousBuckets || []
  return {
    categories: stats.buckets.map(b => formatBucket(b.start, stats.granularity)),
    views: stats.buckets.map(b => b.views),
    sessions: stats.buckets.map(b => b.sessions),
    // Slot by slot; a period one slot longer (daylight saving) leaves the last one empty
    previousViews: stats.buckets.map((b, i) => previous[i]?.views ?? null)
  }
}

/** The chart's slots as CSV rows: start (ISO, UTC), views, sessions, views of the previous period. */
export function slotsCsvRows (stats) {
  const previous = stats.previousBuckets || []
  return [
    ['start', 'views', 'sessions', 'previous_period_views'],
    ...stats.buckets.map((b, i) => [new Date(b.start).toISOString(), b.views, b.sessions, previous[i]?.views ?? ''])
  ]
}

/** The pages table as CSV rows: page, views, sessions (empty when not kept), share of the views. */
export function pagesCsvRows (stats, noSessions = false) {
  return [
    ['page', 'views', 'sessions', 'share'],
    ...pageRows(stats.pages, '', stats.current.views).map(p => [p.name, p.views, noSessions ? '' : p.sessions, p.share.toFixed(4)])
  ]
}

// Pages table rows: those whose name contains filter, with their share of all views
export function pageRows (pages, filter, totalViews) {
  const shown = filter ? pages.filter(p => p.name.toLowerCase().includes(filter.toLowerCase())) : pages
  return shown.map(p => ({ ...p, share: totalViews ? p.views / totalViews : 0 }))
}
