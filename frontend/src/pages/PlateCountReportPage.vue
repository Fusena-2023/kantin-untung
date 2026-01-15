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
        <div class="row q-col-gutter-md items-center">
          <!-- Quick Week Selector -->
          <div class="col-auto">
            <q-btn-dropdown
              color="primary"
              :label="'Minggu ' + selectedWeekNumber"
              dense
              outline
            >
              <q-list>
                <q-item clickable v-close-popup @click="selectWeek(0)">
                  <q-item-section>
                    <q-item-label>Minggu Ini</q-item-label>
                    <q-item-label caption>{{ getWeekDateRange(0) }}</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="selectWeek(-1)">
                  <q-item-section>
                    <q-item-label>Minggu Lalu</q-item-label>
                    <q-item-label caption>{{ getWeekDateRange(-1) }}</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="selectWeek(-2)">
                  <q-item-section>
                    <q-item-label>2 Minggu Lalu</q-item-label>
                    <q-item-label caption>{{ getWeekDateRange(-2) }}</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="selectWeek(-3)">
                  <q-item-section>
                    <q-item-label>3 Minggu Lalu</q-item-label>
                    <q-item-label caption>{{ getWeekDateRange(-3) }}</q-item-label>
                  </q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="selectWeek(-4)">
                  <q-item-section>
                    <q-item-label>4 Minggu Lalu</q-item-label>
                    <q-item-label caption>{{ getWeekDateRange(-4) }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-btn-dropdown>
          </div>

          <div class="col-auto text-grey-5">|</div>

          <!-- Manual Date Range -->
          <div class="col-12 col-sm-3">
            <q-input
              v-model="customRange.start"
              type="date"
              label="Dari (Senin)"
              outlined
              dense
            />
          </div>
          <div class="col-12 col-sm-3">
            <q-input
              v-model="customRange.end"
              type="date"
              label="Sampai (Minggu)"
              outlined
              dense
            />
          </div>

          <div class="col-12 col-sm-2">
            <q-btn
              color="primary"
              icon="search"
              label="Generate"
              @click="fetchReport"
              :loading="loading"
              no-caps
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Loading State -->
    <div v-if="loading" class="text-center q-pa-xl">
      <q-spinner-dots color="primary" size="40px" />
      <p class="q-mt-md text-grey-7">Memuat data...</p>
    </div>

    <!-- Report Content -->
    <template v-else-if="reportData">
      <!-- Summary Cards -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-md-2">
          <q-card flat bordered class="bg-blue-1">
            <q-card-section class="text-center">
              <div class="text-subtitle2 text-grey-7">Total Piring</div>
              <div class="text-h5 text-primary">{{ reportData.totalPlates?.toLocaleString('id-ID') }}</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-2">
          <q-card flat bordered class="bg-indigo-1">
            <q-card-section class="text-center">
              <div class="text-subtitle2 text-grey-7">SGP</div>
              <div class="text-h5 text-indigo">{{ reportData.totalSgpCount?.toLocaleString('id-ID') }}</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-2">
          <q-card flat bordered class="bg-purple-1">
            <q-card-section class="text-center">
              <div class="text-subtitle2 text-grey-7">Hirose</div>
              <div class="text-h5 text-purple">{{ reportData.totalHiroseCount?.toLocaleString('id-ID') }}</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-2">
          <q-card flat bordered class="bg-green-1">
            <q-card-section class="text-center">
              <div class="text-subtitle2 text-grey-7">Nilai Piring</div>
              <div class="text-h6 text-positive">{{ formatCurrency(reportData.totalTransfer) }}</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-2">
          <q-card flat bordered class="bg-teal-1">
            <q-card-section class="text-center">
              <div class="text-subtitle2 text-grey-7">Penghasilan Kotor</div>
              <div class="text-h6 text-teal">{{ formatCurrency(reportData.totalNetIncome) }}</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- PENGEMBALIAN BERSIH - Card Utama -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12">
          <q-card class="bg-orange-2" style="border: 3px solid #FB8C00;">
            <q-card-section class="text-center q-py-lg">
              <q-icon name="savings" size="36px" color="orange-9" class="q-mb-sm" />
              <div class="text-subtitle1 text-orange-9 text-weight-medium">PENGEMBALIAN BERSIH</div>
              <div class="text-h3 text-orange-10 text-weight-bold">{{ formatCurrency(reportData.totalNetReturn) }}</div>
              <div class="text-caption text-orange-8">
                Pajak: {{ formatCurrency(reportData.totalReturnTax || (reportData.totalNetReturn * 0.02 / 0.98)) }}
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Admin Fee and Final Income Cards -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-md-3">
          <q-card flat bordered class="bg-red-1">
            <q-card-section class="text-center">
              <div class="text-subtitle2 text-grey-7">Admin Transfer Bank</div>
              <div class="text-h6 text-negative">- {{ formatCurrency(reportData.totalAdminFee) }}</div>
              <div class="text-caption text-grey-6">
                {{ reportData.weekCount }} minggu × Rp 2.900
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-3">
          <q-card flat bordered class="bg-deep-purple-1">
            <q-card-section class="text-center">
              <div class="text-subtitle2 text-grey-7">Total Pajak (2%)</div>
              <div class="text-h6 text-deep-purple">{{ formatCurrency(reportData.totalTax) }}</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-6">
          <q-card flat bordered class="bg-cyan-1">
            <q-card-section class="text-center">
              <div class="text-subtitle1 text-grey-7">Jumlah Ditransfer Pabrik</div>
              <div class="text-h4 text-cyan text-weight-bold">{{ formatCurrency(amountFromFactory) }}</div>
              <div class="text-caption text-grey-6">
                Nilai Piring - Pajak - Admin = {{ formatCurrency(reportData.totalTransfer) }} - {{ formatCurrency(reportData.totalTax) }} - {{ formatCurrency(reportData.totalAdminFee) }}
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Penghasilan Bersih -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12">
          <q-card flat bordered class="bg-light-green-2">
            <q-card-section class="text-center">
              <div class="text-subtitle1 text-grey-7">Penghasilan Bersih</div>
              <div class="text-h4 text-positive text-weight-bold">{{ formatCurrency(reportData.finalNetIncome) }}</div>
              <div class="text-caption text-grey-6">
                Penghasilan kotor - Admin transfer bank
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Breakdown by Shift -->
      <q-card class="q-mb-md">
        <q-card-section>
          <div class="text-subtitle1 q-mb-md">Ringkasan Per Shift</div>
          <q-table
            :rows="shiftSummaryRows"
            :columns="shiftColumns"
            row-key="shift"
            flat
            bordered
            hide-bottom
          >
            <template #body-cell-shift="props">
              <q-td :props="props">
                <q-chip
                  :color="getShiftColor(props.row.shift)"
                  text-color="white"
                  dense
                >
                  {{ getShiftLabel(props.row.shift) }}
                </q-chip>
              </q-td>
            </template>
            <template #body-cell-sgpCount="props">
              <q-td :props="props" class="text-indigo text-weight-medium">
                {{ props.row.sgpCount?.toLocaleString('id-ID') }}
              </q-td>
            </template>
            <template #body-cell-hiroseCount="props">
              <q-td :props="props" class="text-purple text-weight-medium">
                {{ props.row.hiroseCount?.toLocaleString('id-ID') }}
              </q-td>
            </template>
            <template #body-cell-totalPlates="props">
              <q-td :props="props" class="text-primary text-weight-bold">
                {{ props.row.totalPlates?.toLocaleString('id-ID') }}
              </q-td>
            </template>
            <template #body-cell-totalNetIncome="props">
              <q-td :props="props" class="text-teal">
                {{ formatCurrency(props.row.totalNetIncome) }}
              </q-td>
            </template>
            <template #body-cell-totalNetReturn="props">
              <q-td :props="props" class="text-orange">
                {{ formatCurrency(props.row.totalNetReturn) }}
              </q-td>
            </template>
          </q-table>
        </q-card-section>
      </q-card>

      <!-- Daily Breakdown with Shift Details -->
      <q-card>
        <q-card-section>
          <div class="text-subtitle1 q-mb-md">Detail Per Tanggal</div>
          <q-table
            :rows="groupedDailyData"
            :columns="dailyColumns"
            row-key="id"
            flat
            bordered
            :pagination="{ rowsPerPage: 50 }"
            hide-header
          >
            <!-- Custom header -->
            <template #top-row>
              <q-tr class="bg-grey-2">
                <q-th class="text-left">Tanggal / Shift</q-th>
                <q-th class="text-center">SGP</q-th>
                <q-th class="text-center">Hirose</q-th>
                <q-th class="text-center">Total</q-th>
                <q-th class="text-right">Transfer</q-th>
                <q-th class="text-right">Penghasilan</q-th>
                <q-th class="text-right">Pengembalian</q-th>
                <q-th class="text-right">Pajak</q-th>
              </q-tr>
            </template>

            <template #body="props">
              <!-- Date Group Header -->
              <q-tr v-if="props.row.isGroupHeader" class="bg-blue-1">
                <q-td colspan="8" class="text-weight-bold">
                  <q-icon name="event" class="q-mr-sm" />
                  {{ formatDate(props.row.date) }}
                  <q-badge color="primary" class="q-ml-sm">
                    {{ props.row.totalPlates }} piring
                  </q-badge>
                </q-td>
              </q-tr>

              <!-- Shift Data Row -->
              <q-tr v-else-if="props.row.isShiftRow" class="bg-grey-1">
                <q-td class="q-pl-lg">
                  <q-chip
                    :color="getShiftColor(props.row.shift)"
                    text-color="white"
                    dense
                    size="sm"
                  >
                    {{ getShiftLabel(props.row.shift) }}
                  </q-chip>
                </q-td>
                <q-td class="text-center text-indigo">
                  {{ props.row.sgpCount?.toLocaleString('id-ID') || 0 }}
                </q-td>
                <q-td class="text-center text-purple">
                  {{ props.row.hiroseCount?.toLocaleString('id-ID') || 0 }}
                </q-td>
                <q-td class="text-center text-primary text-weight-medium">
                  {{ props.row.totalPlates?.toLocaleString('id-ID') || 0 }}
                </q-td>
                <q-td class="text-right text-positive">
                  {{ formatCurrency(props.row.totalTransfer) }}
                </q-td>
                <q-td class="text-right text-teal">
                  {{ formatCurrency(props.row.totalNetIncome) }}
                </q-td>
                <q-td class="text-right text-orange">
                  {{ formatCurrency(props.row.totalNetReturn) }}
                </q-td>
                <q-td class="text-right text-grey-7">
                  {{ formatCurrency(props.row.totalTax) }}
                </q-td>
              </q-tr>

              <!-- Date Subtotal Row -->
              <q-tr v-else class="bg-grey-3">
                <q-td class="text-weight-bold q-pl-lg">
                  Subtotal
                </q-td>
                <q-td class="text-center text-indigo text-weight-bold">
                  {{ props.row.totalSgpCount?.toLocaleString('id-ID') }}
                </q-td>
                <q-td class="text-center text-purple text-weight-bold">
                  {{ props.row.totalHiroseCount?.toLocaleString('id-ID') }}
                </q-td>
                <q-td class="text-center text-primary text-weight-bold">
                  {{ props.row.totalPlates?.toLocaleString('id-ID') }}
                </q-td>
                <q-td class="text-right text-positive text-weight-bold">
                  {{ formatCurrency(props.row.totalTransfer) }}
                </q-td>
                <q-td class="text-right text-teal text-weight-bold">
                  {{ formatCurrency(props.row.totalNetIncome) }}
                </q-td>
                <q-td class="text-right text-orange text-weight-bold">
                  {{ formatCurrency(props.row.totalNetReturn) }}
                </q-td>
                <q-td class="text-right text-grey-7 text-weight-bold">
                  {{ formatCurrency(props.row.totalTax) }}
                </q-td>
              </q-tr>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </template>

    <!-- Empty State -->
    <div v-else class="text-center q-pa-xl">
      <q-icon name="assessment" size="64px" color="grey-5" />
      <p class="q-mt-md text-grey-7">Pilih periode dan klik "Generate" untuk melihat laporan</p>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import plateCountService from 'src/services/plateCount'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const $q = useQuasar()

// Week selector helper functions
function getMondayOfWeek(date, weekOffset = 0) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + (weekOffset * 7)
  d.setDate(diff)
  return d
}

function getSundayOfWeek(date, weekOffset = 0) {
  const monday = getMondayOfWeek(date, weekOffset)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return sunday
}

function getWeekNumber(date) {
  const d = new Date(date)
  const oneJan = new Date(d.getFullYear(), 0, 1)
  const dayOfYear = Math.floor((d - oneJan) / 86400000) + 1
  return Math.ceil((dayOfYear + oneJan.getDay()) / 7)
}

function getWeekDateRange(weekOffset) {
  const monday = getMondayOfWeek(new Date(), weekOffset)
  const sunday = getSundayOfWeek(new Date(), weekOffset)
  const format = (d) => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  return `${format(monday)} - ${format(sunday)}`
}

function selectWeek(weekOffset) {
  const monday = getMondayOfWeek(new Date(), weekOffset)
  const sunday = getSundayOfWeek(new Date(), weekOffset)
  customRange.value.start = monday.toISOString().split('T')[0]
  customRange.value.end = sunday.toISOString().split('T')[0]
}

// Initialize with current week (Monday-Sunday)
const mondayThisWeek = getMondayOfWeek(new Date())
const sundayThisWeek = getSundayOfWeek(new Date())

const customRange = ref({
  start: mondayThisWeek.toISOString().split('T')[0],
  end: sundayThisWeek.toISOString().split('T')[0]
})

// Computed: Selected week number based on start date
const selectedWeekNumber = computed(() => {
  if (!customRange.value.start) return '-'
  return getWeekNumber(new Date(customRange.value.start))
})

// Report state
const loading = ref(false)
const reportData = ref(null)

// Computed: Jumlah yang ditransfer pabrik = Nilai Piring - Pajak - Admin
const amountFromFactory = computed(() => {
  if (!reportData.value) return 0
  return (reportData.value.totalTransfer || 0) - (reportData.value.totalTax || 0) - (reportData.value.totalAdminFee || 0)
})

// Shift helpers
function getShiftLabel(shift) {
  const labels = {
    shift1: 'Shift 1',
    shift2: 'Shift 2',
    tambahan_s1: 'Tambahan S1',
    tambahan_s2: 'Tambahan S2'
  }
  return labels[shift] || shift
}

function getShiftColor(shift) {
  const colors = {
    shift1: 'blue',
    shift2: 'green',
    tambahan_s1: 'orange',
    tambahan_s2: 'purple'
  }
  return colors[shift] || 'grey'
}

// Format helpers
function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0)
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

// Table columns
const shiftColumns = [
  { name: 'shift', label: 'Shift', field: 'shift', align: 'left' },
  { name: 'sgpCount', label: 'SGP', field: 'sgpCount', align: 'center' },
  { name: 'hiroseCount', label: 'Hirose', field: 'hiroseCount', align: 'center' },
  { name: 'totalPlates', label: 'Total Piring', field: 'totalPlates', align: 'center' },
  { name: 'totalNetIncome', label: 'Penghasilan', field: 'totalNetIncome', align: 'right' },
  { name: 'totalNetReturn', label: 'Pengembalian', field: 'totalNetReturn', align: 'right' }
]

const dailyColumns = [
  { name: 'date', label: 'Tanggal', field: 'date', align: 'left', sortable: true },
  { name: 'totalSgpCount', label: 'SGP', field: 'totalSgpCount', align: 'center' },
  { name: 'totalHiroseCount', label: 'Hirose', field: 'totalHiroseCount', align: 'center' },
  { name: 'totalPlates', label: 'Total', field: 'totalPlates', align: 'center' },
  { name: 'totalTransfer', label: 'Transfer', field: 'totalTransfer', align: 'right' },
  { name: 'totalNetIncome', label: 'Penghasilan', field: 'totalNetIncome', align: 'right' },
  { name: 'totalNetReturn', label: 'Pengembalian', field: 'totalNetReturn', align: 'right' },
  { name: 'totalTax', label: 'Total Pajak', field: 'totalTax', align: 'right' }
]

// Computed
const shiftSummaryRows = computed(() => {
  if (!reportData.value?.byShift) return []
  return Object.entries(reportData.value.byShift).map(([shift, data]) => ({
    shift,
    ...data
  })).filter(row => row.totalPlates > 0)
})

// Grouped daily data with shift details
const groupedDailyData = computed(() => {
  if (!reportData.value?.dailyBreakdown) return []

  const result = []

  reportData.value.dailyBreakdown.forEach(day => {
    // Add date header
    result.push({
      id: `header-${day.date}`,
      isGroupHeader: true,
      date: day.date,
      totalPlates: day.totalPlates
    })

    // Add shift rows if available
    if (day.shifts) {
      const shiftOrder = ['shift1', 'shift2', 'tambahan_s1', 'tambahan_s2']
      shiftOrder.forEach(shift => {
        if (day.shifts[shift]) {
          const shiftData = day.shifts[shift]
          result.push({
            id: `${day.date}-${shift}`,
            isShiftRow: true,
            date: day.date,
            shift: shift,
            sgpCount: shiftData.sgpCount,
            hiroseCount: shiftData.hiroseCount,
            totalPlates: shiftData.totalPlates,
            totalTransfer: shiftData.totalTransfer,
            totalNetIncome: shiftData.totalNetIncome,
            totalNetReturn: shiftData.totalNetReturn,
            totalTax: (shiftData.totalGrossIncome - shiftData.totalNetIncome) + (shiftData.totalGrossReturn - shiftData.totalNetReturn)
          })
        }
      })
    }

    // Add subtotal row
    result.push({
      id: `subtotal-${day.date}`,
      isSubtotal: true,
      date: day.date,
      totalSgpCount: day.totalSgpCount,
      totalHiroseCount: day.totalHiroseCount,
      totalPlates: day.totalPlates,
      totalTransfer: day.totalTransfer,
      totalNetIncome: day.totalNetIncome,
      totalNetReturn: day.totalNetReturn,
      totalTax: day.totalTax
    })
  })

  return result
})

// Functions
function getDateRange() {
  return {
    startDate: customRange.value.start,
    endDate: customRange.value.end
  }
}

async function fetchReport() {
  const { startDate, endDate } = getDateRange()

  if (!startDate || !endDate) {
    $q.notify({
      type: 'warning',
      message: 'Pilih periode terlebih dahulu'
    })
    return
  }

  loading.value = true
  try {
    const response = await plateCountService.getSummary({ startDate, endDate })
    reportData.value = response.data
  } catch (error) {
    console.error('Error fetching report:', error)
    $q.notify({
      type: 'negative',
      message: 'Gagal memuat laporan'
    })
  } finally {
    loading.value = false
  }
}

function exportPDF() {
  if (!reportData.value) return
  try {
    const { startDate, endDate } = getDateRange()
    const doc = new jsPDF()

    // === HEADER: Logo & Judul ===
    // Logo kiri atas (pakai favicon jika tidak ada logo khusus)
    const logoUrl = window.location.origin + '/icons/favicon-96x96.png'
    const imgSize = 14
    doc.addImage(logoUrl, 'PNG', 14, 10, imgSize, imgSize)
    doc.setFontSize(18)
    doc.text('PT. KANTIN UNTUNG', 105, 16, { align: 'center' })
    doc.setFontSize(13)
    doc.text('LAPORAN INPUT PIRING', 105, 26, { align: 'center' })
    doc.setFontSize(9)
    doc.text(`Periode: ${formatDate(startDate)} - ${formatDate(endDate)}`, 105, 32, { align: 'center' })

    // === RINGKASAN 2 KOLOM ===
    doc.setFontSize(11)
    doc.text('Ringkasan', 14, 44)
    const jumlahDitransfer = (reportData.value.totalTransfer || 0) - (reportData.value.totalTax || 0) - (reportData.value.totalAdminFee || 0);
    // --- 4 Card Horizontal ---
    const cardY = 50;
    const cardW = 44, cardH = 18, gap = 8;
    // Card 1: Total Piring
    doc.setFillColor(232, 245, 253); doc.roundedRect(14, cardY, cardW, cardH, 4, 4, 'F');
    doc.setFontSize(8); doc.setTextColor(25, 118, 210); doc.text('TOTAL PIRING', 16, cardY + 7);
    doc.setFontSize(14); doc.setTextColor(33, 33, 33); doc.text((reportData.value.totalPlates?.toLocaleString('id-ID') || '-'), 16, cardY + 15);
    // Card 2: Nilai Piring
    doc.setFillColor(232, 245, 253); doc.roundedRect(14+cardW+gap, cardY, cardW, cardH, 4, 4, 'F');
    doc.setFontSize(8); doc.setTextColor(25, 118, 210); doc.text('NILAI PIRING', 16+cardW+gap, cardY + 7);
    doc.setFontSize(14); doc.setTextColor(33, 33, 33); doc.setFont(undefined, 'bold'); doc.text(formatCurrency(reportData.value.totalTransfer), 16+cardW+gap, cardY + 15);
    doc.setFont(undefined, 'normal');
    // Card 3: SGP
    doc.setFillColor(245, 249, 255); doc.roundedRect(14, cardY+cardH+4, cardW, cardH, 4, 4, 'F');
    doc.setFontSize(8); doc.setTextColor(25, 118, 210); doc.text('SGP', 16, cardY+cardH+4 + 7);
    doc.setFontSize(14); doc.setTextColor(33, 33, 33); doc.setFont(undefined, 'bold'); doc.text((reportData.value.totalSgpCount?.toLocaleString('id-ID') || '-'), 16, cardY+cardH+4 + 15);
    doc.setFont(undefined, 'normal');
    // Card 4: Hirose
    doc.setFillColor(245, 249, 255); doc.roundedRect(14+cardW+gap, cardY+cardH+4, cardW, cardH, 4, 4, 'F');
    doc.setFontSize(8); doc.setTextColor(25, 118, 210); doc.text('HIROSE', 16+cardW+gap, cardY+cardH+4 + 7);
    doc.setFontSize(14); doc.setTextColor(33, 33, 33); doc.setFont(undefined, 'bold'); doc.text((reportData.value.totalHiroseCount?.toLocaleString('id-ID') || '-'), 16+cardW+gap, cardY+cardH+4 + 15);
    doc.setFont(undefined, 'normal');

    // --- Tabel Vertikal ---
    const tableY = cardY + cardH*2 + 16;
    const summaryTable = [
      ['Total Pajak (2%)', formatCurrency(reportData.value.totalTax)],
      ['Biaya Admin Transfer', formatCurrency(reportData.value.totalAdminFee)],
      ['Jumlah Ditransfer Pabrik', formatCurrency(jumlahDitransfer)],
      [{text:'Penghasilan Kotor', color:[27,94,32]}, formatCurrency(reportData.value.totalNetIncome)],
      [{text:'Pengembalian Bersih', color:[230,81,0]}, formatCurrency(reportData.value.totalNetReturn)],
      [{text:'Penghasilan Bersih', bold:true, color:[25,118,210]}, formatCurrency(reportData.value.finalNetIncome)]
    ];
    autoTable(doc, {
      startY: tableY,
      body: summaryTable,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2, halign: 'right' },
      columnStyles: {
        0: { fontStyle: 'normal', halign: 'left', cellWidth: 60 },
        1: { fontStyle: 'bold', halign: 'right', cellWidth: 40 }
      },
      didParseCell: function(data) {
        // Highlight baris
        if (data.row.index === 0) data.cell.styles.fillColor = [232,245,253];
        if (data.row.index === 3) data.cell.styles.fillColor = [232,245,233];
        if (data.row.index === 4) data.cell.styles.fillColor = [255,243,224];
        if (data.row.index === 5) { data.cell.styles.fillColor = [232,245,253]; data.cell.styles.lineWidth = 0.8; data.cell.styles.lineColor = [25,118,210]; }
        // Custom warna label
        if (typeof data.cell.raw === 'object') {
          if (data.cell.raw.bold) data.cell.styles.fontStyle = 'bold';
          if (data.cell.raw.color) data.cell.styles.textColor = data.cell.raw.color;
          data.cell.text = [data.cell.raw.text];
        }
      },
      rowPageBreak: 'avoid'
    });

    // === TABEL SHIFT ===
    const afterSummaryY = doc.lastAutoTable.finalY + 6;
    doc.setFontSize(11)
    doc.text('Ringkasan Per Shift', 14, afterSummaryY)
    const shiftData = shiftSummaryRows.value.map(row => [
      getShiftLabel(row.shift),
      row.sgpCount?.toLocaleString('id-ID'),
      row.hiroseCount?.toLocaleString('id-ID'),
      row.totalPlates?.toLocaleString('id-ID'),
      formatCurrency(row.totalNetIncome),
      formatCurrency(row.totalNetReturn)
    ])
    autoTable(doc, {
      startY: afterSummaryY + 4,
      head: [['Shift', 'SGP', 'Hirose', 'Total', 'Penghasilan', 'Pengembalian']],
      body: shiftData,
      theme: 'grid',
      headStyles: { fillColor: [66, 133, 244], textColor: 255 },
      styles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [240, 245, 255] }
    })

    // === TABEL HARIAN ===
    const dailyStartY = doc.lastAutoTable.finalY + 10
    doc.setFontSize(11)
    doc.text('Detail Per Tanggal', 14, dailyStartY)
    const dailyData = (reportData.value.dailyBreakdown || []).map(row => [
      formatDate(row.date),
      row.totalSgpCount?.toLocaleString('id-ID'),
      row.totalHiroseCount?.toLocaleString('id-ID'),
      row.totalPlates?.toLocaleString('id-ID'),
      formatCurrency(row.totalTransfer),
      formatCurrency(row.totalNetIncome),
      formatCurrency(row.totalNetReturn)
    ])
    autoTable(doc, {
      startY: dailyStartY + 4,
      head: [['Tanggal', 'SGP', 'Hirose', 'Total', 'Transfer', 'Penghasilan', 'Pengembalian']],
      body: dailyData,
      theme: 'grid',
      headStyles: { fillColor: [66, 133, 244], textColor: 255 },
      styles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    })

    // === FOOTER: Info cetak & halaman ===
    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(
        `Dicetak: ${new Date().toLocaleString('id-ID')}  |  Halaman ${i} dari ${pageCount}`,
        105,
        doc.internal.pageSize.height - 8,
        { align: 'center' }
      )
    }

    // Save
    const filename = `Laporan_Piring_${startDate}_${endDate}.pdf`
    doc.save(filename)
    $q.notify({
      type: 'positive',
      message: 'PDF berhasil diunduh'
    })
  } catch (error) {
    console.error('Error exporting PDF:', error)
    $q.notify({
      type: 'negative',
      message: 'Gagal export PDF: ' + error.message
    })
  }
}
</script>

<style scoped>
.q-card {
  border-radius: 8px;
}
</style>
