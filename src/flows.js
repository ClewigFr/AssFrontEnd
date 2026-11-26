// Rows of the "Parcours" tab, from GET /apps/{id}/flows and the application's pages
export function flowRows (flows, pages) {
  const name = id => pages.find(p => p.id === id)?.name || 'Page supprimée'
  const share = n => (flows.sessions ? n / flows.sessions : 0)
  const max = Math.max(1, ...flows.transitions.map(t => t.sessions))
  return {
    transitions: flows.transitions.map(t => ({
      key: `${t.from}>${t.to}`,
      from: name(t.from),
      to: name(t.to),
      sessions: t.sessions,
      count: t.count,
      avgMs: t.avgMs,
      bar: t.sessions / max,
      loop: t.from === t.to
    })),
    entries: flows.entries.map(e => ({ key: e.page, name: name(e.page), sessions: e.sessions, share: share(e.sessions) })),
    exits: flows.exits.map(e => ({ key: e.page, name: name(e.page), sessions: e.sessions, share: share(e.sessions) }))
  }
}
