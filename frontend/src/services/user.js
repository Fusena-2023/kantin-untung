import { api } from 'src/boot/axios'

class UserService {
  constructor() {
    this.baseURL = '/users'
  }

  async getUsers(params = {}) {
    try {
      const response = await api.get(this.baseURL, { params })
      return response.data // Return the full response including data structure
    } catch (error) {
      throw error.response?.data?.message || 'Gagal mengambil data user'
    }
  }

  async getUser(id) {
    try {
      const response = await api.get(`${this.baseURL}/${id}`)
      return response.data.data.user
    } catch (error) {
      throw error.response?.data?.message || 'Gagal mengambil data user'
    }
  }

  async createUser(data) {
    try {
      console.log('UserService.createUser called with:', data)
      const response = await api.post(this.baseURL, data)
      console.log('UserService.createUser response:', response)
      return response.data.data.user
    } catch (error) {
      console.error('UserService.createUser error:', error)
      console.error('Error response:', error.response)
      throw error.response?.data?.message || 'Gagal membuat user'
    }
  }

  async updateUser(id, data) {
    try {
      console.log('UserService.updateUser called with:', { id, data })
      const response = await api.put(`${this.baseURL}/${id}`, data)
      console.log('UserService.updateUser response:', response)
      return response.data.data.user
    } catch (error) {
      console.error('UserService.updateUser error:', error)
      console.error('Error response:', error.response)
      throw error.response?.data?.message || 'Gagal mengupdate user'
    }
  }

  async patchUser(id, data) {
    try {
      const response = await api.patch(`${this.baseURL}/${id}`, data)
      return response.data.data.user
    } catch (error) {
      throw error.response?.data?.message || 'Gagal mengupdate user'
    }
  }

  async deleteUser(id) {
    try {
      await api.delete(`${this.baseURL}/${id}`)
    } catch (error) {
      throw error.response?.data?.message || 'Gagal menghapus user'
    }
  }
}

export default new UserService()
