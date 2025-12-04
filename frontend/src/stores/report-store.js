import { defineStore } from 'pinia'
import ReportService from 'src/services/report'

export const useReportStore = defineStore('report', {
  state: () => ({
    dashboard: null,
    dailyReport: null,
    monthlyReport: null,
    rangeReport: null,
    isLoading: false
  }),

  getters: {
    todayProfit: (state) => state.dashboard?.today?.profit || 0,
    monthProfit: (state) => state.dashboard?.thisMonth?.profit || 0,
    todayIncome: (state) => state.dashboard?.today?.income || 0,
    todayExpense: (state) => state.dashboard?.today?.expense || 0
  },

  actions: {
    async fetchDashboard() {
      this.isLoading = true
      try {
        this.dashboard = await ReportService.getDashboard()
      } finally {
        this.isLoading = false
      }
    },

    async fetchDailyReport(date) {
      this.isLoading = true
      try {
        this.dailyReport = await ReportService.getDailyReport(date)
      } finally {
        this.isLoading = false
      }
    },

    async fetchMonthlyReport(year, month) {
      this.isLoading = true
      try {
        this.monthlyReport = await ReportService.getMonthlyReport(year, month)
      } finally {
        this.isLoading = false
      }
    },

    async fetchRangeReport(startDate, endDate) {
      this.isLoading = true
      try {
        this.rangeReport = await ReportService.getRangeReport(startDate, endDate)
      } finally {
        this.isLoading = false
      }
    }
  }
})
