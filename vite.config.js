import { fileURLToPath, URL } from 'node:url'
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync, constants } from 'node:zlib'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Backend base URL, read at build/dev time: BACKEND_URL=https://api.example.com npm run build
// Required for a production build, so a dashboard never calls someone else's API by mistake.
const isBuild = process.argv.includes('build')
const backendUrl = process.env.BACKEND_URL || (isBuild ? null : 'http://localhost:8099')
if (!backendUrl) throw new Error('Set BACKEND_URL for a production build, e.g. BACKEND_URL=https://api.example.com npm run build')

// Public address of this dashboard, for search engines and link previews (optional):
// SITE_URL=https://ass.example.com. Without it, no absolute URLs, no sitemap.
const siteUrl = (process.env.SITE_URL || '').replace(/\/+$/, '')

// Pages worth indexing; the legal ones only exist on instances that publish them.
const SITEMAP_PATHS = ['/', '/register', '/login', '/legal', '/privacy', '/terms']

// og:url, og:image, twitter:image (they must be absolute) and sitemap.xml, from SITE_URL
function seo() {
  return {
    name: 'seo',
    transformIndexHtml(html) {
      if (!siteUrl) return html
      return html.replace('</head>', `    <meta property="og:url" content="${siteUrl}/">
    <meta property="og:image" content="${siteUrl}/og-image.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:image" content="${siteUrl}/og-image.png">
  </head>`)
    },
    generateBundle() {
      if (!siteUrl) return
      const urls = SITEMAP_PATHS.map(path => `  <url><loc>${siteUrl}${path}</loc></url>`).join('\n')
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
      })
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\nDisallow: /apps\nDisallow: /account\n\nSitemap: ${siteUrl}/sitemap.xml\n`
      })
    }
  }
}

// Writes a .gz next to each text file of the build, at the highest level, once.
// nginx serves it as is (gzip_static), instead of compressing on every request.
function precompress() {
  let outDir
  return {
    name: 'precompress',
    apply: 'build',
    configResolved(config) { outDir = config.build.outDir },
    closeBundle() {
      const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(e =>
        e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])
      for (const file of walk(outDir)) {
        if (!/\.(html|css|js|json|svg|txt|xml)$/.test(file)) continue
        const raw = readFileSync(file)
        if (raw.length < 256) continue
        const gz = gzipSync(raw, { level: constants.Z_BEST_COMPRESSION })
        if (gz.length < raw.length) writeFileSync(file + '.gz', gz)
      }
    }
  }
}

export default defineConfig({
  plugins: [vue(), seo(), precompress()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  define: {
    __BACKEND_URL__: JSON.stringify(backendUrl),
    __SITE_URL__: JSON.stringify(siteUrl)
  },
  server: {
    // 8080 is the origin the backend allows by default (CORS_ORIGINS)
    port: Number(process.env.PORT) || 8080
  },
  test: {
    environment: 'node',
    // Playwright's end-to-end tests run with npm run e2e
    include: ['test/**/*.test.js']
  }
})
