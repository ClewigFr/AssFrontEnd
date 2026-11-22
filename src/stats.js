// Pure statistics helpers used by Stats.vue (kept DOM-free so they can be unit tested).

// Events with a smaller timestamp are considered corrupt and left out of the day chart
export const MIN_VALID_TIMESTAMP = 100000

// Group events per calendar day (year included), sorted chronologically
export function groupByDay (stats) {
  const days = new Map()
  stats.forEach(item => {
    if (item.timestamp > MIN_VALID_TIMESTAMP) {
      const date = new Date(item.timestamp)
      const key = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()
      let day = days.get(key)
      if (!day) {
        day = {
          key: key,
          formattedDate: date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear(),
          sessions: new Set(),
          total: 0
        }
        days.set(key, day)
      }
      day.total++
      day.sessions.add(item.sessionId)
    }
  })
  return Array.from(days.values()).sort((a, b) => a.key - b.key)
}

// Number of events per session id
export function countBySession (stats) {
  const counts = new Map()
  stats.forEach(item => counts.set(item.sessionId, (counts.get(item.sessionId) || 0) + 1))
  return counts
}

// Average pages viewed per session (0 when there is no data)
export function averagePagesPerSession (stats) {
  const sessions = countBySession(stats).size
  return sessions === 0 ? 0 : stats.length / sessions
}

// Views per page, for the pages whose name contains filter
export function hitsPerPage (stats, pages, filter) {
  const hits = new Map()
  stats.forEach(item => hits.set(item.page, (hits.get(item.page) || 0) + 1))
  const shown = filter ? pages.filter(page => page.name.includes(filter)) : pages
  return {
    labels: shown.map(page => page.name),
    counts: shown.map(page => hits.get(page.id) || 0)
  }
}
