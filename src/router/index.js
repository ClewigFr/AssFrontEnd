import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/components/Login.vue'
// The landing page, in the main bundle: loading it on demand added a round trip before its API calls
import HomePage from '@/components/HomePage.vue'

// Pages reachable without being logged in
export const PUBLIC_ROUTES = ['home', 'legal', 'privacy', 'terms', 'login', 'register', 'verify', 'forgot', 'reset', 'not-found']

// Links from before the switch to real paths (/#/reset?token=… in emails already sent,
// bookmarks) are rewritten to /reset?token=… before the router reads the URL.
if (typeof window !== 'undefined' && window.location.hash.startsWith('#/')) {
  window.history.replaceState(null, '', window.location.hash.slice(1))
}

// Real paths, so search engines see each public page; nginx serves index.html for the app's
// routes and a 404 for anything else (see nginx.conf, keep both lists in step)
const router = createRouter({
  history: createWebHistory(),
  scrollBehavior (to, from, saved) {
    if (saved) return saved
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
  routes: [
    // The public presentation of the service
    { path: '/', name: 'home', component: HomePage },
    { path: '/login', name: 'login', component: Login },
    { path: '/legal', name: 'legal', component: () => import('@/components/LegalPage.vue'), props: { page: 'legal' } },
    { path: '/privacy', name: 'privacy', component: () => import('@/components/LegalPage.vue'), props: { page: 'privacy' } },
    { path: '/terms', name: 'terms', component: () => import('@/components/LegalPage.vue'), props: { page: 'terms' } },
    { path: '/register', name: 'register', component: () => import('@/components/Register.vue') },
    // Opened from the verification email: /verify?token=…
    { path: '/verify', name: 'verify', component: () => import('@/components/VerifyEmail.vue') },
    { path: '/forgot', name: 'forgot', component: () => import('@/components/ForgotPassword.vue') },
    // Opened from the reset email: /reset?token=…
    { path: '/reset', name: 'reset', component: () => import('@/components/ResetPassword.vue') },
    { path: '/apps', name: 'apps', component: () => import('@/components/AppsPage.vue') },
    // Loaded on demand, with the stats page
    { path: '/apps/:id', name: 'app', component: () => import('@/components/AppDetail.vue'), props: true },
    { path: '/account', name: 'account', component: () => import('@/components/AccountPage.vue') },
    // Old dashboard URL
    { path: '/stats', redirect: { name: 'apps' } },
    { path: '/:unknown(.*)*', name: 'not-found', component: () => import('@/components/NotFound.vue') }
  ]
})

// One canonical address per public page (with SITE_URL set at build time), so the same
// index.html served for every path isn't seen as duplicates of the home page
router.afterEach(to => {
  if (typeof document === 'undefined' || !__SITE_URL__) return
  let link = document.querySelector('link[rel="canonical"]')
  if (!PUBLIC_ROUTES.includes(to.name) || to.name === 'not-found') {
    link?.remove()
    return
  }
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }
  link.href = __SITE_URL__ + to.path
})

// Old-style links clicked inside a page (legal pages written with href="#/account")
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    if (window.location.hash.startsWith('#/')) router.replace(window.location.hash.slice(1))
  })
}

export default router
