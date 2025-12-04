import { api } from 'src/boot/axios'

class AuthService {
  constructor() {
    this.baseURL = '/auth'
  }

  async login(credentials) {
    try {
      const response = await api.post(`${this.baseURL}/login`, credentials)
      if (response.data.success) {
        const { token, user } = response.data.data
        this.setToken(token)
        return { user, token }
      }
      throw new Error(response.data.message)
    } catch (error) {
      throw error.response?.data?.message || 'Login gagal'
    }
  }

  async register(userData) {
    try {
      const response = await api.post(`${this.baseURL}/register`, userData)
      if (response.data.success) {
        const { token, user } = response.data.data
        this.setToken(token)
        return { user, token }
      }
      throw new Error(response.data.message)
    } catch (error) {
      throw error.response?.data?.message || 'Registrasi gagal'
    }
  }

  async logout() {
    try {
      await api.post(`${this.baseURL}/logout`)
    } catch (error) {
      console.warn('Logout request failed:', error)
    } finally {
      this.removeToken()
    }
  }

  setToken(token) {
    localStorage.setItem('auth_token', token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  getToken() {
    return localStorage.getItem('auth_token')
  }

  removeToken() {
    localStorage.removeItem('auth_token')
    delete api.defaults.headers.common['Authorization']
  }

  isAuthenticated() {
    const token = this.getToken()
    if (!token) return false

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.exp > Date.now() / 1000
    } catch {
      return false
    }
  }
}

export default new AuthService()
