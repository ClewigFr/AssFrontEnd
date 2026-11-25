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
  plugins: [vue(), precompress()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  define: {
    __BACKEND_URL__: JSON.stringify(backendUrl)
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
