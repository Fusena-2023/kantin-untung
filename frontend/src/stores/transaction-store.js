import { defineStore } from 'pinia'
import TransactionService from 'src/services/transaction'

export const useTransactionStore = defineStore('transaction', {
  state: () => ({
    transactions: [],
    currentTransaction: null,
    isLoading: false,
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0
    },
    filters: {
      search: null,
      type: null,
      category: null,
      startDate: null,
      endDate: null
    }
  }),

  getters: {
    totalIncome: (state) => {
      return state.transactions
        .filter(t => t.type === 'masuk')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
    },
    totalExpense: (state) => {
      return state.transactions
        .filter(t => t.type === 'keluar')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
    },
    profit: (state) => {
      return state.totalIncome - state.totalExpense
    }
  },

  actions: {
    async fetchTransactions(params = {}) {
      this.isLoading = true
      try {
        // Filter out empty values from filters
        const cleanFilters = {}
        Object.keys(this.filters).forEach(key => {
          const value = this.filters[key]
          if (value && value !== '' && value !== null && value !== undefined) {
            cleanFilters[key] = value
          }
        })

        // Filter out empty values from params
        const cleanParams = {}
        Object.keys(params).forEach(key => {
          const value = params[key]
          if (value && value !== '' && value !== null && value !== undefined) {
            cleanParams[key] = value
          }
        })

        const queryParams = {
          ...cleanFilters,
          page: this.pagination.page,
          limit: this.pagination.limit,
          ...cleanParams
        }

        const data = await TransactionService.getTransactions(queryParams)
        this.transactions = data.transactions || []
        this.pagination = data.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 }
      } catch (error) {
        console.error('Fetch transactions error:', error)
        // Reset to empty state on error
        this.transactions = []
        this.pagination = { total: 0, page: 1, limit: 10, totalPages: 0 }
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async fetchTransaction(id) {
      this.isLoading = true
      try {
        const transaction = await TransactionService.getTransaction(id)
        this.currentTransaction = transaction
        return transaction
      } finally {
        this.isLoading = false
      }
    },

    async createTransaction(data) {
      const transaction = await TransactionService.createTransaction(data)
      this.transactions.unshift(transaction)
      return transaction
    },

    async updateTransaction(id, data) {
      const transaction = await TransactionService.updateTransaction(id, data)
      const index = this.transactions.findIndex(t => t.id === id)
      if (index !== -1) {
        this.transactions[index] = transaction
      }
      return transaction
    },

    async deleteTransaction(id) {
      await TransactionService.deleteTransaction(id)
      this.transactions = this.transactions.filter(t => t.id !== id)
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      this.pagination.page = 1
    },

    clearFilters() {
      this.filters = {
        search: '',
        type: '',
        category: '',
        startDate: '',
        endDate: ''
      }
      this.pagination.page = 1
    },

    setPage(page) {
      this.pagination.page = page
    }
  }
})
