import { createRouter, createWebHashHistory } from 'vue-router'
import Login from '@/components/Login.vue'

// Hash history keeps URLs like /#/apps working on a plain static file server
export default createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: { name: 'login' } },
    { path: '/login', name: 'login', component: Login },
    { path: '/apps', name: 'apps', component: () => import('@/components/AppsPage.vue') },
    // Loaded on demand: keeps ApexCharts out of the login page's bundle
    { path: '/apps/:id', name: 'app', component: () => import('@/components/AppDetail.vue'), props: true },
    // Old dashboard URL
    { path: '/stats', redirect: { name: 'apps' } }
  ]
})
