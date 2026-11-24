import { createRouter, createWebHashHistory } from 'vue-router'
import Login from '@/components/Login.vue'

// Hash history keeps URLs like /#/apps working on a plain static file server
// Pages reachable without being logged in
export const PUBLIC_ROUTES = ['home', 'login', 'register', 'verify', 'forgot', 'reset']

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    // The public presentation of the service
    { path: '/', name: 'home', component: () => import('@/components/HomePage.vue') },
    { path: '/login', name: 'login', component: Login },
    { path: '/register', name: 'register', component: () => import('@/components/Register.vue') },
    // Opened from the verification email: /#/verify?token=…
    { path: '/verify', name: 'verify', component: () => import('@/components/VerifyEmail.vue') },
    { path: '/forgot', name: 'forgot', component: () => import('@/components/ForgotPassword.vue') },
    // Opened from the reset email: /#/reset?token=…
    { path: '/reset', name: 'reset', component: () => import('@/components/ResetPassword.vue') },
    { path: '/apps', name: 'apps', component: () => import('@/components/AppsPage.vue') },
    // Loaded on demand: keeps ApexCharts out of the login page's bundle
    { path: '/apps/:id', name: 'app', component: () => import('@/components/AppDetail.vue'), props: true },
    { path: '/account', name: 'account', component: () => import('@/components/AccountPage.vue') },
    // Old dashboard URL
    { path: '/stats', redirect: { name: 'apps' } }
  ]
})
