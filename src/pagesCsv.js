// CSV import/export of an application's pages. Kept free of DOM code so it can be unit tested.

const HEADERS = ['name', 'nom', 'page', 'pages', 'page name', 'nom de la page']

/** Splits CSV text into rows of cells: quotes, "" escapes, and , ; or tab separators. */
export function parseCsv (text) {
  const clean = text.replace(/^\uFEFF/, '')
  const firstLine = clean.split(/\r?\n/, 1)[0]
  const separator = [';', '\t', ','].find(s => firstLine.includes(s)) || ','
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i]
    if (quoted) {
      if (c === '"' && clean[i + 1] === '"') { cell += '"'; i++ } else if (c === '"') quoted = false
      else cell += c
    } else if (c === '"' && cell === '') quoted = true
    else if (c === separator) { row.push(cell); cell = '' } else if (c === '\n' || c === '\r') {
      if (c === '\r' && clean[i + 1] === '\n') i++
      row.push(cell); rows.push(row); row = []; cell = ''
    } else cell += c
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row) }
  return rows
}

/** Page names from the first column, trimmed, without blanks, duplicates or a header row. */
export function pageNamesFromCsv (text) {
  const names = parseCsv(text).map(row => (row[0] || '').trim()).filter(Boolean)
  if (names.length && HEADERS.includes(names[0].toLowerCase())) names.shift()
  return [...new Set(names)]
}

function cell (value) {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/** name,id,app_id rows: everything needed to call logScreen for each page. */
export function pagesToCsv (app, pages) {
  const lines = [['name', 'id', 'app_id'], ...pages.map(p => [p.name, p.id, app.id])]
  return lines.map(line => line.map(cell).join(',')).join('\r\n') + '\r\n'
}

/** A safe file name for the export, e.g. "mon-app-pages.csv". */
export function csvFileName (app) {
  const base = app.name.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `${base || 'application'}-pages.csv`
}
