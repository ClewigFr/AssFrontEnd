import { createRouter, createWebHashHistory } from 'vue-router'
import Login from '@/components/Login.vue'

// Hash history keeps URLs like /#/stats working on a plain static file server
export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: { name: 'login' } },
    { path: '/login', name: 'login', component: Login },
    // Loaded on demand: keeps ApexCharts out of the login page's bundle
    { path: '/stats', name: 'stats', component: () => import('@/components/Stats.vue') }
  ]
})
