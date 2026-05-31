import { watch } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import Add from '@/views/Add.vue'
import { authClient } from '../auth-client'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: Login },
    { path: '/', component: Home, meta: { requiresAuth: true } },
    { path: '/add', component: Add, meta: { requiresAuth: true } },
  ],
})

const session = authClient.useSession()

router.beforeEach(async (to) => {
  if (session.value.isPending) {
    await new Promise<void>((resolve) => {
      const stop = watch(() => session.value.isPending, (pending) => {
        if (!pending) {
          stop()
          resolve()
        }
      })
    })
  }
  const sessionData = session.value?.data
  const isAuthenticated = !!sessionData?.user
  if (to.meta.requiresAuth && !isAuthenticated) {
    return '/login'
  }
  if (to.meta.role === 'admin' && sessionData?.user?.role !== 'admin') {
    return '/'
  }
})

export default router
