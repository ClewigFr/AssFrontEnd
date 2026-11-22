# Asynchronous Simple Stats front end

The dashboard for Anonymous Simple Stats: Vue 3, built with Vite and charted with ApexCharts.

## Running in dev

Requirements: **Node.js 22.12 or newer** (tested with Node 26 LTS).

1. Start the backend (AssBackend) on port 8099 and add test data. See "Running in dev" in its README:
   ```bash
   ./gradlew run --args='-port=8099'
   ```
   ```bash
   scripts/seed-dev.sh
   ```
2. Install the dependencies (first time only). This also runs a production build at the end (`postinstall`):
   ```bash
   npm install
   ```
3. Start the dashboard with hot reload:
   ```bash
   npm run dev
   ```
4. Open http://localhost:8080 and log in with the account created by `seed-dev.sh`. Its login and password are at the top of that script.

Things to know:
- Restarting the backend wipes its data (in-memory database) and logs you out. Run `seed-dev.sh` again, then log in again.
- To use a backend at a different address: `BACKEND_URL=http://localhost:9000 npm run dev`.
- To use another port for the dashboard: `PORT=8081 npm run dev`. The backend only accepts requests from `http://localhost:8080` by default, so add the new origin to the backend's `CORS_ORIGINS`.

## Backend URL

The dashboard calls the AssBackend API. Its base URL is fixed when the app is built or the dev server starts:

- **Dev** (`npm run dev`): `http://localhost:8099` by default.
- **Prod** (`npm run build`): set `BACKEND_URL=https://your-api.example.com`. If it's not set, the old Heroku host is used.

The backend must list this dashboard's origin in its `CORS_ORIGINS` setting, or the browser blocks every request.

## Commands

```bash
npm run dev          # dev server with hot reload at localhost:8080
npm run build        # production build into dist/
npm run preview      # preview the production build locally
npm start            # serve dist/ with Express (PORT, default 5000), used in production
npm test             # unit tests (Vitest)
npm run lint         # ESLint
```

## Project layout

- `src/api.js`: a small `fetch` wrapper for the backend. It always sends the session cookie.
- `src/stats.js`: the statistics calculations, kept free of DOM code so they can be unit tested (`test/stats.test.js`).
- `src/components/Stats.vue`: the charts. This page is loaded on demand, so ApexCharts isn't downloaded on the login page.
- `vite.config.js`: the build and dev server settings, and where `BACKEND_URL` is read.
