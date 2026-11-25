import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { loadLegalPages } from './legal'

loadLegalPages()

createApp(App).use(router).mount('#app')
