# Asynchronous Simple Stats front end

> A Vue.js project

## Backend URL

The dashboard calls the AssBackend API, and its base URL is set at build time:

- **Dev** (`npm run dev`): `http://localhost:8099` by default. Start the backend with `PORT=8099`, because the dev server already uses 8080.
- **Prod** (`npm run build`): set `BACKEND_URL=https://your-api.example.com`. If it's not set, the old Heroku host is used.

The backend must list this dashboard's origin in its `CORS_ORIGINS` setting, or the browser blocks every request.

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report

# run unit tests
npm run unit

# run e2e tests
npm run e2e

# run all tests
npm test
```

For a detailed explanation on how things work, check out the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).

## Editor

[Visual Studio Code](https://code.visualstudio.com)
