import { api } from 'src/boot/axios'

class TransactionService {
  constructor() {
    this.baseURL = '/transactions'
  }

  async getTransactions(params = {}) {
    try {
      const response = await api.get(this.baseURL, { params })
      return response.data.data
    } catch (error) {
      throw error.response?.data?.message || 'Gagal mengambil data transaksi'
    }
  }

  async getTransaction(id) {
    try {
      const response = await api.get(`${this.baseURL}/${id}`)
      return response.data.data.transaction
    } catch (error) {
      throw error.response?.data?.message || 'Gagal mengambil data transaksi'
    }
  }

  async createTransaction(data) {
    try {
      const response = await api.post(this.baseURL, data)
      if (response.data.success) {
        return response.data.data.transaction
      }
      throw new Error(response.data.message || 'Gagal membuat transaksi')
    } catch (error) {
      console.error('Create transaction error:', error)
      throw error.response?.data?.message || error.message || 'Gagal membuat transaksi'
    }
  }

  async updateTransaction(id, data) {
    try {
      const response = await api.put(`${this.baseURL}/${id}`, data)
      return response.data.data.transaction
    } catch (error) {
      throw error.response?.data?.message || 'Gagal mengupdate transaksi'
    }
  }

  async patchTransaction(id, data) {
    try {
      const response = await api.patch(`${this.baseURL}/${id}`, data)
      return response.data.data.transaction
    } catch (error) {
      throw error.response?.data?.message || 'Gagal mengupdate transaksi'
    }
  }

  async deleteTransaction(id) {
    try {
      await api.delete(`${this.baseURL}/${id}`)
    } catch (error) {
      throw error.response?.data?.message || 'Gagal menghapus transaksi'
    }
  }
}

export default new TransactionService()
