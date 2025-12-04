<template>
  <q-page class="q-pa-md">
    <div class="row q-mb-lg items-center">
      <div class="col">
        <h4 class="text-h4 q-ma-none">Laporan Keuangan</h4>
        <p class="text-subtitle1 text-grey-7">
          Analisis dan laporan keuangan kantin
        </p>
      </div>
      <div class="col-auto">
        <q-btn
          color="primary"
          icon="file_download"
          label="Export PDF"
          @click="exportReport"
        />
      </div>
    </div>

    <!-- Filter Section -->
    <q-card class="q-mb-lg">
      <q-card-section>
        <div class="text-h6 q-mb-md">Filter Laporan</div>
        <div class="row q-gutter-md">
          <q-select
            v-model="reportType"
            label="Tipe Laporan"
            outlined
            :options="reportTypeOptions"
            emit-value
            map-options
            class="col-12 col-md-3"
            @update:model-value="fetchReport"
          />

          <q-input
            v-model="dateRange.from"
            label="Tanggal Mulai"
            type="date"
            outlined
            class="col-12 col-md-2"
            v-show="reportType === 'range'"
          />

          <q-input
            v-model="dateRange.to"
            label="Tanggal Akhir"
            type="date"
            outlined
            class="col-12 col-md-2"
            v-show="reportType === 'range'"
          />

          <q-input
            v-model="monthFilter.year"
            label="Tahun"
            type="number"
            outlined
            class="col-12 col-md-2"
            v-show="reportType === 'monthly'"
          />

          <q-select
            v-model="monthFilter.month"
            label="Bulan"
            outlined
            :options="monthOptions"
            emit-value
            map-options
            class="col-12 col-md-2"
            v-show="reportType === 'monthly'"
          />

          <div class="col-12 col-md-1">
            <q-btn
              color="primary"
              icon="search"
              label="Generate"
              @click="fetchReport"
              class="full-width"
              :loading="reportStore.isLoading"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Summary Cards -->
    <div class="row q-gutter-lg q-mb-lg" v-if="currentReport">
      <div class="col-12 col-md-3">
        <q-card class="bg-positive text-white">
          <q-card-section>
            <div class="text-h6">Total Pemasukan</div>
            <div class="text-h4">{{ formatCurrency(currentReport.summary?.totalIncome || 0) }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card class="bg-negative text-white">
          <q-card-section>
            <div class="text-h6">Total Pengeluaran</div>
            <div class="text-h4">{{ formatCurrency(currentReport.summary?.totalExpense || 0) }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card class="bg-info text-white">
          <q-card-section>
            <div class="text-h6">Keuntungan</div>
            <div class="text-h4">{{ formatCurrency(currentReport.summary?.profit || 0) }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card class="bg-warning text-white">
          <q-card-section>
            <div class="text-h6">Total Transaksi</div>
            <div class="text-h4">{{ currentReport.summary?.totalTransactions || 0 }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="row q-gutter-lg q-mb-lg" v-if="currentReport">
      <!-- Category Breakdown -->
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">Breakdown per Kategori</div>
            <q-list v-if="currentReport.byCategory?.length">
              <q-item v-for="category in currentReport.byCategory" :key="category.category">
                <q-item-section>
                  <q-item-label>{{ category.category }}</q-item-label>
                  <q-item-label caption>{{ category.count }} transaksi</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-item-label class="text-positive" v-if="category.income > 0">
                    +{{ formatCurrency(category.income) }}
                  </q-item-label>
                  <q-item-label class="text-negative" v-if="category.expense > 0">
                    -{{ formatCurrency(category.expense) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
            <div v-else class="text-center text-grey-5 q-py-lg">
              Belum ada data
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Daily Data (for monthly report) -->
      <div class="col-12 col-md-6" v-if="reportType === 'monthly' && currentReport.dailyData">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">Data Harian</div>
            <q-scroll-area style="height: 300px">
              <q-list>
                <q-item v-for="day in currentReport.dailyData.slice(0, 10)" :key="day.date">
                  <q-item-section>
                    <q-item-label>{{ formatDateOnly(day.date) }}</q-item-label>
                    <q-item-label caption>{{ day.count }} transaksi</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label :class="day.profit >= 0 ? 'text-positive' : 'text-negative'">
                      {{ day.profit >= 0 ? '+' : '' }}{{ formatCurrency(day.profit) }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-scroll-area>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Transactions Table -->
    <q-card v-if="currentReport?.transactions">
      <q-card-section>
        <div class="text-h6 q-mb-md">Detail Transaksi</div>
        <q-table
          :rows="currentReport.transactions"
          :columns="transactionColumns"
          row-key="id"
          :pagination="{ rowsPerPage: 10 }"
        >
          <template v-slot:body-cell-type="props">
            <q-td :props="props">
              <q-chip
                :color="props.value === 'masuk' ? 'positive' : 'negative'"
                text-color="white"
                :label="props.value === 'masuk' ? 'Pemasukan' : 'Pengeluaran'"
              />
            </q-td>
          </template>

          <template v-slot:body-cell-amount="props">
            <q-td :props="props">
              <span :class="props.row.type === 'masuk' ? 'text-positive' : 'text-negative'">
                {{ props.row.type === 'masuk' ? '+' : '-' }}{{ formatCurrency(props.value) }}
              </span>
            </q-td>
          </template>

          <template v-slot:body-cell-transactionDate="props">
            <q-td :props="props">
              {{ formatDate(props.value) }}
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- No Data State -->
    <q-card v-if="!currentReport && !reportStore.isLoading">
      <q-card-section class="text-center q-py-xl">
        <q-icon name="assessment" size="64px" color="grey-5" class="q-mb-md" />
        <div class="text-h6 text-grey-7">Pilih tipe laporan untuk melihat data</div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useReportStore } from 'stores/report-store'
import { formatCurrency, formatDate, formatDateOnly } from 'src/utils/format'

const $q = useQuasar()
const reportStore = useReportStore()

const reportType = ref('')
const dateRange = reactive({
  from: '',
  to: ''
})

const monthFilter = reactive({
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1
})

const reportTypeOptions = [
  { label: 'Laporan Harian', value: 'daily' },
  { label: 'Laporan Bulanan', value: 'monthly' },
  { label: 'Periode Kustom', value: 'range' }
]

const monthOptions = [
  { label: 'Januari', value: 1 },
  { label: 'Februari', value: 2 },
  { label: 'Maret', value: 3 },
  { label: 'April', value: 4 },
  { label: 'Mei', value: 5 },
  { label: 'Juni', value: 6 },
  { label: 'Juli', value: 7 },
  { label: 'Agustus', value: 8 },
  { label: 'September', value: 9 },
  { label: 'Oktober', value: 10 },
  { label: 'November', value: 11 },
  { label: 'Desember', value: 12 }
]

const transactionColumns = [
  {
    name: 'transactionDate',
    label: 'Tanggal',
    align: 'left',
    field: 'transactionDate',
    sortable: true
  },
  {
    name: 'type',
    label: 'Tipe',
    align: 'center',
    field: 'type'
  },
  {
    name: 'description',
    label: 'Deskripsi',
    align: 'left',
    field: 'description'
  },
  {
    name: 'category',
    label: 'Kategori',
    align: 'left',
    field: 'category'
  },
  {
    name: 'amount',
    label: 'Jumlah',
    align: 'right',
    field: 'amount'
  },
  {
    name: 'user',
    label: 'Dibuat oleh',
    align: 'left',
    field: row => row.user?.fullName || '-'
  }
]

const currentReport = computed(() => {
  switch (reportType.value) {
    case 'daily':
      return reportStore.dailyReport
    case 'monthly':
      return reportStore.monthlyReport
    case 'range':
      return reportStore.rangeReport
    default:
      return null
  }
})

const fetchReport = async () => {
  if (!reportType.value) return

  try {
    switch (reportType.value) {
      case 'daily':
        await reportStore.fetchDailyReport()
        break
      case 'monthly':
        await reportStore.fetchMonthlyReport(monthFilter.year, monthFilter.month)
        break
      case 'range':
        if (dateRange.from && dateRange.to) {
          await reportStore.fetchRangeReport(dateRange.from, dateRange.to)
        } else {
          $q.notify({
            color: 'warning',
            message: 'Pilih tanggal mulai dan akhir',
            icon: 'warning'
          })
          return
        }
        break
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error,
      icon: 'warning'
    })
  }
}

const exportReport = () => {
  $q.notify({
    color: 'info',
    message: 'Fitur export sedang dalam pengembangan',
    icon: 'info'
  })
}

// Initialize with today's date for range
const today = new Date().toISOString().split('T')[0]
dateRange.from = today
dateRange.to = today

// Watch for month filter changes
watch([() => monthFilter.year, () => monthFilter.month], () => {
  if (reportType.value === 'monthly') {
    fetchReport()
  }
})
</script>
