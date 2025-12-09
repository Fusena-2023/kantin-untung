<template>
  <q-page class="q-pa-sm q-pa-md-md">
    <q-pull-to-refresh @refresh="onRefresh">
      <div class="row q-mb-md items-center justify-between">
        <div class="col">
          <h4 class="text-h5 text-h4-md q-ma-none">Laporan Keuangan</h4>
          <p class="text-caption text-body2-md text-grey-6 q-mb-none">
            Analisis dan laporan keuangan kantin
          </p>
        </div>
        <div class="col-auto gt-xs">
          <q-btn
            color="primary"
            icon="file_download"
            label="Export PDF"
            @click="exportReport"
            no-caps
          />
        </div>
      </div>

    <!-- Filter Section -->
    <q-card class="modern-card q-mb-md">
      <q-card-section class="q-pa-sm q-pa-md-md">
        <div class="text-subtitle1 text-h6-md q-mb-sm q-mb-md-md text-weight-medium">Filter Laporan</div>
        <div class="row q-col-gutter-sm q-col-gutter-md-md">
          <q-select
            v-model="reportType"
            label="Tipe Laporan"
            outlined
            dense
            :options="reportTypeOptions"
            emit-value
            map-options
            class="col-12 col-md-4"
            @update:model-value="fetchReport"
          />

          <q-input
            v-model="dateRange.from"
            label="Tanggal Mulai"
            type="date"
            outlined
            dense
            class="col-12 col-md-3"
            v-show="reportType === 'range'"
          />

          <q-input
            v-model="dateRange.to"
            label="Tanggal Akhir"
            type="date"
            outlined
            dense
            class="col-12 col-md-3"
            v-show="reportType === 'range'"
          />

          <q-input
            v-model="monthFilter.year"
            label="Tahun"
            type="number"
            outlined
            dense
            class="col-12 col-md-3"
            v-show="reportType === 'monthly'"
          />

          <q-select
            v-model="monthFilter.month"
            label="Bulan"
            outlined
            dense
            :options="monthOptions"
            emit-value
            map-options
            class="col-12 col-md-3"
            v-show="reportType === 'monthly'"
          />

          <div class="col-12 col-md-2">
            <q-btn
              color="primary"
              icon="search"
              label="Generate"
              @click="fetchReport"
              class="full-width"
              :loading="reportStore.isLoading"
              no-caps
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Summary Cards -->
    <div class="row q-col-gutter-sm q-col-gutter-md-md q-mb-md" v-if="currentReport">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="gradient-card gradient-green text-white">
          <q-card-section class="q-pa-sm q-pa-md-md">
            <div class="text-subtitle2 text-h6-md">Total Pemasukan</div>
            <div class="text-h5 text-h4-md">{{ formatCurrency(currentReport.summary?.totalIncome || 0) }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="gradient-card gradient-red text-white">
          <q-card-section class="q-pa-sm q-pa-md-md">
            <div class="text-subtitle2 text-h6-md">Total Pengeluaran</div>
            <div class="text-h5 text-h4-md">{{ formatCurrency(currentReport.summary?.totalExpense || 0) }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="gradient-card gradient-blue text-white">
          <q-card-section class="q-pa-sm q-pa-md-md">
            <div class="text-subtitle2 text-h6-md">Keuntungan</div>
            <div class="text-h5 text-h4-md">{{ formatCurrency(currentReport.summary?.profit || 0) }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="gradient-card gradient-orange text-white">
          <q-card-section class="q-pa-sm q-pa-md-md">
            <div class="text-subtitle2 text-h6-md">Total Transaksi</div>
            <div class="text-h5 text-h4-md">{{ currentReport.summary?.totalTransactions || 0 }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="row q-col-gutter-sm q-col-gutter-md-md q-mb-md" v-if="currentReport">
      <!-- Category Breakdown -->
      <div class="col-12 col-md-6">
        <q-card class="modern-card">
          <q-card-section class="q-pa-sm q-pa-md-md">
            <div class="text-subtitle1 text-h6-md q-mb-md text-weight-medium">Breakdown per Kategori</div>
            <q-list v-if="currentReport.byCategory?.length" separator>
              <q-item v-for="category in currentReport.byCategory" :key="category.category" class="q-pa-sm">
                <q-item-section>
                  <q-item-label class="text-weight-medium">{{ category.category }}</q-item-label>
                  <q-item-label caption>{{ category.count }} transaksi</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-item-label class="text-positive text-weight-bold" v-if="category.income > 0">
                    +{{ formatCurrency(category.income) }}
                  </q-item-label>
                  <q-item-label class="text-negative text-weight-bold" v-if="category.expense > 0">
                    -{{ formatCurrency(category.expense) }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
            <div v-else class="text-center text-grey-5 q-py-xl">
              <q-icon name="category" size="48px" class="q-mb-sm" />
              <div>Belum ada data</div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Daily Data (for monthly report) -->
      <div class="col-12 col-md-6" v-if="reportType === 'monthly' && currentReport.dailyData">
        <q-card class="modern-card">
          <q-card-section class="q-pa-sm q-pa-md-md">
            <div class="text-subtitle1 text-h6-md q-mb-md text-weight-medium">Data Harian</div>
            <q-scroll-area style="height: 300px">
              <q-list separator>
                <q-item v-for="day in currentReport.dailyData.slice(0, 10)" :key="day.date" class="q-pa-sm">
                  <q-item-section>
                    <q-item-label class="text-weight-medium">{{ formatDateOnly(day.date) }}</q-item-label>
                    <q-item-label caption>{{ day.count }} transaksi</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label :class="day.profit >= 0 ? 'text-positive' : 'text-negative'" class="text-weight-bold">
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
    <q-card class="modern-card" v-if="currentReport?.transactions">
      <q-card-section class="q-pa-sm q-pa-md-md">
        <div class="text-subtitle1 text-h6-md q-mb-md text-weight-medium">Detail Transaksi</div>

        <!-- Desktop Table View -->
        <q-table
          :rows="currentReport.transactions"
          :columns="transactionColumns"
          row-key="id"
          :pagination="{ rowsPerPage: 10 }"
          class="gt-xs"
        >
          <template v-slot:body-cell-type="props">
            <q-td :props="props">
              <q-chip
                :color="props.value === 'masuk' ? 'positive' : 'negative'"
                text-color="white"
                :label="props.value === 'masuk' ? 'Pemasukan' : 'Pengeluaran'"
                size="sm"
              />
            </q-td>
          </template>

          <template v-slot:body-cell-amount="props">
            <q-td :props="props">
              <span :class="props.row.type === 'masuk' ? 'text-positive' : 'text-negative'" class="text-weight-bold">
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

        <!-- Mobile Card View -->
        <div class="lt-sm">
          <div class="q-gutter-sm">
            <q-card
              v-for="transaction in currentReport.transactions"
              :key="transaction.id"
              bordered
              flat
            >
              <q-card-section class="q-pa-sm">
                <div class="row items-center q-mb-xs">
                  <div class="col">
                    <q-chip
                      :color="transaction.type === 'masuk' ? 'positive' : 'negative'"
                      text-color="white"
                      size="sm"
                      dense
                    >
                      {{ transaction.type === 'masuk' ? 'Pemasukan' : 'Pengeluaran' }}
                    </q-chip>
                  </div>
                  <div class="col-auto">
                    <span
                      class="text-weight-bold"
                      :class="transaction.type === 'masuk' ? 'text-positive' : 'text-negative'"
                    >
                      {{ transaction.type === 'masuk' ? '+' : '-' }}{{ formatCurrency(transaction.amount) }}
                    </span>
                  </div>
                </div>

                <div class="text-body2 text-weight-medium q-mb-xs">
                  {{ transaction.description }}
                </div>

                <div class="row q-col-gutter-xs text-caption text-grey-7">
                  <div class="col-auto">
                    <q-icon name="category" size="xs" class="q-mr-xs" />
                    {{ transaction.category }}
                  </div>
                  <div class="col-auto">
                    <q-icon name="event" size="xs" class="q-mr-xs" />
                    {{ formatDate(transaction.transactionDate) }}
                  </div>
                  <div class="col-auto" v-if="transaction.user">
                    <q-icon name="person" size="xs" class="q-mr-xs" />
                    {{ transaction.user.fullName }}
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- No Data State -->
    <q-card class="modern-card" v-if="!currentReport && !reportStore.isLoading">
      <q-card-section class="text-center q-py-xl">
        <q-icon name="assessment" size="64px" color="grey-5" class="q-mb-md" />
        <div class="text-h6 text-grey-7">Pilih tipe laporan untuk melihat data</div>
      </q-card-section>
    </q-card>

    </q-pull-to-refresh>

    <!-- Floating Action Button (Mobile Only) -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]" class="lt-sm">
      <q-btn
        fab
        icon="file_download"
        color="primary"
        @click="exportReport"
        class="fab-button"
        size="lg"
      >
        <q-tooltip
          anchor="center left"
          self="center right"
          :offset="[10, 0]"
          class="bg-primary text-subtitle2"
        >
          Export PDF
        </q-tooltip>
      </q-btn>
    </q-page-sticky>
  </q-page>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useReportStore } from 'stores/report-store'
import { formatCurrency, formatDate, formatDateOnly } from 'src/utils/format'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

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

const onRefresh = async (done) => {
  await fetchReport()
  done()
}

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
  if (!currentReport.value) {
    $q.notify({
      color: 'warning',
      message: 'Tidak ada data untuk di-export',
      icon: 'warning'
    })
    return
  }

  try {
    const doc = new jsPDF()

    // Set font (default)
    doc.setFontSize(18)
    doc.text('Laporan Keuangan Kantin Untung', 14, 20)

    // Report info
    doc.setFontSize(10)
    let reportTitle = ''
    if (reportType.value === 'daily') {
      reportTitle = 'Laporan Harian - ' + formatDateOnly(new Date())
    } else if (reportType.value === 'monthly') {
      const monthName = monthOptions.find(m => m.value === monthFilter.month)?.label
      reportTitle = `Laporan Bulanan - ${monthName} ${monthFilter.year}`
    } else if (reportType.value === 'range') {
      reportTitle = `Laporan Periode - ${formatDateOnly(dateRange.from)} s/d ${formatDateOnly(dateRange.to)}`
    }
    doc.text(reportTitle, 14, 28)
    doc.text(`Dicetak pada: ${formatDate(new Date())}`, 14, 34)

    // Summary section
    doc.setFontSize(12)
    doc.text('Ringkasan:', 14, 44)

    const summaryData = [
      ['Total Pemasukan', formatCurrency(currentReport.value.summary?.totalIncome || 0)],
      ['Total Pengeluaran', formatCurrency(currentReport.value.summary?.totalExpense || 0)],
      ['Keuntungan', formatCurrency(currentReport.value.summary?.profit || 0)],
      ['Total Transaksi', (currentReport.value.summary?.totalTransactions || 0).toString()]
    ]

    autoTable(doc, {
      startY: 48,
      head: [['Keterangan', 'Nilai']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      margin: { left: 14 }
    })

    // Category breakdown
    if (currentReport.value.byCategory?.length) {
      doc.text('Breakdown per Kategori:', 14, doc.lastAutoTable.finalY + 10)

      const categoryData = currentReport.value.byCategory.map(cat => [
        cat.category,
        cat.count.toString(),
        cat.income > 0 ? formatCurrency(cat.income) : '-',
        cat.expense > 0 ? formatCurrency(cat.expense) : '-'
      ])

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 14,
        head: [['Kategori', 'Jumlah', 'Pemasukan', 'Pengeluaran']],
        body: categoryData,
        theme: 'striped',
        headStyles: { fillColor: [52, 152, 219] },
        margin: { left: 14 }
      })
    }

    // Transactions table
    if (currentReport.value.transactions?.length) {
      // Add new page if needed
      if (doc.lastAutoTable.finalY > 200) {
        doc.addPage()
      }

      doc.text('Detail Transaksi:', 14, doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 100)

      const transactionData = currentReport.value.transactions.map(tr => [
        formatDateOnly(tr.transactionDate),
        tr.type === 'masuk' ? 'Pemasukan' : 'Pengeluaran',
        tr.description,
        tr.category,
        formatCurrency(tr.amount),
        tr.user?.fullName || '-'
      ])

      autoTable(doc, {
        startY: doc.lastAutoTable ? doc.lastAutoTable.finalY + 14 : 104,
        head: [['Tanggal', 'Tipe', 'Deskripsi', 'Kategori', 'Jumlah', 'User']],
        body: transactionData,
        theme: 'striped',
        headStyles: { fillColor: [46, 204, 113] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 25 },
          2: { cellWidth: 40 },
          3: { cellWidth: 30 },
          4: { cellWidth: 30 },
          5: { cellWidth: 30 }
        }
      })
    }

    // Save PDF
    const fileName = `Laporan_${reportType.value}_${new Date().getTime()}.pdf`
    doc.save(fileName)

    $q.notify({
      color: 'positive',
      message: 'Laporan berhasil di-export',
      icon: 'check_circle'
    })
  } catch (error) {
    console.error('Export error:', error)
    $q.notify({
      color: 'negative',
      message: 'Gagal export laporan: ' + error.message,
      icon: 'error'
    })
  }
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
