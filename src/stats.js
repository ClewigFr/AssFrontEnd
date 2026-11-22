// Turns the backend's aggregated stats ({ events, sessions, pages, days }) into chart data.
// Kept DOM-free so it can be unit tested.

export const DAY_MS = 24 * 60 * 60 * 1000

// Minutes east of UTC for the browser (what the backend's ?tz= expects)
export function timeZoneOffsetMinutes (date = new Date()) {
  return -date.getTimezoneOffset()
}

// "d/m/yyyy" for a day number (days since 1970-01-01, already shifted to the local time zone by the backend)
export function formatDay (day) {
  const date = new Date(day * DAY_MS)
  return date.getUTCDate() + '/' + (date.getUTCMonth() + 1) + '/' + date.getUTCFullYear()
}

// Per-day series for the sessions chart, in chronological order
export function daySeries (days) {
  const sorted = [...(days || [])].sort((a, b) => a.day - b.day)
  return {
    categories: sorted.map(d => formatDay(d.day)),
    sessions: sorted.map(d => d.sessions),
    events: sorted.map(d => d.events)
  }
}

// Average pages viewed per session (0 when there is no data)
export function averagePagesPerSession (events, sessions) {
  return sessions > 0 ? events / sessions : 0
}

// Views per page, for the pages whose name contains filter
export function pageSlices (pages, filter) {
  const shown = filter ? (pages || []).filter(page => page.name.includes(filter)) : (pages || [])
  return {
    labels: shown.map(page => page.name),
    counts: shown.map(page => page.views)
  }
}
