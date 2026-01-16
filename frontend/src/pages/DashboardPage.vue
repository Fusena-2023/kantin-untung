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
        <q-card flat bordered class="summary-card bg-green-1 full-height">
          <q-card-section class="q-pa-sm q-pa-md-md">
            <div class="row items-center q-mb-xs">
              <q-icon name="trending_up" size="18px" color="positive" class="q-mr-xs" />
              <div class="text-caption text-grey-7 ellipsis">Pemasukan</div>
            </div>
            <div class="text-subtitle1 text-md-h5 text-positive text-weight-bold">{{ formatCurrency(currentPeriodData.income) }}</div>
            <div v-if="selectedPeriod === 'month'" class="text-caption q-mt-xs ellipsis" :class="profitTrend.incomeColor" style="font-size: 10px;">
              <q-icon :name="profitTrend.incomeIcon" size="12px" />
              {{ profitTrend.incomePercent }}% bln lalu
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-6 col-md-3">
        <q-card flat bordered class="summary-card bg-red-1 full-height">
          <q-card-section class="q-pa-sm q-pa-md-md">
            <div class="row items-center q-mb-xs">
              <q-icon name="trending_down" size="18px" color="negative" class="q-mr-xs" />
              <div class="text-caption text-grey-7 ellipsis">Pengeluaran</div>
            </div>
            <div class="text-subtitle1 text-md-h5 text-negative text-weight-bold">{{ formatCurrency(currentPeriodData.expense) }}</div>
            <div v-if="selectedPeriod === 'month'" class="text-caption q-mt-xs ellipsis" :class="profitTrend.expenseColor" style="font-size: 10px;">
              <q-icon :name="profitTrend.expenseIcon" size="12px" />
              {{ profitTrend.expensePercent }}% bln lalu
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-6 col-md-3">
        <q-card flat bordered class="summary-card bg-blue-1 full-height">
          <q-card-section class="q-pa-sm q-pa-md-md">
            <div class="row items-center q-mb-xs">
              <q-icon name="account_balance_wallet" size="18px" color="primary" class="q-mr-xs" />
              <div class="text-caption text-grey-7 ellipsis">Keuntungan</div>
            </div>
            <div class="text-subtitle1 text-md-h5 text-primary text-weight-bold">{{ formatCurrency(currentPeriodData.profit) }}</div>
            <div v-if="selectedPeriod === 'month'" class="text-caption q-mt-xs ellipsis" :class="profitTrend.profitColor" style="font-size: 10px;">
              <q-icon :name="profitTrend.profitIcon" size="12px" />
              {{ profitTrend.profitPercent }}% bln lalu
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div v-if="authStore.user?.role === 'pemilik'" class="col-6 col-md-3">
        <q-card flat bordered class="summary-card bg-orange-1 full-height">
          <q-card-section class="q-pa-sm q-pa-md-md">
            <div class="row items-center q-mb-xs">
              <q-icon name="receipt" size="18px" color="orange" class="q-mr-xs" />
              <div class="text-caption text-grey-7 ellipsis">Total Transaksi</div>
            </div>
            <div class="text-subtitle1 text-md-h5 text-orange-9 text-weight-bold">{{ currentPeriodData.transactions }}</div>
            <div class="text-caption q-mt-xs text-grey-6 ellipsis" style="font-size: 10px;">
              {{ currentPeriodData.transactions }} transaksi
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

        <!-- Total Piring -->
        <div class="col-6 col-md-3">
          <q-card flat bordered class="summary-card bg-deep-orange-1 full-height">
            <q-card-section class="q-pa-sm q-pa-md-md">
              <div class="row items-center q-mb-xs">
                <q-icon name="dinner_dining" size="18px" color="deep-orange" class="q-mr-xs" />
                <div class="text-caption text-grey-7 ellipsis">Total Piring</div>
              </div>
              <div class="text-subtitle1 text-md-h5 text-deep-orange-9 text-weight-bold">{{ cateringData.totalPlates?.toLocaleString('id-ID') || 0 }}</div>
              <div class="text-caption q-mt-xs text-grey-6 ellipsis" style="font-size: 10px;">
                Terjual
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Jumlah Ditransfer Pabrik -->
        <div class="col-6 col-md-3">
          <q-card flat bordered class="summary-card bg-cyan-1 full-height">
            <q-card-section class="q-pa-sm q-pa-md-md">
              <div class="row items-center q-mb-xs">
                <q-icon name="payments" size="18px" color="cyan" class="q-mr-xs" />
                <div class="text-caption text-grey-7 ellipsis">Transfer Pabrik</div>
              </div>
              <div class="text-subtitle1 text-md-h5 text-cyan-9 text-weight-bold">{{ formatCurrency(amountFromFactory) }}</div>
              <div class="text-caption q-mt-xs text-grey-6 ellipsis" style="font-size: 10px;">
                -Pajak -Admin
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Pengembalian Bersih -->
        <div class="col-6 col-md-3">
          <q-card flat bordered class="summary-card bg-indigo-1 full-height">
            <q-card-section class="q-pa-sm q-pa-md-md">
              <div class="row items-center q-mb-xs">
                <q-icon name="savings" size="18px" color="indigo" class="q-mr-xs" />
                <div class="text-caption text-grey-7 ellipsis">Return Bersih</div>
              </div>
              <div class="text-subtitle1 text-md-h5 text-indigo-9 text-weight-bold">{{ formatCurrency(cateringData.totalNetReturn || 0) }}</div>
              <div class="text-caption q-mt-xs text-grey-6 ellipsis" style="font-size: 10px;">
                Total return
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Penghasilan Bersih Final -->
        <div class="col-6 col-md-3">
          <q-card flat bordered class="summary-card bg-teal-1 full-height">
            <q-card-section class="q-pa-sm q-pa-md-md">
              <div class="row items-center q-mb-xs">
                <q-icon name="account_balance" size="18px" color="teal" class="q-mr-xs" />
                <div class="text-caption text-grey-7 ellipsis">Penghasilan</div>
              </div>
              <div class="text-subtitle1 text-md-h5 text-teal-9 text-weight-bold">{{ formatCurrency(cateringData.finalNetIncome || 0) }}</div>
              <div class="text-caption q-mt-xs text-grey-6 ellipsis" style="font-size: 10px;">
                Final - Admin
              </div>
            </q-card-section>
          </q-card>
        </div>
      </template>
    </div>

    <!-- Grafik Pemasukan vs Pengeluaran (Collapsible) -->
    <q-expansion-item
      class="shadow-1 overflow-hidden q-mb-md rounded-borders bg-white"
      icon="show_chart"
      label="Tren Keuangan 7 Hari Terakhir"
      header-class="bg-grey-2 text-grey-9 text-weight-bold"
      default-opened
    >
      <q-card flat>
        <q-card-section class="q-pa-md bg-grey-1">
          <div class="row items-center justify-end">
            <div class="q-gutter-xs">
              <q-btn-group outline>
                <q-btn 
                  :color="chartFilter === 'all' ? 'primary' : 'grey-5'" 
                  :outline="chartFilter !== 'all'"
                  label="Semua" 
                  size="sm" 
                  no-caps 
                  @click="chartFilter = 'all'"
                />
                <q-btn 
                  :color="chartFilter === 'transaction' ? 'primary' : 'grey-5'" 
                  :outline="chartFilter !== 'transaction'"
                  label="Transaksi" 
                  size="sm" 
                  no-caps 
                  @click="chartFilter = 'transaction'"
                />
                <q-btn 
                  :color="chartFilter === 'catering' ? 'primary' : 'grey-5'" 
                  :outline="chartFilter !== 'catering'"
                  label="Catering" 
                  size="sm" 
                  no-caps 
                  @click="chartFilter = 'catering'"
                />
              </q-btn-group>
            </div>
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
    </q-expansion-item>

    <!-- Content Area with Modern Layout -->
    <div class="row q-col-gutter-sm q-col-gutter-md-md">
      <!-- Main Content (Full width on mobile, 8 cols on desktop) -->
      <div class="col-12 col-md-8">
        <!-- Breakdown per Kategori (Collapsible) -->
        <q-expansion-item
          class="shadow-1 overflow-hidden q-mb-md rounded-borders bg-white"
          icon="category"
          label="Breakdown per Kategori"
          header-class="bg-grey-2 text-grey-9 text-weight-bold"
          default-opened
        >
          <q-card flat>
            <q-card-section class="q-pa-none">
              <q-table
                v-if="categoryBreakdown.length"
                :rows="categoryBreakdown"
                :columns="categoryColumns"
                row-key="category"
                flat
                bordered
                no-data-label="Belum ada data kategori"
                class="category-table"
              >
                <template v-slot:body-cell-pemasukan="props">
                  <q-td :props="props" class="text-positive text-weight-bold">
                    {{ formatCurrency(props.row.income) }}
                  </q-td>
                </template>
                <template v-slot:body-cell-pengeluaran="props">
                  <q-td :props="props" class="text-negative text-weight-bold">
                    {{ formatCurrency(props.row.expense) }}
                  </q-td>
                </template>
              </q-table>
              <div v-else class="text-center text-grey-5 q-py-xl">
                <q-icon name="category" size="64px" class="q-mb-md" />
                <div class="text-subtitle1">Belum ada data kategori</div>
              </div>
            </q-card-section>
          </q-card>
        </q-expansion-item>

        <!-- Transaksi Terbaru (Collapsible) -->
        <q-expansion-item
          class="shadow-1 overflow-hidden q-mb-md rounded-borders bg-white"
          icon="history"
          label="Transaksi Terbaru"
          header-class="bg-grey-2 text-grey-9 text-weight-bold"
          default-opened
        >
          <q-card flat>
            <q-card-section class="q-pa-none">
              <q-list v-if="dashboard?.recentTransactions?.length" separator class="transaction-list">
                <q-item
                  v-for="transaction in dashboard.recentTransactions"
                  :key="transaction.id + '-' + transaction.type"
                  class="q-pa-md"
                >
                  <q-item-section avatar>
                    <q-avatar
                      size="48px"
                      :class="transaction.type === 'catering' ? 'avatar-catering' : (transaction.activityType === 'masuk' ? 'avatar-income' : 'avatar-expense')"
                      text-color="white"
                    >
                      <q-icon
                        :name="transaction.type === 'catering' ? 'restaurant' : (transaction.activityType === 'masuk' ? 'trending_up' : 'trending_down')"
                        size="24px"
                      />
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="text-subtitle1 text-weight-medium">
                      {{ transaction.description || 'Tidak ada deskripsi' }}
                    </q-item-label>
                    <q-item-label caption class="text-body2 text-grey-7">
                      <q-icon name="label" size="14px" class="q-mr-xs" />
                      {{ transaction.category }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side class="text-right">
                    <q-item-label
                      class="text-h6 text-weight-bold"
                      :class="transaction.type === 'catering' ? 'text-cyan-9' : (transaction.activityType === 'masuk' ? 'text-positive' : 'text-negative')"
                    >
                      {{ transaction.activityType === 'masuk' ? '+' : '-' }}{{ formatCurrency(transaction.amount) }}
                    </q-item-label>
                    <q-item-label caption class="text-grey-6">
                      <q-icon name="schedule" size="14px" class="q-mr-xs" />
                      {{ formatDate(transaction.date || transaction.created_at) }}
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
        </q-expansion-item>
      </div>

      <!-- Sidebar Content (Full width on mobile, 4 cols on desktop) -->
      <div class="col-12 col-md-4">
        <!-- Ringkasan Bulanan (Collapsible) -->
        <q-expansion-item
          class="shadow-1 overflow-hidden q-mb-md rounded-borders bg-white"
          icon="calendar_month"
          label="Ringkasan Bulanan"
          header-class="bg-grey-2 text-grey-9 text-weight-bold"
          default-opened
        >
          <q-card flat>
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
        </q-expansion-item>
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
import { plateCountService } from 'src/services/plateCount' // Import plateCountService directly
import { formatCurrency, formatDate } from 'src/utils/format'
import { Chart, registerables } from 'chart.js'

// Register all Chart.js components
Chart.register(...registerables)

const reportStore = useReportStore()
const authStore = useAuthStore()
const chartCanvas = ref(null)
let chartInstance = null

const dashboard = computed(() => reportStore.dashboard)
const selectedPeriod = ref('month')
const chartFilter = ref('all') // 'all', 'transaction', 'catering'
const customStartDate = ref('')
const customEndDate = ref('')

// Category table columns
const categoryColumns = [
  { name: 'kategori', label: 'Kategori', field: 'category', align: 'left' },
  { name: 'jumlah', label: 'Jumlah', field: 'count', align: 'center' },
  { name: 'pemasukan', label: 'Pemasukan', field: 'income', align: 'right' },
  { name: 'pengeluaran', label: 'Pengeluaran', field: 'expense', align: 'right' }
]

// Get current period data
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

// Category breakdown
const categoryBreakdown = computed(() => {
  const data = dashboard.value
  if (!data || !data.byCategory) return []
  // Filter out catering from this table as requested
  return data.byCategory.filter(c => c.category !== 'Catering')
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
  const cateringData = dailyData.map(d => d.catering || 0)

  console.log('Rendering chart with data:', { labels, incomeData, expenseData, cateringData })
  
  const datasets = []

  // Dataset Income (Transaction)
  if (chartFilter.value === 'all' || chartFilter.value === 'transaction') {
    datasets.push({
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
    })
    
    datasets.push({
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
    })
  }

  // Dataset Catering
  if (chartFilter.value === 'all' || chartFilter.value === 'catering') {
    datasets.push({
      label: 'Catering (Net)',
      data: cateringData,
      borderColor: '#06b6d4', // Cyan
      backgroundColor: 'rgba(6, 182, 212, 0.1)',
      borderWidth: 3,
      tension: 0.4,
      fill: true,
      pointRadius: 5,
      pointHoverRadius: 7,
      pointBackgroundColor: '#06b6d4',
      pointBorderColor: '#fff',
      pointBorderWidth: 2
    })
  }

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets
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

// Watch for chart filter
watch(chartFilter, () => {
  if (dashboard.value?.dailyData) {
    nextTick(() => renderChart())
  }
})

// Watch for dashboard data changes
watch(() => dashboard.value?.dailyData, () => {
  nextTick(() => renderChart())
}, { deep: true })

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
</style>
