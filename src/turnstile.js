// Cloudflare Turnstile widget, loaded only on the sign-up page and only when the backend has it on
const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
let loading = null

function load () {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT
    script.async = true
    script.onload = () => resolve(window.turnstile)
    script.onerror = () => { loading = null; reject(new Error('Turnstile unavailable')) }
    document.head.appendChild(script)
  })
  return loading
}

/** Renders the widget in [element]; [onToken] gets each new token ('' when it expires). Returns the widget id. */
export async function renderTurnstile (element, sitekey, onToken) {
  const turnstile = await load()
  return turnstile.render(element, {
    sitekey,
    language: 'fr',
    callback: onToken,
    'expired-callback': () => onToken(''),
    'error-callback': () => onToken('')
  })
}

export function resetTurnstile (id) {
  if (window.turnstile && id != null) window.turnstile.reset(id)
}
