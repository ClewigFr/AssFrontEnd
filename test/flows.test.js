import { describe, expect, it } from 'vitest'
import { flowRows } from '@/flows'

describe('flowRows', () => {
  const pages = [{ id: 'a', name: 'home' }, { id: 'b', name: 'list' }]
  const flows = {
    sessions: 10,
    transitions: [{ from: 'a', to: 'b', sessions: 8, count: 9, avgMs: 4000 }, { from: 'b', to: 'b', sessions: 4, count: 4, avgMs: 0 }, { from: 'b', to: 'x', sessions: 2, count: 2, avgMs: 1 }],
    entries: [{ page: 'a', sessions: 10 }],
    exits: [{ page: 'b', sessions: 5 }]
  }

  it('names pages, scales bars and computes shares', () => {
    const rows = flowRows(flows, pages)
    expect(rows.transitions.map(t => [t.from, t.to, t.bar, t.loop])).toEqual([['home', 'list', 1, false], ['list', 'list', 0.5, true], ['list', 'Page supprimée', 0.25, false]])
    expect(rows.entries[0]).toMatchObject({ name: 'home', share: 1 })
    expect(rows.exits[0]).toMatchObject({ name: 'list', share: 0.5 })
  })

  it('handles an empty period', () => {
    const rows = flowRows({ sessions: 0, transitions: [], entries: [], exits: [] }, pages)
    expect(rows.transitions).toEqual([])
  })
})
