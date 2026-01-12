<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div class="col">
        <h5 class="q-my-none">Laporan Input Piring</h5>
        <p class="text-grey-7 q-mb-none">Laporan rekapitulasi jumlah piring per periode</p>
      </div>
      <div class="col-auto">
        <q-btn
          color="primary"
          icon="file_download"
          label="Export PDF"
          @click="exportPDF"
          :disable="!reportData"
          no-caps
        />
      </div>
    </div>

    <!-- Filter Section -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle1 q-mb-md">Filter Periode</div>
        <div class="row q-col-gutter-md items-end">
          <div class="col-12 col-sm-3">
            <q-select
              v-model="periodType"
              :options="periodOptions"
              label="Tipe Periode"
              outlined
              dense
              emit-value
              map-options
              @update:model-value="onPeriodChange"
            />
          </div>

          <template v-if="periodType === 'monthly'">
            <div class="col-12 col-sm-2">
              <q-input
                v-model.number="monthFilter.year"
                type="number"
                label="Tahun"
                outlined
                dense
              />
            </div>
            <div class="col-12 col-sm-2">
              <q-select
                v-model="monthFilter.month"
                :options="monthOptions"
                label="Bulan"
                outlined
                dense
                emit-value
                map-options
              />
            </div>
          </template>

          <template v-if="periodType === 'yearly'">
            <div class="col-12 col-sm-2">
              <q-input
                v-model.number="yearFilter"
                type="number"
                label="Tahun"
                outlined
                dense
              />
            </div>
          </template>

          <template v-if="periodType === 'custom'">
            <div class="col-12 col-sm-3">
              <q-input
                v-model="customRange.start"
                type="date"
                label="Tanggal Mulai"
                outlined
                dense
              />
            </div>
            <div class="col-12 col-sm-3">
              <q-input
                v-model="customRange.end"
                type="date"
                label="Tanggal Akhir"
                outlined
                dense
              />
            </div>
          </template>

          <div class="col-12 col-sm-2">
            <q-btn
              color="primary"
              icon="search"
              label="Generate"
              @click="fetchReport"
              :loading="loading"
              class="full-width"
              no-caps
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Summary Cards -->
    <div class="row q-col-gutter-md q-mb-md" v-if="reportData">
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="bg-blue-1">
          <q-card-section class="text-center">
            <div class="text-h4 text-primary">{{ formatNumber(reportData.totalPlates) }}</div>
            <div class="text-grey-7">Total Piring</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="bg-cyan-1">
          <q-card-section class="text-center">
            <div class="text-h6 text-cyan-9">{{ formatCurrency(reportData.totalTransfer) }}</div>
            <div class="text-grey-7">Transfer Pabrik</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="bg-green-1">
          <q-card-section class="text-center">
            <div class="text-h6 text-positive">{{ formatCurrency(reportData.netIncome) }}</div>
            <div class="text-grey-7">Penghasilan Bersih</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-6 col-md-3">
        <q-card flat bordered class="bg-orange-1">
          <q-card-section class="text-center">
            <div class="text-h6 text-warning">{{ formatCurrency(reportData.netReturn) }}</div>
            <div class="text-grey-7">Dikembalikan</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Additional Summary -->
    <div class="row q-col-gutter-md q-mb-md" v-if="reportData">
      <div class="col-12 col-sm-4">
        <q-card flat bordered class="bg-red-1">
          <q-card-section class="text-center">
            <div class="text-h6 text-negative">{{ formatCurrency(reportData.totalTax) }}</div>
            <div class="text-grey-7">Total Pajak (2%)</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-4">
        <q-card flat bordered class="bg-purple-1">
          <q-card-section class="text-center">
            <div class="text-h6 text-purple-9">{{ reportData.recordCount }}</div>
            <div class="text-grey-7">Jumlah Record</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-sm-4">
        <q-card flat bordered class="bg-teal-1">
          <q-card-section class="text-center">
            <div class="text-h6 text-teal-9">{{ formatCurrency(reportData.grossIncome) }}</div>
            <div class="text-grey-7">Penghasilan Kotor</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Daily Breakdown Table -->
    <q-card v-if="reportData && reportData.dailyBreakdown?.length > 0">
      <q-card-section>
        <div class="text-h6 q-mb-md">
          <q-icon name="table_chart" class="q-mr-sm" />
          Detail Per Hari
        </div>

        <q-table
          :rows="reportData.dailyBreakdown"
          :columns="breakdownColumns"
          row-key="date"
          flat
          bordered
          :pagination="{ rowsPerPage: 15 }"
        >
          <template v-slot:body-cell-date="props">
            <q-td :props="props">
              {{ formatDate(props.row.date) }}
            </q-td>
          </template>
          <template v-slot:body-cell-shifts="props">
            <q-td :props="props">
              <q-chip v-if="props.row.shifts?.siang" size="sm" color="orange" text-color="white">
                S: {{ props.row.shifts.siang.plateCount }}
              </q-chip>
              <q-chip v-if="props.row.shifts?.malam" size="sm" color="indigo" text-color="white" class="q-ml-xs">
                M: {{ props.row.shifts.malam.plateCount }}
              </q-chip>
            </q-td>
          </template>
          <template v-slot:body-cell-totalTransfer="props">
            <q-td :props="props">
              {{ formatCurrency(props.row.totalTransfer) }}
            </q-td>
          </template>
          <template v-slot:body-cell-netIncome="props">
            <q-td :props="props" class="text-positive">
              {{ formatCurrency(props.row.netIncome) }}
            </q-td>
          </template>
          <template v-slot:body-cell-netReturn="props">
            <q-td :props="props" class="text-warning">
              {{ formatCurrency(props.row.netReturn) }}
            </q-td>
          </template>
          <template v-slot:body-cell-totalTax="props">
            <q-td :props="props" class="text-negative">
              {{ formatCurrency(props.row.totalTax) }}
            </q-td>
          </template>

          <!-- Summary row -->
          <template v-slot:bottom-row>
            <q-tr class="bg-grey-2 text-weight-bold">
              <q-td colspan="2">TOTAL</q-td>
              <q-td class="text-center">{{ formatNumber(reportData.totalPlates) }}</q-td>
              <q-td>{{ formatCurrency(reportData.totalTransfer) }}</q-td>
              <q-td class="text-positive">{{ formatCurrency(reportData.netIncome) }}</q-td>
              <q-td class="text-warning">{{ formatCurrency(reportData.netReturn) }}</q-td>
              <q-td class="text-negative">{{ formatCurrency(reportData.totalTax) }}</q-td>
            </q-tr>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Empty State -->
    <q-card v-if="!loading && !reportData" class="text-center q-pa-xl">
      <q-icon name="analytics" size="64px" color="grey-5" />
      <div class="text-h6 text-grey-6 q-mt-md">Pilih periode dan klik Generate</div>
      <div class="text-grey-5">untuk melihat laporan input piring</div>
    </q-card>

    <q-card v-if="reportData && reportData.recordCount === 0" class="text-center q-pa-xl">
      <q-icon name="inbox" size="64px" color="grey-5" />
      <div class="text-h6 text-grey-6 q-mt-md">Tidak ada data</div>
      <div class="text-grey-5">untuk periode yang dipilih</div>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import reportService from 'src/services/report'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const $q = useQuasar()

// State
const loading = ref(false)
const reportData = ref(null)
const periodType = ref('monthly')
const monthFilter = ref({
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1
})
const yearFilter = ref(new Date().getFullYear())
const customRange = ref({
  start: '',
  end: ''
})

// Options
const periodOptions = [
  { label: 'Hari Ini', value: 'daily' },
  { label: 'Minggu', value: 'weekly' },
  { label: 'Bulan', value: 'monthly' },
  { label: 'Tahun', value: 'yearly' },
  { label: 'Custom', value: 'custom' }
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

const breakdownColumns = [
  { name: 'date', label: 'Tanggal', field: 'date', sortable: true },
  { name: 'shifts', label: 'Shift', field: 'shifts' },
  { name: 'totalPlates', label: 'Total Piring', field: 'totalPlates', sortable: true, align: 'center' },
  { name: 'totalTransfer', label: 'Transfer', field: 'totalTransfer' },
  { name: 'netIncome', label: 'Penghasilan', field: 'netIncome' },
  { name: 'netReturn', label: 'Dikembalikan', field: 'netReturn' },
  { name: 'totalTax', label: 'Pajak', field: 'totalTax' }
]

// Methods
function getDateRange() {
  const today = new Date()
  let startDate, endDate

  switch (periodType.value) {
    case 'daily':
      startDate = today.toISOString().split('T')[0]
      endDate = startDate
      break
    case 'weekly': {
      const dayOfWeek = today.getDay()
      const monday = new Date(today)
      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      startDate = monday.toISOString().split('T')[0]
      endDate = sunday.toISOString().split('T')[0]
      break
    }
    case 'monthly': {
      const firstDay = new Date(monthFilter.value.year, monthFilter.value.month - 1, 1)
      const lastDay = new Date(monthFilter.value.year, monthFilter.value.month, 0)
      startDate = firstDay.toISOString().split('T')[0]
      endDate = lastDay.toISOString().split('T')[0]
      break
    }
    case 'yearly': {
      startDate = `${yearFilter.value}-01-01`
      endDate = `${yearFilter.value}-12-31`
      break
    }
    case 'custom':
      startDate = customRange.value.start
      endDate = customRange.value.end
      break
    default:
      startDate = today.toISOString().split('T')[0]
      endDate = startDate
  }

  return { startDate, endDate }
}

function onPeriodChange() {
  reportData.value = null
}

async function fetchReport() {
  const { startDate, endDate } = getDateRange()

  if (!startDate || !endDate) {
    $q.notify({
      type: 'warning',
      message: 'Silakan pilih periode dengan lengkap'
    })
    return
  }

  loading.value = true
  try {
    reportData.value = await reportService.getPlateCountSummary(startDate, endDate)
  } catch (error) {
    console.error('Error fetching report:', error)
    $q.notify({
      type: 'negative',
      message: error || 'Gagal mengambil laporan'
    })
  } finally {
    loading.value = false
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0)
}

function formatNumber(value) {
  return new Intl.NumberFormat('id-ID').format(value || 0)
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

async function exportPDF() {
  if (!reportData.value) return

  try {
    const doc = new jsPDF()
    const { startDate, endDate } = getDateRange()

    // Header
    doc.setFontSize(18)
    doc.text('Laporan Input Piring', 14, 20)

    doc.setFontSize(10)
    doc.text(`Periode: ${formatDate(startDate)} - ${formatDate(endDate)}`, 14, 28)
    doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 34)

    // Summary
    doc.setFontSize(12)
    doc.text('Ringkasan:', 14, 44)

    const summaryData = [
      ['Total Piring', formatNumber(reportData.value.totalPlates)],
      ['Transfer Pabrik', formatCurrency(reportData.value.totalTransfer)],
      ['Penghasilan Kotor', formatCurrency(reportData.value.grossIncome)],
      ['Pajak Penghasilan', formatCurrency(reportData.value.incomeTax)],
      ['Penghasilan Bersih', formatCurrency(reportData.value.netIncome)],
      ['Dikembalikan Kotor', formatCurrency(reportData.value.grossReturn)],
      ['Pajak Pengembalian', formatCurrency(reportData.value.returnTax)],
      ['Dikembalikan Bersih', formatCurrency(reportData.value.netReturn)],
      ['Total Pajak', formatCurrency(reportData.value.totalTax)],
      ['Jumlah Record', reportData.value.recordCount.toString()]
    ]

    autoTable(doc, {
      startY: 48,
      head: [['Keterangan', 'Nilai']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
      margin: { left: 14 }
    })

    // Daily breakdown
    if (reportData.value.dailyBreakdown?.length > 0) {
      doc.text('Detail Per Hari:', 14, doc.lastAutoTable.finalY + 10)

      const dailyData = reportData.value.dailyBreakdown.map(day => {
        const shifts = []
        if (day.shifts?.siang) shifts.push(`S: ${day.shifts.siang.plateCount}`)
        if (day.shifts?.malam) shifts.push(`M: ${day.shifts.malam.plateCount}`)

        return [
          formatDate(day.date),
          shifts.join(', '),
          day.totalPlates.toString(),
          formatCurrency(day.totalTransfer),
          formatCurrency(day.netIncome),
          formatCurrency(day.netReturn)
        ]
      })

      // Add total row
      dailyData.push([
        'TOTAL',
        '',
        formatNumber(reportData.value.totalPlates),
        formatCurrency(reportData.value.totalTransfer),
        formatCurrency(reportData.value.netIncome),
        formatCurrency(reportData.value.netReturn)
      ])

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 14,
        head: [['Tanggal', 'Shift', 'Piring', 'Transfer', 'Penghasilan', 'Dikembalikan']],
        body: dailyData,
        theme: 'striped',
        headStyles: { fillColor: [52, 152, 219] },
        margin: { left: 14 },
        styles: { fontSize: 8 }
      })
    }

    // Save
    const fileName = `Laporan_Piring_${startDate}_${endDate}.pdf`
    doc.save(fileName)

    $q.notify({
      type: 'positive',
      message: 'PDF berhasil didownload'
    })
  } catch (error) {
    console.error('Error exporting PDF:', error)
    $q.notify({
      type: 'negative',
      message: 'Gagal export PDF'
    })
  }
}
</script>

<style scoped>
.q-card {
  border-radius: 8px;
}
</style>
