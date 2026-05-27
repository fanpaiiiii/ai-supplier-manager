import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import Vant from 'vant'
import 'vant/lib/index.css'
import App from './App.vue'
import './style.css'

const routes = [
  { path: '/', name: 'home', component: () => import('./views/Home.vue') },
  { path: '/add', name: 'add', component: () => import('./views/AddSupplier.vue') },
  { path: '/supplier/:id', name: 'detail', component: () => import('./views/SupplierDetail.vue') },
  { path: '/logs', name: 'logs', component: () => import('./views/Logs.vue') },
  { path: '/settings', name: 'settings', component: () => import('./views/Settings.vue') },
]

const router = createRouter({
  history: createWebHistory('/'),
  routes,
})

const app = createApp(App)
app.use(router)
app.use(Vant)
app.mount('#app')
