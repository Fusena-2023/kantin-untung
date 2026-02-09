<template>
  <q-page class="q-pa-sm q-pa-md-md">
    <q-pull-to-refresh @refresh="onRefresh">
      <div class="row q-mb-md items-center justify-between">
        <div class="col">
          <h5 class="text-h5 text-weight-bold text-primary q-ma-none">
            Dashboard {{ authStore.user?.role === 'pemilik' || authStore.user?.role === 1 ? 'Owner' : 'Staff' }}
          </h5>
          <div class="text-caption text-grey-7">
            Selamat datang, {{ authStore.user?.fullName || 'User' }}
          </div>
        </div>
        <div class="col-auto">
          <q-btn
            flat
            round
            dense
            color="primary"
            icon="refresh"
            @click="fetchData"
            :loading="reportStore.isLoading"
          >
            <q-tooltip>Refresh Data</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- Period Filter Transaction -->
      <div class="row items-center justify-between q-mb-md">
        <div class="text-subtitle1 text-weight-bold text-grey-8">Ringkasan Keuangan</div>
        
        <q-btn-dropdown
          color="white"
          text-color="primary"
          :label="periodFilterLabel"
          dense
          no-caps
          outline
          class="q-px-sm"
        >
          <q-list>
            <q-item clickable v-close-popup @click="setPeriodFilter('today')">
              <q-item-section>Hari Ini</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="setPeriodFilter('week')">
              <q-item-section>7 Hari Terakhir</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="setPeriodFilter('month')">
              <q-item-section>Bulan Ini</q-item-section>
            </q-item>
            <q-separator />
            <q-item clickable>
              <q-item-section>
                <q-item-label>Custom Tanggal</q-item-label>
                <div class="row q-col-gutter-xs q-mt-xs">
                   <q-input dense outlined v-model="customStartDate" type="date" class="col-6" />
                   <q-input dense outlined v-model="customEndDate" type="date" class="col-6" />
                </div>
                <q-btn 
                  label="Terapkan" 
                  color="primary" 
                  size="sm" 
                  class="q-mt-xs full-width" 
                  @click="setPeriodFilter('custom')" 
                  v-close-popup
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </div>

    <!-- Summary Cards -->
    <div class="row q-col-gutter-sm q-col-gutter-md-md q-mb-md">
      <div class="col-6 col-md-3">
        <q-card class="dashboard-card no-shadow border-left-positive">
          <q-card-section>
            <div class="row items-center no-wrap">
              <div class="col">
                <div class="text-caption text-grey-8 text-uppercase text-weight-bold">Pemasukan</div>
                <div class="text-h5 text-positive q-mt-xs q-mb-xs">{{ formatCurrency(currentPeriodData.income) }}</div>
                <div v-if="selectedPeriod === 'month'" class="text-caption" :class="profitTrend.incomeColor">
                  <q-icon :name="profitTrend.incomeIcon" size="12px" />
                  {{ profitTrend.incomePercent }}% bln lalu
                </div>
              </div>
              <div class="col-auto">
                <q-avatar color="green-1" text-color="positive" icon="trending_up" rounded size="md" />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-6 col-md-3">
        <q-card class="dashboard-card no-shadow border-left-negative">
          <q-card-section>
            <div class="row items-center no-wrap">
              <div class="col">
                <div class="text-caption text-grey-8 text-uppercase text-weight-bold">Pengeluaran</div>
                <div class="text-h5 text-negative q-mt-xs q-mb-xs">{{ formatCurrency(currentPeriodData.expense) }}</div>
                <div v-if="selectedPeriod === 'month'" class="text-caption" :class="profitTrend.expenseColor">
                  <q-icon :name="profitTrend.expenseIcon" size="12px" />
                  {{ profitTrend.expensePercent }}% bln lalu
                </div>
              </div>
              <div class="col-auto">
                <q-avatar color="red-1" text-color="negative" icon="trending_down" rounded size="md" />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-6 col-md-3">
        <q-card class="dashboard-card no-shadow border-left-primary">
          <q-card-section>
            <div class="row items-center no-wrap">
              <div class="col">
                <div class="text-caption text-grey-8 text-uppercase text-weight-bold">Keuntungan</div>
                <div class="text-h5 text-primary q-mt-xs q-mb-xs">{{ formatCurrency(currentPeriodData.profit) }}</div>
                <div v-if="selectedPeriod === 'month'" class="text-caption" :class="profitTrend.profitColor">
                  <q-icon :name="profitTrend.profitIcon" size="12px" />
                  {{ profitTrend.profitPercent }}% bln lalu
                </div>
              </div>
              <div class="col-auto">
                <q-avatar color="blue-1" text-color="primary" icon="account_balance_wallet" rounded size="md" />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div v-if="authStore.user?.role === 'pemilik'" class="col-6 col-md-3">
        <q-card class="dashboard-card no-shadow border-left-orange">
          <q-card-section>
            <div class="row items-center no-wrap">
              <div class="col">
                <div class="text-caption text-grey-8 text-uppercase text-weight-bold">Total Transaksi</div>
                <div class="text-h5 text-orange-9 q-mt-xs q-mb-xs">{{ currentPeriodData.transactions }}</div>
                <div class="text-caption text-grey-6">
                  {{ currentPeriodData.transactions }} transaksi
                </div>
              </div>
              <div class="col-auto">
                <q-avatar color="orange-1" text-color="orange-9" icon="receipt" rounded size="md" />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Catering Section & Filter (Pemilik Only) -->
      <template v-if="authStore.user?.role === 'pemilik'">
        <div class="col-12 q-mt-md">
          <div class="row items-center justify-between q-mb-sm">
            <div class="text-subtitle2 text-weight-bold text-grey-8">Ringkasan Catering</div>
            
            <!-- Catering Filter -->
            <q-btn-dropdown
              color="white"
              text-color="primary"
              :label="cateringFilterLabel"
              dense
              no-caps
              outline
              class="q-px-sm text-caption"
              size="sm"
            >
              <q-list>
                <q-item clickable v-close-popup @click="setCateringFilter('today')">
                  <q-item-section>Hari Ini</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="setCateringFilter('week')">
                  <q-item-section>Minggu Ini</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="setCateringFilter('month')">
                  <q-item-section>Bulan Ini</q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable>
                  <q-item-section>
                    <q-item-label>Custom Tanggal</q-item-label>
                    <div class="row q-col-gutter-xs q-mt-xs">
                       <q-input dense outlined v-model="cateringStartDate" type="date" class="col-6" />
                       <q-input dense outlined v-model="cateringEndDate" type="date" class="col-6" />
                    </div>
                    <q-btn 
                      label="Terapkan" 
                      color="primary" 
                      size="sm" 
                      class="q-mt-xs full-width" 
                      @click="setCateringFilter('custom')" 
                      v-close-popup
                    />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>
          </div>
        </div>

        <!-- Catering Summary Cards (only show when data exists) -->
        <template v-if="cateringData.totalPlates > 0">
          <!-- Pengembalian Bersih -->
          <div class="col-12 col-md-4">
            <q-card class="dashboard-card no-shadow border-left-orange">
              <q-card-section>
                <div class="row items-center no-wrap">
                  <div class="col">
                    <div class="text-caption text-grey-8 text-uppercase text-weight-bold">Pengembalian Bersih</div>
                    <div class="text-h5 text-orange-9 q-mt-xs q-mb-xs">
                      {{ formatCurrency(cateringData.totalNetReturn || 0) }}
                    </div>
                    <div class="text-caption text-orange-8">
                      Sudah dipotong pajak
                    </div>
                  </div>
                  <div class="col-auto">
                    <q-avatar color="orange-1" text-color="orange-9" icon="savings" rounded size="md" />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Transfer Pabrik -->
          <div class="col-12 col-md-4">
            <q-card class="dashboard-card no-shadow border-left-cyan">
              <q-card-section>
                <div class="row items-center no-wrap">
                  <div class="col">
                    <div class="text-caption text-grey-8 text-uppercase text-weight-bold">Transfer Pabrik</div>
                    <div class="text-h5 text-cyan-9 q-mt-xs q-mb-xs">
                      {{ formatCurrency(amountFromFactory) }}
                    </div>
                    <div class="text-caption text-cyan-8">
                      Nilai Piring - Pajak - Admin
                    </div>
                  </div>
                  <div class="col-auto">
                    <q-avatar color="cyan-1" text-color="cyan-9" icon="factory" rounded size="md" />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Penghasilan Bersih Final -->
          <div class="col-12 col-md-4">
            <q-card class="dashboard-card shadow-2 border-left-green-gradient">
              <q-card-section>
                <div class="row items-center no-wrap">
                  <div class="col">
                    <div class="text-caption text-green-10 text-uppercase text-weight-bold">Penghasilan Bersih Final</div>
                    <div class="text-h4 text-green-9 text-weight-bolder q-mt-xs q-mb-xs">
                      {{ formatCurrency(cateringData.finalNetIncome || 0) }}
                    </div>
                    <div class="text-caption text-green-8">
                      Total yang masuk ke kantong
                    </div>
                  </div>
                  <div class="col-auto">
                    <q-avatar class="bg-gradient-green text-white shadow-3" icon="check_circle" rounded size="lg" />
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </template>
      </template>
    </div>



    </q-pull-to-refresh>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useReportStore } from 'stores/report-store'
import { useAuthStore } from 'stores/auth-store'
import { plateCountService } from 'src/services/plateCount'
import { formatCurrency } from 'src/utils/format'

const reportStore = useReportStore()
const authStore = useAuthStore()

const dashboard = computed(() => reportStore.dashboard)
const selectedPeriod = ref('month')
const customStartDate = ref('')
const customEndDate = ref('')

const currentPeriodData = computed(() => {
  const data = dashboard.value
  const defaultCatering = {
    totalPlates: 0,
    amountFromFactory: 0,
    totalNetReturn: 0,
    finalNetIncome: 0
  }

  if (!data) return { income: 0, expense: 0, profit: 0, transactions: 0, catering: defaultCatering }

  switch (selectedPeriod.value) {
    case 'today':
      return {
        income: data.today?.income || 0,
        expense: data.today?.expense || 0,
        profit: data.today?.profit || 0,
        transactions: data.today?.transactions || 0,
        catering: data.today?.catering || defaultCatering
      }
    case 'week':
      // Sum last 7 days for transactions
      if (data.dailyData && Array.isArray(data.dailyData)) {
        const sum = data.dailyData.reduce((acc, day) => ({
          income: acc.income + (day.income || 0),
          expense: acc.expense + (day.expense || 0),
          profit: acc.profit + (day.profit || 0),
          count: acc.count + 1
        }), { income: 0, expense: 0, profit: 0, count: 0 })
        
        return {
          income: sum.income,
          expense: sum.expense,
          profit: sum.profit,
          transactions: sum.count,
          catering: defaultCatering // Not available for week yet
        }
      }
      return { income: 0, expense: 0, profit: 0, transactions: 0, catering: defaultCatering }
    case 'month':
      return {
        income: data.thisMonth?.income || 0,
        expense: data.thisMonth?.expense || 0,
        profit: data.thisMonth?.profit || 0,
        transactions: data.thisMonth?.transactions || 0,
        catering: data.thisMonth?.catering || defaultCatering
      }
    case 'custom':
      // Will be fetched separately
      return { income: 0, expense: 0, profit: 0, transactions: 0, catering: defaultCatering }
    default:
      return { income: 0, expense: 0, profit: 0, transactions: 0, catering: defaultCatering }
  }
})

// Previous month comparison
const profitTrend = computed(() => {
  const data = dashboard.value
  if (!data || selectedPeriod.value !== 'month') {
    return {
      incomePercent: 0,
      incomeIcon: 'trending_flat',
      incomeColor: 'text-grey-6',
      expensePercent: 0,
      expenseIcon: 'trending_flat',
      expenseColor: 'text-grey-6',
      profitPercent: 0,
      profitIcon: 'trending_flat',
      profitColor: 'text-grey-6'
    }
  }

  // Calculate previous month
  const prevMonthIncome = data.prevMonth?.income || data.thisMonth?.income || 1
  const prevMonthExpense = data.prevMonth?.expense || data.thisMonth?.expense || 1
  const prevMonthProfit = data.prevMonth?.profit || data.thisMonth?.profit || 1

  const currentIncome = data.thisMonth?.income || 0
  const currentExpense = data.thisMonth?.expense || 0
  const currentProfit = data.thisMonth?.profit || 0

  const incomePercent = prevMonthIncome ? Math.round(((currentIncome - prevMonthIncome) / prevMonthIncome) * 100) : 0
  const expensePercent = prevMonthExpense ? Math.round(((currentExpense - prevMonthExpense) / prevMonthExpense) * 100) : 0
  const profitPercent = prevMonthProfit ? Math.round(((currentProfit - prevMonthProfit) / prevMonthProfit) * 100) : 0

  return {
    incomePercent: Math.abs(incomePercent),
    incomeIcon: incomePercent >= 0 ? 'trending_up' : 'trending_down',
    incomeColor: incomePercent >= 0 ? 'text-positive' : 'text-negative',
    expensePercent: Math.abs(expensePercent),
    expenseIcon: expensePercent >= 0 ? 'trending_up' : 'trending_down',
    expenseColor: expensePercent >= 0 ? 'text-negative' : 'text-positive',
    profitPercent: Math.abs(profitPercent),
    profitIcon: profitPercent >= 0 ? 'trending_up' : 'trending_down',
    profitColor: profitPercent >= 0 ? 'text-positive' : 'text-negative'
  }
})

const onRefresh = async (done) => {
  await Promise.all([fetchData(), fetchCateringData()])
  done()
}

const onPeriodChange = async () => {
  await fetchData()
}

const setPeriodFilter = (val) => {
  selectedPeriod.value = val
  if (val !== 'custom') { // For custom, we wait for 'Terapkan' button
     onPeriodChange()
  }
}

const periodFilterLabel = computed(() => {
  switch (selectedPeriod.value) {
    case 'today': return 'Hari Ini'
    case 'week': return '7 Hari Terakhir'
    case 'month': return 'Bulan Ini'
    case 'custom': 
       if (!customStartDate.value) return 'Custom'
       return new Date(customStartDate.value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ' - ' + new Date(customEndDate.value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  }
  return 'Filter Transaksi'
})

// --- Catering Logic (Separated) ---
const cateringFilter = ref('month') // Default filter catering
const cateringStartDate = ref('')
const cateringEndDate = ref('')
const cateringData = ref({
  totalPlates: 0,
  totalTransfer: 0,
  totalNetReturn: 0,
  totalNetIncome: 0,
  finalNetIncome: 0,
  totalTax: 0,
  totalAdminFee: 0
})

const cateringFilterLabel = computed(() => {
  switch (cateringFilter.value) {
    case 'today': return 'Hari Ini'
    case 'week': return 'Minggu Ini'
    case 'month': return 'Bulan Ini'
    case 'custom': 
       if (!cateringStartDate.value) return 'Custom'
       return new Date(cateringStartDate.value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ' - ' + new Date(cateringEndDate.value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  }
  return 'Filter'
})

// Amount from Factory calculation (needs manual calc if not provided by backend directly in same structure)
const amountFromFactory = computed(() => {
  // Logic same as PlateCountPage: Transfer - Tax - Admin
  return (cateringData.value.totalTransfer || 0) - (cateringData.value.totalTax || 0) - (cateringData.value.totalAdminFee || 0)
})

const setCateringFilter = (val) => {
  cateringFilter.value = val
  // Auto set dates for predefined
  if (val === 'today') {
    const d = new Date().toISOString().split('T')[0]
    cateringStartDate.value = d
    cateringEndDate.value = d
    fetchCateringData()
  } else if (val === 'week') {
    // Current week (Monday to Sunday)
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
    const monday = new Date(d.setDate(diff))
    const sunday = new Date(d.setDate(monday.getDate() + 6))
    cateringStartDate.value = monday.toISOString().split('T')[0]
    cateringEndDate.value = sunday.toISOString().split('T')[0]
    fetchCateringData()
  } else if (val === 'month') {
    const d = new Date()
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1)
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    cateringStartDate.value = firstDay.toISOString().split('T')[0]
    cateringEndDate.value = lastDay.toISOString().split('T')[0]
    fetchCateringData()
  } else if (val === 'custom') {
    if (cateringStartDate.value && cateringEndDate.value) {
      fetchCateringData()
    }
  }
}

const fetchCateringData = async () => {
  if (authStore.user?.role !== 'pemilik' && authStore.user?.role !== 1) return

  try {
    const params = {
      startDate: cateringStartDate.value,
      endDate: cateringEndDate.value
    }
    const response = await plateCountService.getSummary(params) // Used existing functionality
    cateringData.value = response.data
  } catch (err) {
    console.error('Failed to fetch catering data:', err)
  }
}

const fetchData = async () => {
  try {
    await reportStore.fetchDashboard()
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
  }
}


onMounted(() => {
  fetchData()
  // Initialize catering filter dates
  setCateringFilter('month')
})
</script>

<style scoped>
/* Helper Classes */
.letter-spacing-1 {
  letter-spacing: 1px;
}

.lh-tight {
  line-height: 1.2;
}

/* Summary Cards */
.summary-card {
  border-radius: 8px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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

.avatar-catering {
  background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
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

/* Category Table */
.category-table {
  background: white;
}

.category-table :deep(.q-table__card) {
  box-shadow: none;
}

.category-table :deep(th) {
  background-color: #f5f5f5;
  font-weight: 600;
  color: #424242;
}

.category-table :deep(td) {
  padding: 12px 8px;
}

.category-table :deep(tbody tr:hover) {
  background-color: #fafafa;
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

/* Dashboard Cards - Matching PlateCountPage */
.dashboard-card {
  border-radius: 12px;
  background-color: white;
  transition: all 0.3s ease;
}

.dashboard-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}

.border-left-positive {
  border-left: 4px solid #21BA45;
}

.border-left-negative {
  border-left: 4px solid #C10015;
}

.border-left-primary {
  border-left: 4px solid #1976D2;
}

.border-left-orange {
  border-left: 4px solid #F57C00;
}

.border-left-cyan {
  border-left: 4px solid #00BCD4;
}

.border-left-green-gradient {
  border-left: 4px solid #43A047;
}

.bg-gradient-green {
  background: linear-gradient(135deg, #43A047 0%, #66BB6A 100%);
}

</style>
