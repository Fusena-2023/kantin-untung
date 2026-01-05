import { defineStore } from 'pinia'
import { useAuthStore } from 'stores/auth-store'
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
    totalIncome: (state) =>
      state.transactions
        .filter(t => t.type === 'masuk')
        .reduce((sum, t) => sum + Number(t.amount), 0),

    totalExpense: (state) =>
      state.transactions
        .filter(t => t.type === 'keluar')
        .reduce((sum, t) => sum + Number(t.amount), 0),

    profit: (state) =>
      state.transactions
        .filter(t => t.type === 'masuk')
        .reduce((sum, t) => sum + Number(t.amount), 0)
      -
      state.transactions
        .filter(t => t.type === 'keluar')
        .reduce((sum, t) => sum + Number(t.amount), 0)
  },

  actions: {
    // =========================
    // 🔐 SAFE FETCH
    // =========================
    async fetchTransactions(params = {}) {
      const authStore = useAuthStore()

      // ⛔ STOP jika belum login
      if (!authStore.isAuthenticated) {
        console.warn('Fetch transactions dibatalkan: user belum login')
        return
      }

      this.isLoading = true
      try {
        const cleanFilters = {}
        Object.keys(this.filters).forEach(key => {
          const value = this.filters[key]
          if (value !== null && value !== '' && value !== undefined) {
            cleanFilters[key] = value
          }
        })

        const cleanParams = {}
        Object.keys(params).forEach(key => {
          const value = params[key]
          if (value !== null && value !== '' && value !== undefined) {
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
        this.pagination = data.pagination || {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0
        }
      } catch (error) {
        // 🔕 Jangan lempar error auth ke UI
        if (error?.response?.status === 401) {
          console.warn('Unauthorized, clearing transactions')
          this.clear()
          return
        }

        console.error('Fetch transactions error:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async fetchTransaction(id) {
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) return

      this.isLoading = true
      try {
        this.currentTransaction =
          await TransactionService.getTransaction(id)
        return this.currentTransaction
      } finally {
        this.isLoading = false
      }
    },

    async createTransaction(data) {
      const transaction =
        await TransactionService.createTransaction(data)
      this.transactions.unshift(transaction)
      return transaction
    },

    async updateTransaction(id, data) {
      const transaction =
        await TransactionService.updateTransaction(id, data)
      const index = this.transactions.findIndex(t => t.id === id)
      if (index !== -1) {
        this.transactions[index] = transaction
      }
      return transaction
    },

    async deleteTransaction(id) {
      await TransactionService.deleteTransaction(id)
      this.transactions =
        this.transactions.filter(t => t.id !== id)
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      this.pagination.page = 1
    },

    clearFilters() {
      this.filters = {
        search: null,
        type: null,
        category: null,
        startDate: null,
        endDate: null
      }
      this.pagination.page = 1
    },

    setPage(page) {
      this.pagination.page = page
    },

    // =========================
    // 🧹 CLEAR ON LOGOUT
    // =========================
    clear() {
      this.transactions = []
      this.currentTransaction = null
      this.pagination = {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
      }
    }
  }
})
