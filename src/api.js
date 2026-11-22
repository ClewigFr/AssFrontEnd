// Small wrapper around fetch for the AssBackend API (replaces vue-resource).
// The session cookie lives on the backend's origin, so every request sends credentials.

export const BACKEND_URL = __BACKEND_URL__.replace(/\/$/, '')

export class ApiError extends Error {
  constructor (status, body) {
    super(`HTTP ${status}`)
    this.status = status
    this.body = body
  }
}

async function request (method, path, body) {
  const response = await fetch(`${BACKEND_URL}/${path}`, { method, body, credentials: 'include' })
  const type = response.headers.get('content-type') || ''
  const data = type.includes('application/json') ? await response.json() : await response.text()
  if (!response.ok) throw new ApiError(response.status, data)
  return data
}

export const api = {
  get: (path) => request('GET', path),
  // Form-encoded, as the backend's /login and /register expect
  postForm: (path, fields) => request('POST', path, new URLSearchParams(fields))
}
