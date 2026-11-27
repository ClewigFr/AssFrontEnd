# Anonymous Simple Stats front end

The dashboard for Anonymous Simple Stats: Vue 3, built with Vite, with no other runtime dependency than vue-router (the chart is plain SVG).

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
- **Prod** (`npm run build`): set `BACKEND_URL=https://your-api.example.com`. It's required: the build fails without it.
- Optionally set `SITE_URL=https://your-dashboard.example.com`, the dashboard's public address: the build then adds absolute link-preview tags (`og:url`, `og:image`), a canonical link per public page, `sitemap.xml` and a `robots.txt` pointing to it.

The backend must list this dashboard's origin in its `CORS_ORIGINS` setting, or the browser blocks every request.

## Commands

```bash
npm run dev          # dev server with hot reload at localhost:8080
npm run build        # production build into dist/
npm run preview      # preview the production build locally
npm test             # unit tests (Vitest)
npm run lint         # ESLint
npm run e2e          # end-to-end tests (Playwright), see below
```

## End-to-end tests

`e2e/` drives the built dashboard in Chromium against a real backend: login and logout, forgotten password (the link is read in the backend's logs, so it needs the Docker backend), applications and pages, CSV import and export, stats of views sent like the Android library does, quotas and the monthly alert, password change (other devices signed out) and account deletion. Each test registers its own account.

`npm run e2e` starts everything itself:
- the backend from its Docker image (`ghcr.io/clewigfr/assbackend:latest`, in-memory database, small quotas) on port 8102, so **Docker must be running**;
- the dashboard, built and served by `vite preview` on port 4173.

The first time, install the browser: `npx playwright install chromium`.

Options:
- `E2E_BACKEND_IMAGE=ghcr.io/clewigfr/assbackend:<commit>` tests against another backend version;
- `E2E_BACKEND_URL=http://localhost:8101` uses a backend already running instead (start it with `REGISTRATION_OPEN=true`, `CORS_ORIGINS=http://localhost:4173`, `MAX_APPS=2`, `MAX_PAGES_PER_APP=5` and `MAX_MONTHLY_VIEWS=3`), for example one built from local changes;
- `npx playwright test --ui` to watch and debug them, `npx playwright show-report` after a failure.

The CI runs them on every push, against the latest backend image. The dashboard image is only published when they pass; on failure, the report and traces are attached to the run (`playwright-report` artifact).

## Production

The dashboard is a Docker image (nginx serving `dist/`), built and published to GitHub Packages by the CI on every push to master, for arm64 and amd64. `nginx.conf` sets the cache and security headers, including a Content-Security-Policy that only allows calls to the `BACKEND_URL` the image was built with:

```bash
docker build --build-arg BACKEND_URL=https://ass-api.example.com --build-arg SITE_URL=https://ass.example.com -t ass-dashboard .
```

The CSP also allows scripts and frames from `https://challenges.cloudflare.com`, for the Cloudflare Turnstile widget of the sign-up page (`src/turnstile.js`). The widget is only loaded when the backend sends a site key (`GET /register/form`, set with `TURNSTILE_SITE_KEY` on the backend); nothing in the dashboard needs configuring.

## Project layout

- `src/components/AssLogo.vue` and `public/favicon.svg`: the logo, two rounded bars on meadow green (`#5a9e2f`), the same in light and dark mode. The interface uses a darker green (`--primary`, `#3f7d20`) so white text on buttons stays readable.
- `src/assets/main.css`: the design tokens (colours, radius, shadows) for light and dark mode, which follow the system setting, and the shared styles (buttons, fields, cards, tables, segmented controls, banners). Components only add their layout, using the tokens (`var(--primary)`…); the stats chart is coloured with them too. Laid out for phones from 375 px wide.
- `src/api.js`: a small `fetch` wrapper for the backend. It always sends the session cookie.
- `src/components/ActivityChart.vue`: the activity chart, plain SVG (views, sessions, previous period dashed), with a hover tooltip and the figures in each slot's `<title>` for screen readers; its geometry is in `src/chartScale.js` (`test/chartScale.test.js`). It replaced ApexCharts (~290 kB gzipped).
- `src/stats.js`: formatting and derived values for the stats (trends, durations, chart series, table rows), kept free of DOM code so they can be unit tested (`test/stats.test.js`).
- `src/components/HomePage.vue`: the public presentation of the service at `/` (what the library does, its anonymity, how to integrate it, and the free limits and retention, read from the backend's `GET /limits`), with sign-up and login links, or a link to the dashboard when logged in. Keep its Gradle version in step with the library's latest tag.
- `src/components/AppsPage.vue`: "Mes applications". Lists your applications and creates new ones; each shows its UUID, the value to pass to the Android library's `AssConfig(appId = …)`.
- `src/components/AppDetail.vue`: one application, in two tabs (`?tab=stats|config` in the URL). **Statistiques** shows its stats. **Configuration** has its UUID, its pages (add or delete; each page's UUID is what `logScreen` takes; CSV import and export, see below) and the button that deletes it. An application without pages opens on Configuration.
- `src/components/ForgotPassword.vue` and `ResetPassword.vue`: "Mot de passe oublié ?" from the login page asks for the email, the backend emails a link to `/reset?token=…`, valid an hour and usable once, where the new password is chosen. Both pages work logged out (`PUBLIC_ROUTES` in `src/router/index.js`).
- `src/components/LegalPage.vue` and `src/legal.js`: the legal notice, privacy policy and terms (`/legal`, `/privacy`, `/terms`), linked from the home page, the sign-up form and the footer. Their text belongs to each instance, see [Legal pages](#legal-pages).
- `src/components/AccountPage.vue`: "Mon compte" (`/account`, linked in the top bar). Shows the account's usage against its quotas (applications, pages per application, views this month), opts in or out of the monthly summary email, changes the password (other devices are signed out) and deletes the account with everything in it, after asking for the password.
- `src/quota.js`: quota helpers (`test/quota.test.js`). Once the month's views reach the limit, `App.vue` shows an alert on every page; the views are still recorded. Creating an application or a page beyond the limits is disabled, and the backend's `403` is explained.
- "Supprimer des vues" in the Configuration tab deletes the views received during a period (the last hour by default, in the viewer's time zone), after a flood of fake views. `src/period.js` converts the inputs (`test/period.test.js`).
- `src/pagesCsv.js`: CSV parsing and writing for the import and export (`test/pagesCsv.test.js`).
- Stats: a click on a page shows its own stats (`?page=<id>`); the chart has the previous period as a dashed line; **CSV** buttons export the slots and the pages table (`slotsCsvRows`, `pagesCsvRows` in `src/stats.js`).
- `src/components/Stats.vue`: the stats of one application. It has a Jour / Semaine / Mois / Année selector with ◀ ▶ to move between periods, cards for views, sessions, pages per session, average duration and bounce rate (each with its change versus the previous period), an activity chart, and a pages table with each page's share of traffic. Loaded on demand, with the application page. Periods already loaded are reused while the page is open (the current one for a minute). For periods older than the backend's retention (90 days by default), only views are kept: session figures show `—` or cover only the recent part, and a note explains it (`detailFrom` in the stats response).
- `vite.config.js`: the build and dev server settings, and where `BACKEND_URL` is read.

## Legal pages

The legal notice, privacy policy and terms name whoever runs the instance, so their text is not in the code. Each instance publishes its own, served next to the dashboard:

- `public/legal/pages.json`: the pages published, e.g. `["legal", "privacy", "terms"]`
- `public/legal/<page>.html`: the content of each page, an HTML fragment (headings, paragraphs, lists, tables; links to the dashboard as `/account`)

`public/legal/` is ignored by git. Start from the templates: `cp -r legal.example public/legal`, then replace every `[champ]` and reread the whole text (host, subprocessors, backups, applicable law) so it describes **your** instance. `{{retention}}` and `{{limits}}` are replaced with the figures from `GET /limits`. Update the date at the top of a page when its content changes.

Without `pages.json` the pages and every link to them are hidden, so an instance never shows someone else's legal notice. An instance open to the public in France or the EU must publish them. The templates are examples, not legal advice: each operator is responsible for their own texts.

With Docker, either build with `public/legal/` in place (it is copied into the image), or mount it at run time: `-v ./legal:/usr/share/nginx/html/legal:ro`.

## Importing and exporting pages (CSV)

In an application's **Configuration** tab:

- **Importer un CSV** creates the pages listed in a file: one page name per line, in the first column. Other columns are ignored, and so is a header row (`name`, `nom`, `page`…). Separators `,`, `;` or tab, quotes and UTF-8 with or without BOM are accepted, so a column exported from Excel or Google Sheets works. Names that already exist aren't created twice, so the same file can be imported again after adding lines. Up to 1000 pages per file, and the application can't go over its pages quota (30 by default): a file that would is refused before anything is created.
- **Exporter en CSV** downloads `name,id,app_id`, one line per page: everything needed to call `logScreen` for each screen. Give it to a developer or an AI assistant along with the library's README to add the tracking calls to an app.

## Contributing and license

Contributions are welcome, see [CONTRIBUTING.md](CONTRIBUTING.md). Report security issues privately, see [SECURITY.md](SECURITY.md).

Released under the [MIT license](LICENSE). The project is part of Anonymous Simple Stats, with the [Android](https://github.com/ClewigFr/AssAndroid) and [iOS](https://github.com/ClewigFr/AssIOS) libraries and the [API](https://github.com/ClewigFr/AssBackend).
