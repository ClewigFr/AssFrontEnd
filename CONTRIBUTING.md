# Contributing

Thanks for your interest in Anonymous Simple Stats. Issues and pull requests are welcome.

## Ground rules

- **Anonymity is the product.** No analytics, trackers or third-party scripts in the dashboard; the session cookie is the only cookie.
- The dashboard talks to [AssBackend](https://github.com/ClewigFr/AssBackend) only; keep it in step with the backend's API.
- Texts that name an operator (legal pages) belong to each instance, not to the code, see the README's "Legal pages".

## Development

Needs Node 22.

```bash
npm ci
npm run dev        # http://localhost:8080, against a backend on http://localhost:8099
npm test           # unit tests (vitest)
npm run lint
npm run e2e        # end-to-end tests, needs Docker (starts the backend image)
```

## Pull requests

- One topic per pull request, with tests for the behaviour you change.
- `npm test` and `npm run lint` must pass; CI runs them on every pull request.
- The interface is in French; keep the wording consistent with the existing pages.

By contributing, you agree that your contributions are released under the [MIT license](LICENSE).
