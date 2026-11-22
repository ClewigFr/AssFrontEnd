# Asynchronous Simple Stats front end

> A Vue.js project

## Running in dev

Requirements: **Node.js 20** (tested with 20.18). Note that `npm install` also runs a production build at the end (`postinstall`).

If you get `error:0308010C:digital envelope routines::unsupported` with another Node version, it comes from the old toolchain (webpack 3). Set this variable before your `npm` commands:

```bash
export NODE_OPTIONS=--openssl-legacy-provider
```

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
4. Open http://localhost:8080 and log in with the account created by `seed-dev.sh`. Its login and password are at the top of that script.

Things to know:
- Restarting the backend wipes its data (in-memory database) and logs you out. Run `seed-dev.sh` again, then log in again.
- To use a backend at a different address: `BACKEND_URL=http://localhost:9000 npm run dev`.
- The backend only accepts requests from `http://localhost:8080` by default. If you change the dashboard's port, add it to the backend's `CORS_ORIGINS`.

## Backend URL

The dashboard calls the AssBackend API, and its base URL is set at build time:

- **Dev** (`npm run dev`): `http://localhost:8099` by default.
- **Prod** (`npm run build`): set `BACKEND_URL=https://your-api.example.com`. If it's not set, the old Heroku host is used.

The backend must list this dashboard's origin in its `CORS_ORIGINS` setting, or the browser blocks every request.

## Commands

```bash
npm run dev          # dev server with hot reload at localhost:8080
npm run build        # production build into dist/
npm start            # serve dist/ (PORT, default 5000), used in production
npm test             # unit tests (Jest)
npm run lint         # ESLint
```

## Editor

[Visual Studio Code](https://code.visualstudio.com)
