import { createRouter, createWebHashHistory } from 'vue-router'
import Login from '@/components/Login.vue'
// The landing page, in the main bundle: loading it on demand added a round trip before its API calls
import HomePage from '@/components/HomePage.vue'

// Hash history keeps URLs like /#/apps working on a plain static file server
// Pages reachable without being logged in
export const PUBLIC_ROUTES = ['home', 'legal', 'privacy', 'terms', 'login', 'register', 'verify', 'forgot', 'reset']

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    // The public presentation of the service
    { path: '/', name: 'home', component: HomePage },
    { path: '/login', name: 'login', component: Login },
    { path: '/legal', name: 'legal', component: () => import('@/components/LegalPage.vue'), props: { page: 'legal' } },
    { path: '/privacy', name: 'privacy', component: () => import('@/components/LegalPage.vue'), props: { page: 'privacy' } },
    { path: '/terms', name: 'terms', component: () => import('@/components/LegalPage.vue'), props: { page: 'terms' } },
    { path: '/register', name: 'register', component: () => import('@/components/Register.vue') },
    // Opened from the verification email: /#/verify?token=…
    { path: '/verify', name: 'verify', component: () => import('@/components/VerifyEmail.vue') },
    { path: '/forgot', name: 'forgot', component: () => import('@/components/ForgotPassword.vue') },
    // Opened from the reset email: /#/reset?token=…
    { path: '/reset', name: 'reset', component: () => import('@/components/ResetPassword.vue') },
    { path: '/apps', name: 'apps', component: () => import('@/components/AppsPage.vue') },
    // Loaded on demand, with the stats page
    { path: '/apps/:id', name: 'app', component: () => import('@/components/AppDetail.vue'), props: true },
    { path: '/account', name: 'account', component: () => import('@/components/AccountPage.vue') },
    // Old dashboard URL
    { path: '/stats', redirect: { name: 'apps' } }
  ]
})
