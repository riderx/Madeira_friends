import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import '@fortawesome/fontawesome-free/css/all.css'
import './style.css'
import App from './App.vue'
import { routes, setupRouterGuards } from './router'

const app = createApp(App)
const pinia = createPinia()
const router = createRouter({
  history: createWebHistory(),
  routes
})

setupRouterGuards(router)

app.use(pinia)
app.use(router)
app.mount('#app')
