import { reactive } from 'vue'

/**
 * The legal pages (legal notice, privacy policy, terms) belong to each instance, not to the code:
 * they name the operator. They are plain files served next to the dashboard, in public/legal/
 * (copy legal.example/ and fill it in, or mount a folder at /usr/share/nginx/html/legal):
 *   legal/pages.json   the pages this instance publishes, e.g. ["legal", "privacy", "terms"]
 *   legal/<page>.html  each page's content (HTML fragment)
 * Without pages.json, the pages and every link to them are hidden.
 */
export const LEGAL_PAGES = ['legal', 'privacy', 'terms']

const base = () => import.meta.env.BASE_URL + 'legal/'

/** Published pages, filled in once by loadLegalPages(); read it in templates. */
export const legal = reactive({ pages: [] })

let loading = null

/** Loads pages.json once. A missing or malformed file (an SPA fallback page, say) means no pages. */
export function loadLegalPages (fetchFn = fetch) {
  if (!loading) {
    loading = fetchFn(base() + 'pages.json', { cache: 'no-cache' })
      .then(response => response.ok ? response.json() : [])
      .catch(() => [])
      .then(pages => {
        legal.pages = Array.isArray(pages) ? LEGAL_PAGES.filter(page => pages.includes(page)) : []
        return legal.pages
      })
  }
  return loading
}

/** Tests only. */
export function resetLegalPages () {
  loading = null
  legal.pages = []
}

const escape = text => String(text).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`)

/**
 * The content of one page, with {{retention}} and {{limits}} replaced by the figures of this
 * instance. Null when the page isn't published or can't be loaded.
 */
export async function loadLegalPage (page, values = {}, fetchFn = fetch) {
  if (!(await loadLegalPages(fetchFn)).includes(page)) return null
  try {
    const response = await fetchFn(base() + page + '.html', { cache: 'no-cache' })
    if (!response.ok) return null
    const html = await response.text()
    return html.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => key in values ? escape(values[key]) : match)
  } catch {
    return null
  }
}
