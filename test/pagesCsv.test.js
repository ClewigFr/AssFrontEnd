import { describe, expect, it } from 'vitest'
import { csvFileName, pageNamesFromCsv, pagesToCsv, parseCsv } from '../src/pagesCsv.js'

describe('pageNamesFromCsv', () => {
  it('reads one name per line and skips blanks and duplicates', () => {
    expect(pageNamesFromCsv('home\nsettings\n\n home \nprofile\n')).toEqual(['home', 'settings', 'profile'])
  })
  it('skips a header row and keeps only the first column', () => {
    expect(pageNamesFromCsv('name,description\nhome,Accueil\ncart,Panier')).toEqual(['home', 'cart'])
    expect(pageNamesFromCsv('Nom;Écran\r\nAccueil;Home\r\n')).toEqual(['Accueil'])
  })
  it('handles quotes, commas inside quotes, BOM and tabs', () => {
    expect(pageNamesFromCsv('\uFEFF"Panier, étape 1",x\n"Dit ""bonjour""",y')).toEqual(['Panier, étape 1', 'Dit "bonjour"'])
    expect(pageNamesFromCsv('home\tA\ncart\tB')).toEqual(['home', 'cart'])
  })
  it('re-imports its own export', () => {
    const app = { id: 'a1', name: 'App' }
    const csv = pagesToCsv(app, [{ id: 'p1', name: 'home' }, { id: 'p2', name: 'a, "b"' }])
    expect(pageNamesFromCsv(csv)).toEqual(['home', 'a, "b"'])
  })
})

describe('pagesToCsv', () => {
  it('writes name, id and app_id with escaping', () => {
    const csv = pagesToCsv({ id: 'a1', name: 'App' }, [{ id: 'p1', name: 'home' }, { id: 'p2', name: 'a, "b"' }])
    expect(csv).toBe('name,id,app_id\r\nhome,p1,a1\r\n"a, ""b""",p2,a1\r\n')
    expect(parseCsv(csv)[2]).toEqual(['a, "b"', 'p2', 'a1'])
  })
})

describe('csvFileName', () => {
  it('makes a safe file name', () => {
    expect(csvFileName({ name: 'Mon Appli été !' })).toBe('mon-appli-ete-pages.csv')
    expect(csvFileName({ name: '***' })).toBe('application-pages.csv')
  })
})

describe('pagesToCsv formulas', () => {
  it('neutralises names Excel would run as formulas', () => {
    const csv = pagesToCsv({ id: 'a1', name: 'App' }, [{ id: 'p1', name: '=HYPERLINK("x")' }, { id: 'p2', name: '-home' }])
    expect(csv).toContain(`"'=HYPERLINK(""x"")",p1,a1`)
    expect(csv).toContain("'-home,p2,a1")
  })
})
