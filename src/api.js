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

async function request (method, path, body, headers) {
  const response = await fetch(`${BACKEND_URL}/${path}`, { method, body, headers, credentials: 'include' })
  const type = response.headers.get('content-type') || ''
  const data = response.status === 204 ? null
    : type.includes('application/json') ? await response.json() : await response.text()
  if (!response.ok) throw new ApiError(response.status, data)
  return data
}

export const api = {
  get: (path) => request('GET', path),
  post: (path) => request('POST', path),
  // Form-encoded, as the backend's /login and /register expect
  postForm: (path, fields) => request('POST', path, new URLSearchParams(fields)),
  patchJson: (path, data) => request('PATCH', path, JSON.stringify(data), { 'Content-Type': 'application/json' }),
  postJson: (path, data) => request('POST', path, JSON.stringify(data), { 'Content-Type': 'application/json' }),
  delete: (path) => request('DELETE', path),
  deleteJson: (path, data) => request('DELETE', path, JSON.stringify(data), { 'Content-Type': 'application/json' })
}
