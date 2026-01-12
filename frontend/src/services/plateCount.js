import { api } from 'boot/axios'

export const plateCountService = {
  // Get all plate counts with filters
  async getAll(params = {}) {
    const response = await api.get('/plate-counts', { params })
    return response.data
  },

  // Get single plate count by ID
  async getById(id) {
    const response = await api.get(`/plate-counts/${id}`)
    return response.data
  },

  // Get summary/report
  async getSummary(params = {}) {
    const response = await api.get('/plate-counts/summary', { params })
    return response.data
  },

  // Get today's summary
  async getTodaySummary() {
    const response = await api.get('/plate-counts/today/summary')
    return response.data
  },

  // Create new plate count
  async create(data) {
    const response = await api.post('/plate-counts', data)
    return response.data
  },

  // Update plate count
  async update(id, data) {
    const response = await api.put(`/plate-counts/${id}`, data)
    return response.data
  },

  // Delete plate count
  async delete(id) {
    const response = await api.delete(`/plate-counts/${id}`)
    return response.data
  },

  // Calculate preview (client-side calculation for UI)
  calculatePreview(plateCount, config = {}) {
    const count = parseInt(plateCount) || 0
    const pricePerPlate = parseFloat(config.pricePerPlate) || 11500
    const incomePerPlate = parseFloat(config.incomePerPlate) || 7000
    const returnPerPlate = parseFloat(config.returnPerPlate) || 4500
    const taxPercentage = parseFloat(config.taxPercentage) || 2

    const totalTransfer = count * pricePerPlate
    const grossIncome = count * incomePerPlate
    const incomeTax = grossIncome * (taxPercentage / 100)
    const netIncome = grossIncome - incomeTax
    const grossReturn = count * returnPerPlate
    const returnTax = grossReturn * (taxPercentage / 100)
    const netReturn = grossReturn - returnTax
    const totalTax = incomeTax + returnTax
    const totalAfterTax = netIncome + netReturn

    return {
      plateCount: count,
      pricePerPlate,
      incomePerPlate,
      returnPerPlate,
      taxPercentage,
      totalTransfer,
      grossIncome,
      incomeTax,
      netIncome,
      grossReturn,
      returnTax,
      netReturn,
      totalTax,
      totalAfterTax,
      // Verification: should equal totalTransfer * (1 - taxPercentage/100)
      verification: Math.abs(totalAfterTax - (totalTransfer * (1 - taxPercentage / 100))) < 1
    }
  }
}

export default plateCountService
