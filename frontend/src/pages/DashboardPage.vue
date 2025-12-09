<template>
  <q-page class="q-pa-sm q-pa-md-md">
    <q-pull-to-refresh @refresh="onRefresh">
      <div class="row q-mb-md items-center justify-between">
        <div class="col">
          <h4 class="text-h5 text-h4-md q-ma-none">
            Selamat Datang, {{ authStore.user?.fullName || authStore.user?.username }}!
          </h4>
          <p class="text-caption text-body2-md text-grey-6 q-mb-none">
            Berikut ringkasan keuangan kantin hari ini
          </p>
        </div>
        <div class="col-auto gt-xs">
          <q-btn
            color="primary"
            icon="refresh"
            label="Refresh"
            @click="fetchData"
            :loading="reportStore.isLoading"
            no-caps
          />
        </div>
      </div>

    <!-- Summary Cards -->
    <div class="row q-col-gutter-sm q-col-gutter-md-md q-mb-md">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="gradient-card gradient-green text-white">
          <q-card-section class="q-pa-sm q-pa-md-md">
            <div class="text-subtitle2 text-h6-md">Pemasukan Hari Ini</div>
            <div class="text-h5 text-h4-md">{{ formatCurrency(reportStore.todayIncome) }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="gradient-card gradient-red text-white">
          <q-card-section class="q-pa-sm q-pa-md-md">
            <div class="text-subtitle2 text-h6-md">Pengeluaran Hari Ini</div>
            <div class="text-h5 text-h4-md">{{ formatCurrency(reportStore.todayExpense) }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="gradient-card gradient-blue text-white">
          <q-card-section class="q-pa-sm q-pa-md-md">
            <div class="text-subtitle2 text-h6-md">Keuntungan Hari Ini</div>
            <div class="text-h5 text-h4-md">{{ formatCurrency(reportStore.todayProfit) }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div v-if="authStore.user?.role === 'pemilik'" class="col-12 col-sm-6 col-md-3">
        <q-card class="gradient-card gradient-orange text-white">
          <q-card-section class="q-pa-sm q-pa-md-md">
            <div class="text-subtitle2 text-h6-md">Total User</div>
            <div class="text-h5 text-h4-md">{{ dashboard?.users?.total || 0 }}</div>
            <div class="text-caption">{{ dashboard?.users?.active || 0 }} aktif</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Grafik Pemasukan vs Pengeluaran -->
    <q-card class="modern-card q-mb-md">
      <q-card-section class="q-pa-sm q-pa-md-md card-header gradient-header-success">
        <div class="text-subtitle1 text-h6-md text-weight-medium text-white">
          <q-icon name="show_chart" class="q-mr-sm" />
          Tren Keuangan 7 Hari Terakhir
        </div>
      </q-card-section>
      <q-card-section class="q-pa-md">
        <div v-if="dashboard?.dailyData?.length" style="position: relative; height: 300px;">
          <canvas ref="chartCanvas"></canvas>
        </div>
        <div v-else class="text-center text-grey-5 q-py-xl">
          <q-icon name="timeline" size="64px" class="q-mb-md" />
          <div class="text-subtitle1">Belum ada data grafik</div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Content Area with Modern Layout -->
    <div class="row q-col-gutter-sm q-col-gutter-md-md">
      <!-- Main Content (Full width on mobile, 8 cols on desktop) -->
      <div class="col-12 col-md-8">
        <!-- Transaksi Terbaru -->
        <q-card class="modern-card q-mb-md">
          <q-card-section class="q-pa-sm q-pa-md-md card-header gradient-header">
            <div class="text-subtitle1 text-h6-md text-weight-medium text-white">
              <q-icon name="history" class="q-mr-sm" />
              Transaksi Terbaru
            </div>
          </q-card-section>
          <q-card-section class="q-pa-none">
            <q-list v-if="dashboard?.recentTransactions?.length" separator class="transaction-list">
              <q-item
                v-for="transaction in dashboard.recentTransactions"
                :key="transaction.id"
                class="q-pa-md"
              >
                <q-item-section avatar>
                  <q-avatar
                    size="48px"
                    :class="transaction.type === 'masuk' ? 'avatar-income' : 'avatar-expense'"
                    text-color="white"
                  >
                    <q-icon
                      :name="transaction.type === 'masuk' ? 'trending_up' : 'trending_down'"
                      size="24px"
                    />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-subtitle1 text-weight-medium">
                    {{ transaction.description }}
                  </q-item-label>
                  <q-item-label caption class="text-body2 text-grey-7">
                    <q-icon name="label" size="14px" class="q-mr-xs" />
                    {{ transaction.category }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side class="text-right">
                  <q-item-label
                    class="text-h6 text-weight-bold"
                    :class="transaction.type === 'masuk' ? 'text-positive' : 'text-negative'"
                  >
                    {{ transaction.type === 'masuk' ? '+' : '-' }}{{ formatCurrency(transaction.amount) }}
                  </q-item-label>
                  <q-item-label caption class="text-grey-6">
                    <q-icon name="schedule" size="14px" class="q-mr-xs" />
                    {{ formatDate(transaction.created_at) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
            <div v-else class="text-center text-grey-5 q-py-xl">
              <q-icon name="inbox" size="64px" class="q-mb-md" />
              <div class="text-subtitle1">Belum ada transaksi</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Sidebar Content (Full width on mobile, 4 cols on desktop) -->
      <div class="col-12 col-md-4">
        <!-- Ringkasan Bulanan -->
        <q-card class="modern-card q-mb-md">
          <q-card-section class="q-pa-sm q-pa-md-md card-header gradient-header-alt">
            <div class="text-subtitle1 text-h6-md text-weight-medium text-white">
              <q-icon name="calendar_month" class="q-mr-sm" />
              Ringkasan Bulanan
            </div>
          </q-card-section>
          <q-card-section class="q-pa-md">
            <div class="summary-item q-mb-md">
              <div class="row items-center q-mb-xs">
                <q-icon name="arrow_upward" color="positive" size="20px" class="q-mr-xs" />
                <span class="text-caption text-grey-7">Pemasukan</span>
              </div>
              <div class="text-h5 text-positive text-weight-bold">
                {{ formatCurrency(dashboard?.thisMonth?.income || 0) }}
              </div>
            </div>
            <q-separator class="q-my-md" />
            <div class="summary-item q-mb-md">
              <div class="row items-center q-mb-xs">
                <q-icon name="arrow_downward" color="negative" size="20px" class="q-mr-xs" />
                <span class="text-caption text-grey-7">Pengeluaran</span>
              </div>
              <div class="text-h5 text-negative text-weight-bold">
                {{ formatCurrency(dashboard?.thisMonth?.expense || 0) }}
              </div>
            </div>
            <q-separator class="q-my-md" />
            <div class="summary-item">
              <div class="row items-center q-mb-xs">
                <q-icon name="account_balance_wallet" color="info" size="20px" class="q-mr-xs" />
                <span class="text-caption text-grey-7">Keuntungan</span>
              </div>
              <div class="text-h5 text-info text-weight-bold">
                {{ formatCurrency(dashboard?.thisMonth?.profit || 0) }}
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    </q-pull-to-refresh>

    <!-- Floating Action Button -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn
        fab
        icon="add"
        color="primary"
        to="/app/transactions/create"
        class="fab-button"
        size="lg"
      >
        <q-tooltip
          anchor="center left"
          self="center right"
          :offset="[10, 0]"
          class="bg-primary text-subtitle2"
        >
          Tambah Transaksi Baru
        </q-tooltip>
      </q-btn>
    </q-page-sticky>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch, nextTick } from 'vue'
import { useReportStore } from 'stores/report-store'
import { useAuthStore } from 'stores/auth-store'
import { formatCurrency, formatDate } from 'src/utils/format'
import { Chart, registerables } from 'chart.js'

// Register all Chart.js components
Chart.register(...registerables)

const reportStore = useReportStore()
const authStore = useAuthStore()
const chartCanvas = ref(null)
let chartInstance = null

const dashboard = computed(() => reportStore.dashboard)

const onRefresh = async (done) => {
  await fetchData()
  done()
}

const fetchData = async () => {
  try {
    await reportStore.fetchDashboard()
    await nextTick()
    renderChart()
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
  }
}

const renderChart = () => {
  if (!chartCanvas.value || !dashboard.value?.dailyData?.length) {
    console.log('Chart render skipped:', {
      hasCanvas: !!chartCanvas.value,
      hasData: !!dashboard.value?.dailyData?.length,
      data: dashboard.value?.dailyData
    })
    return
  }

  // Destroy existing chart
  if (chartInstance) {
    chartInstance.destroy()
  }

  const ctx = chartCanvas.value.getContext('2d')
  const dailyData = dashboard.value.dailyData // Don't reverse, backend already sends in correct order

  const labels = dailyData.map(d => {
    const date = new Date(d.date)
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
  })

  const incomeData = dailyData.map(d => d.income || 0)
  const expenseData = dailyData.map(d => d.expense || 0)

  console.log('Rendering chart with data:', { labels, incomeData, expenseData })

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Pemasukan',
          data: incomeData,
          borderColor: '#38ef7d',
          backgroundColor: 'rgba(56, 239, 125, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#38ef7d',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        },
        {
          label: 'Pengeluaran',
          data: expenseData,
          borderColor: '#ff6a00',
          backgroundColor: 'rgba(255, 106, 0, 0.1)',
          borderWidth: 3,
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#ff6a00',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: {
              size: 12,
              weight: '500'
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          cornerRadius: 8,
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          },
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || ''
              if (label) {
                label += ': '
              }
              label += formatCurrency(context.parsed.y)
              return label
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              if (value === 0) return 'Rp 0'
              return 'Rp ' + (value / 1000000).toFixed(1) + 'jt'
            },
            font: {
              size: 11
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 11
            }
          }
        }
      }
    }
  })

  console.log('Chart instance created:', chartInstance)
}

// Watch for dashboard data changes
watch(() => dashboard.value?.dailyData, () => {
  nextTick(() => renderChart())
}, { deep: true })

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.gradient-card {
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
  min-height: 120px;
  display: flex;
  flex-direction: column;
}

.gradient-card .q-card__section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.gradient-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.gradient-green {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.gradient-red {
  background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%);
}

.gradient-blue {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.gradient-orange {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

/* Modern Card Styling */
.modern-card {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.modern-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.card-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.gradient-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.gradient-header-alt {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.gradient-header-accent {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.gradient-header-success {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

/* Transaction List */
.transaction-list .q-item {
  transition: background-color 0.2s;
}

.transaction-list .q-item:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.avatar-income {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.avatar-expense {
  background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%);
}

/* Summary Items */
.summary-item {
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.summary-item:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

/* Floating Action Button */
.fab-button {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fab-button:hover {
  transform: scale(1.1) rotate(90deg);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
}

.fab-button:active {
  transform: scale(0.95);
}
</style>
