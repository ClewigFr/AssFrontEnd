import { beforeEach, describe, expect, it } from 'vitest'
import { legal, loadLegalPage, loadLegalPages, resetLegalPages } from '@/legal'

function fakeFetch (files) {
  return async url => {
    const name = url.split('/legal/')[1]
    if (!(name in files)) return { ok: false, status: 404 }
    const body = files[name]
    return { ok: true, text: async () => body, json: async () => JSON.parse(body) }
  }
}

beforeEach(() => resetLegalPages())

describe('loadLegalPages', () => {
  it('keeps the known pages listed in pages.json', async () => {
    await loadLegalPages(fakeFetch({ 'pages.json': '["terms", "legal", "other"]' }))
    expect(legal.pages).toEqual(['legal', 'terms'])
  })

  it('publishes nothing without pages.json', async () => {
    expect(await loadLegalPages(fakeFetch({}))).toEqual([])
  })

  it('publishes nothing when the server answers the SPA page instead', async () => {
    expect(await loadLegalPages(fakeFetch({ 'pages.json': '<!doctype html><div id="app"></div>' }))).toEqual([])
  })
})

describe('loadLegalPage', () => {
  it('fills in the figures, escaped', async () => {
    const fetchFn = fakeFetch({ 'pages.json': '["privacy"]', 'privacy.html': '<p>Gardé {{retention}}, {{ limits }}, {{other}}</p>' })
    expect(await loadLegalPage('privacy', { retention: '90 jours', limits: '<b>' }, fetchFn))
      .toBe('<p>Gardé 90 jours, &#60;b&#62;, {{other}}</p>')
  })

  it("doesn't load a page that isn't published", async () => {
    const fetchFn = fakeFetch({ 'pages.json': '["legal"]', 'terms.html': '<p>x</p>' })
    expect(await loadLegalPage('terms', {}, fetchFn)).toBeNull()
  })
})
