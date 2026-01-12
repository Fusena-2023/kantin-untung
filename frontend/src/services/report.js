import { api } from 'src/boot/axios'

class ReportService {
  constructor() {
    this.baseURL = '/reports'
  }

  async getDashboard() {
    try {
      const response = await api.get(`${this.baseURL}/dashboard`)
      return response.data.data
    } catch (error) {
      throw error.response?.data?.message || 'Gagal mengambil data dashboard'
    }
  }

  async getDailyReport(date) {
    try {
      const params = date ? { date } : {}
      const response = await api.get(`${this.baseURL}/daily`, { params })
      return response.data.data
    } catch (error) {
      throw error.response?.data?.message || 'Gagal mengambil laporan harian'
    }
  }

  async getMonthlyReport(year, month) {
    try {
      const params = {}
      if (year) params.year = year
      if (month) params.month = month
      const response = await api.get(`${this.baseURL}/monthly`, { params })
      return response.data.data
    } catch (error) {
      throw error.response?.data?.message || 'Gagal mengambil laporan bulanan'
    }
  }

  async getRangeReport(startDate, endDate) {
    try {
      const params = { startDate, endDate }
      const response = await api.get(`${this.baseURL}/range`, { params })
      return response.data.data
    } catch (error) {
      throw error.response?.data?.message || 'Gagal mengambil laporan periode'
    }
  }

  // Plate Count Reports
  async getPlateCountSummary(startDate, endDate) {
    try {
      const params = {}
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      const response = await api.get('/plate-counts/summary', { params })
      return response.data.data
    } catch (error) {
      throw error.response?.data?.message || 'Gagal mengambil laporan piring'
    }
  }
}

export default new ReportService()
