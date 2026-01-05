import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'
import { useAuthStore } from 'stores/auth-store'

const api = axios.create({
  baseURL:
    process.env.NODE_ENV === 'production'
      ? 'https://your-production-api-url.com/api'
      : 'http://localhost:3001/api'
})

export default defineBoot(({ app, router }) => {
  // =========================
  // 📤 REQUEST INTERCEPTOR
  // =========================
  api.interceptors.request.use(
    (config) => {
      const authStore = useAuthStore()

      if (authStore.token) {
        config.headers.Authorization = `Bearer ${authStore.token}`
      }

      return config
    },
    (error) => Promise.reject(error)
  )

  // =========================
  // 📥 RESPONSE INTERCEPTOR
  // =========================
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const authStore = useAuthStore()

      // 🔐 Unauthorized / token invalid
      if (error.response?.status === 401) {
        // Hindari loop logout
        if (authStore.isAuthenticated) {
          await authStore.logout()
        }

        // Redirect via router (SPA-safe)
        if (router.currentRoute.value.path !== '/login') {
          router.replace('/login')
        }
      }

      return Promise.reject(error)
    }
  )

  // Global axios (optional)
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }
