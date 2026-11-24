# Anonymous Simple Stats front end

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
2. Install the dependencies (first time only):
   ```bash
   npm install
   ```
3. Start the dashboard with hot reload:
   ```bash
   npm run dev
   ```
4. Open http://localhost:8080 and log in with the account created by `seed-dev.sh`. Its login and password are at the top of that script. It also creates a "Demo app" with three pages and some views.

Things to know:
- Restarting the backend wipes its data (in-memory database) and logs you out. Run `seed-dev.sh` again, then log in again.
- To use a backend at a different address: `BACKEND_URL=http://localhost:9000 npm run dev`.
- To use another port for the dashboard: `PORT=8081 npm run dev`. The backend only accepts requests from `http://localhost:8080` by default, so add the new origin to the backend's `CORS_ORIGINS`.

## Backend URL

The dashboard calls the AssBackend API. Its base URL is fixed when the app is built or the dev server starts:

- **Dev** (`npm run dev`): `http://localhost:8099` by default.
- **Prod** (`npm run build`): set `BACKEND_URL=https://your-api.example.com`. If it's not set, `https://ass-api.clewig.fr` is used.

The backend must list this dashboard's origin in its `CORS_ORIGINS` setting, or the browser blocks every request.

## Commands

```bash
npm run dev          # dev server with hot reload at localhost:8080
npm run build        # production build into dist/
npm run preview      # preview the production build locally
npm test             # unit tests (Vitest)
npm run lint         # ESLint
```

## Production

The dashboard is a Docker image (nginx serving `dist/`), built and published to GitHub Packages by the CI on every push to master, for arm64 and amd64. `nginx.conf` sets the cache and security headers, including a Content-Security-Policy that only allows calls to the `BACKEND_URL` the image was built with:

```bash
docker build --build-arg BACKEND_URL=https://ass-api.clewig.fr -t ass-dashboard .
```

## Project layout

- `src/api.js`: a small `fetch` wrapper for the backend. It always sends the session cookie.
- `src/stats.js`: formatting and derived values for the stats (trends, durations, chart series, table rows), kept free of DOM code so they can be unit tested (`test/stats.test.js`).
- `src/components/AppsPage.vue`: "Mes applications". Lists your applications and creates new ones; each shows its UUID, the value to pass to the Android library's `AssConfig(appId = …)`.
- `src/components/AppDetail.vue`: one application, in two tabs (`?tab=stats|config` in the URL). **Statistiques** shows its stats. **Configuration** has its UUID, its pages (add or delete; each page's UUID is what `logScreen` takes; CSV import and export, see below) and the button that deletes it. An application without pages opens on Configuration.
- `src/components/AccountPage.vue`: "Mon compte" (`/#/account`, linked in the top bar). Shows the account's usage against its quotas (applications, pages per application, views this month), changes the password (other devices are signed out) and deletes the account with everything in it, after asking for the password.
- `src/quota.js`: quota helpers (`test/quota.test.js`). Once the month's views reach the limit, `App.vue` shows an alert on every page; the views are still recorded. Creating an application or a page beyond the limits is disabled, and the backend's `403` is explained.
- `src/pagesCsv.js`: CSV parsing and writing for the import and export (`test/pagesCsv.test.js`).
- `src/components/Stats.vue`: the stats of one application. It has a Jour / Semaine / Mois / Année selector with ◀ ▶ to move between periods, cards for views, sessions, pages per session, average duration and bounce rate (each with its change versus the previous period), an activity chart, and a pages table with each page's share of traffic. Loaded on demand, so ApexCharts isn't downloaded on the login page. For periods older than the backend's retention (90 days by default), only views are kept: session figures show `—` or cover only the recent part, and a note explains it (`detailFrom` in the stats response).
- `vite.config.js`: the build and dev server settings, and where `BACKEND_URL` is read.

## Importing and exporting pages (CSV)

In an application's **Configuration** tab:

- **Importer un CSV** creates the pages listed in a file: one page name per line, in the first column. Other columns are ignored, and so is a header row (`name`, `nom`, `page`…). Separators `,`, `;` or tab, quotes and UTF-8 with or without BOM are accepted, so a column exported from Excel or Google Sheets works. Names that already exist aren't created twice, so the same file can be imported again after adding lines. Up to 1000 pages per file, and the application can't go over its pages quota (30 by default): a file that would is refused before anything is created.
- **Exporter en CSV** downloads `name,id,app_id`, one line per page: everything needed to call `logScreen` for each screen. Give it to a developer or an AI assistant along with the library's README to add the tracking calls to an app.
