import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Backend base URL, read at build/dev time: BACKEND_URL=https://api.example.com npm run build
const backendUrl = process.env.BACKEND_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://gentle-inlet-02091.herokuapp.com' : 'http://localhost:8099')

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
    environment: 'node'
  }
})
