import { defineStore } from 'pinia'
import AuthService from 'src/services/auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    isLoading: false,
    isInitialized: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    userRole: (state) => state.user?.role,
    isPemilik: (state) => state.user?.role === 'pemilik',
    isPegawai: (state) => state.user?.role === 'pegawai'
  },

  actions: {
    async login(credentials) {
      this.isLoading = true
      try {
        const { user, token } = await AuthService.login(credentials)
        this.user = user
        this.token = token
        this.isInitialized = true // Ensure initialized flag is set
        // Set token in AuthService to add to axios headers
        AuthService.setToken(token)
        return user
      } finally {
        this.isLoading = false
      }
    },

    async register(userData) {
      this.isLoading = true
      try {
        const { user, token } = await AuthService.register(userData)
        this.user = user
        this.token = token
        return user
      } finally {
        this.isLoading = false
      }
    },

    async logout() {
      try {
        await AuthService.logout()
      } catch (error) {
        console.warn('Logout API failed:', error)
      } finally {
        // Clear all auth data
        this.user = null
        this.token = null
        this.isInitialized = false

        // Clear localStorage
        AuthService.removeToken()
      }
    },

    initializeAuth() {
      const token = AuthService.getToken()
      if (token && AuthService.isAuthenticated()) {
        this.token = token
        // Set token in AuthService headers
        AuthService.setToken(token)
        try {
          // Decode token to get user info
          const payload = JSON.parse(atob(token.split('.')[1]))

          // Map payload properties correctly
          this.user = {
            id: payload.userId || payload.id,
            username: payload.username,
            role: payload.role,
            fullName: payload.fullName || payload.name,
            email: payload.email
          }
        } catch {
          console.warn('Failed to decode token, clearing auth')
          AuthService.removeToken()
          this.token = null
          this.user = null
        }
      } else {
        AuthService.removeToken()
      }
      this.isInitialized = true
    },

    $reset() {
      this.user = null
      this.token = null
      this.isLoading = false
      this.isInitialized = false
      AuthService.removeToken()
    }
  }
})
