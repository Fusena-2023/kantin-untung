import { defineStore } from 'pinia'
import AuthService from 'src/services/auth'
import { useTransactionStore } from 'stores/transaction-store'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    isLoading: false,
    isInitialized: false
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.token),
    userRole: (state) => state.user?.role ?? null,
    // Check by role ID (1 = pemilik, 2 = pegawai), by userRole.name, or by role string from JWT
    isPemilik: (state) => {
      if (!state.user) return false
      // From login response: role is number, userRole.name is string
      // From JWT decode: role is string
      return state.user.role === 1 ||
             state.user.role === 'pemilik' ||
             state.user.userRole?.name === 'pemilik'
    },
    isPegawai: (state) => {
      if (!state.user) return false
      return state.user.role === 2 ||
             state.user.role === 'pegawai' ||
             state.user.userRole?.name === 'pegawai'
    }
  },

  actions: {
    // =========================
    // 🔐 LOGIN
    // =========================
    async login(credentials) {
      this.isLoading = true
      try {
        const { user, token } = await AuthService.login(credentials)

        this.user = user
        this.token = token
        this.isInitialized = true

        AuthService.setToken(token)

        return user
      } finally {
        this.isLoading = false
      }
    },

    // =========================
    // 📝 REGISTER
    // =========================
    async register(userData) {
      this.isLoading = true
      try {
        const { user, token } = await AuthService.register(userData)

        this.user = user
        this.token = token
        this.isInitialized = true

        AuthService.setToken(token)

        return user
      } finally {
        this.isLoading = false
      }
    },

    // =========================
    // 🚪 LOGOUT (CLEAN)
    // =========================
    async logout() {
      this.isLoading = true
      try {
        await AuthService.logout()
      } catch (error) {
        console.warn('Logout API failed:', error)
      } finally {
        this.clearAuth()

        // 🔥 CLEAR STORE LAIN (PENTING)
        const transactionStore = useTransactionStore()
        transactionStore.clear()

        this.isLoading = false
      }
    },

    // =========================
    // ♻️ INIT AUTH (WAJIB ASYNC)
    // =========================
    async initializeAuth() {
      const token = AuthService.getToken()

      if (!token) {
        this.clearAuth()
        this.isInitialized = true
        return
      }

      try {
        AuthService.setToken(token)
        this.token = token

        // 🔹 Jika backend punya endpoint /me → pakai itu
        if (AuthService.me) {
          this.user = await AuthService.me()
        } else {
          // 🔹 Fallback decode JWT
          const payload = JSON.parse(atob(token.split('.')[1]))

          this.user = {
            id: payload.userId || payload.id,
            username: payload.username,
            role: payload.role,
            fullName: payload.fullName || payload.name,
            email: payload.email
          }
        }
      } catch (error) {
        console.warn('Initialize auth failed, clearing auth:', error)
        this.clearAuth()
      } finally {
        this.isInitialized = true
      }
    },

    // =========================
    // 🧹 CLEAR AUTH (INTERNAL)
    // =========================
    clearAuth() {
      this.user = null
      this.token = null
      this.isInitialized = false
      AuthService.removeToken()
    }
  }
})
