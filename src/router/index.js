import Vue from 'vue'
import Router from 'vue-router'
import Stats from '@/components/Stats'
import Login from '@/components/login'

const BASE_URL = 'https://gentle-inlet-02091.herokuapp.com'

Vue.use(Router)

export default new Router({
  routes: [
    // {
    //   path: '/',
    //   redirect: {
    //     name: 'login'
    //   }
    // },
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/stats',
      name: 'stats',
      component: Stats
    }
  ]
})
