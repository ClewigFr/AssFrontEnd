import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Backend base URL, read at build/dev time: BACKEND_URL=https://api.example.com npm run build
// Required for a production build, so a dashboard never calls someone else's API by mistake.
const isBuild = process.argv.includes('build')
const backendUrl = process.env.BACKEND_URL || (isBuild ? null : 'http://localhost:8099')
if (!backendUrl) throw new Error('Set BACKEND_URL for a production build, e.g. BACKEND_URL=https://api.example.com npm run build')

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  define: {
    __BACKEND_URL__: JSON.stringify(backendUrl)
  },
  build: {
    // ApexCharts alone is ~950 kB; it's lazy-loaded with the stats page
    chunkSizeWarningLimit: 1000
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
