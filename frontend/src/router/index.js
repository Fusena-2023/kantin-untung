import { defineRouter } from '#q-app/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import routes from './routes'

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(function () {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  // Navigation guards
  Router.beforeEach(async (to, from, next) => {
    // Import auth store dynamically
    const { useAuthStore } = await import('stores/auth-store')
    const authStore = useAuthStore()

    // Initialize auth store if needed
    if (!authStore.isInitialized) {
      authStore.initializeAuth()
    }

    // Add delay for login flow to ensure state is properly updated
    if (from.path === '/login' && to.path !== '/login') {
      await new Promise(resolve => setTimeout(resolve, 150))
    }

    const isAuthenticated = authStore.isAuthenticated
    const userRole = authStore.userRole

    // Check if route requires authentication
    if (to.matched.some(record => record.meta.requiresAuth)) {
      if (!isAuthenticated) {
        next('/login')
        return
      }

      // Check role-based access
      if (to.meta.roles && !to.meta.roles.includes(userRole)) {
        next('/app/transactions') // Redirect to default page
        return
      }
    }

    // Check if route requires guest (login page)
    if (to.matched.some(record => record.meta.requiresGuest)) {
      if (isAuthenticated) {
        // Redirect berdasarkan role
        if (userRole === 'pemilik') {
          next('/app/dashboard')
        } else {
          next('/app/transactions') // Pegawai ke halaman transaksi
        }
        return
      }
    }

    next()
  })

  return Router
})
