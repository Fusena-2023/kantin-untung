<template>
  <q-page padding>
    <div class="row items-center q-mb-md">
      <div class="col">
        <h5 class="q-my-none">Input Jumlah Piring</h5>
        <p class="text-grey-7 q-mb-none">Catat jumlah piring yang dimakan per shift</p>
      </div>
    </div>

    <!-- Period Summary -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6">
            <q-icon name="analytics" class="q-mr-sm" />
            Ringkasan Periode
          </div>
          <div class="row q-gutter-sm items-center">
            <q-btn-toggle
              v-model="summaryPeriod"
              toggle-color="primary"
              :options="periodOptions"
              unelevated
              rounded
              @update:model-value="fetchPeriodSummary"
            />
            <template v-if="summaryPeriod === 'custom'">
              <q-input
                v-model="customStartDate"
                type="date"
                dense
                outlined
                label="Dari"
                style="width: 140px"
              />
              <q-input
                v-model="customEndDate"
                type="date"
                dense
                outlined
                label="Sampai"
                style="width: 140px"
              />
              <q-btn
                color="primary"
                icon="search"
                dense
                @click="fetchPeriodSummary"
              />
            </template>
          </div>
        </div>

        <!-- Period Label -->
        <div class="text-subtitle1 text-grey-7 q-mb-md">
          <q-icon name="date_range" class="q-mr-xs" />
          {{ periodLabel }}
        </div>

        <!-- Summary Cards -->
        <div class="row q-col-gutter-md" v-if="periodSummary">
          <div class="col-12 col-sm-6" :class="isPemilik ? 'col-md-2' : 'col-md-6'">
            <q-card flat bordered class="bg-blue-1">
              <q-card-section class="text-center">
                <div class="text-h4 text-primary">{{ periodSummary.totalPlates }}</div>
                <div class="text-grey-7">Total Piring</div>
              </q-card-section>
            </q-card>
          </div>
          <template v-if="isPemilik">
            <div class="col-12 col-sm-6 col-md-2">
              <q-card flat bordered class="bg-cyan-1">
                <q-card-section class="text-center">
                  <div class="text-h6 text-cyan-9">{{ formatCurrency(periodSummary.totalTransfer) }}</div>
                  <div class="text-grey-7">Transfer Pabrik</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-sm-6 col-md-2">
              <q-card flat bordered class="bg-green-1">
                <q-card-section class="text-center">
                  <div class="text-h6 text-positive">{{ formatCurrency(periodSummary.netIncome) }}</div>
                  <div class="text-grey-7">Penghasilan Bersih</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-sm-6 col-md-2">
              <q-card flat bordered class="bg-orange-1">
                <q-card-section class="text-center">
                  <div class="text-h6 text-warning">{{ formatCurrency(periodSummary.netReturn) }}</div>
                  <div class="text-grey-7">Dikembalikan</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-sm-6 col-md-2">
              <q-card flat bordered class="bg-red-1">
                <q-card-section class="text-center">
                  <div class="text-h6 text-negative">{{ formatCurrency(periodSummary.totalTax) }}</div>
                  <div class="text-grey-7">Total Pajak</div>
                </q-card-section>
              </q-card>
            </div>
          </template>
          <div class="col-12 col-sm-6" :class="isPemilik ? 'col-md-2' : 'col-md-6'">
            <q-card flat bordered class="bg-purple-1">
              <q-card-section class="text-center">
                <div class="text-h6 text-purple-9">{{ periodSummary.recordCount }}</div>
                <div class="text-grey-7">Jumlah Record</div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Daily Breakdown Table - Only for Pemilik -->
        <div v-if="isPemilik && periodSummary && periodSummary.dailyBreakdown && periodSummary.dailyBreakdown.length > 0" class="q-mt-md">
          <q-expansion-item
            icon="table_chart"
            label="Detail Per Hari"
            :caption="`${periodSummary.dailyBreakdown.length} hari`"
            header-class="text-primary"
          >
            <q-table
              :rows="periodSummary.dailyBreakdown"
              :columns="breakdownColumns"
              row-key="date"
              dense
              flat
              bordered
              :pagination="{ rowsPerPage: 10 }"
            >
              <template v-slot:body-cell-date="props">
                <q-td :props="props">
                  {{ formatDateShort(props.row.date) }}
                </q-td>
              </template>
              <template v-slot:body-cell-shifts="props">
                <q-td :props="props">
                  <q-chip v-if="props.row.shifts.siang" size="sm" color="orange" text-color="white">
                    S: {{ props.row.shifts.siang.plateCount }}
                  </q-chip>
                  <q-chip v-if="props.row.shifts.malam" size="sm" color="indigo" text-color="white">
                    M: {{ props.row.shifts.malam.plateCount }}
                  </q-chip>
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
            </q-table>
          </q-expansion-item>
        </div>

        <div v-if="!periodSummary || periodSummary.recordCount === 0" class="text-center text-grey-6 q-pa-lg">
          <q-icon name="inbox" size="48px" class="q-mb-sm" />
          <div>Tidak ada data untuk periode ini</div>
        </div>
      </q-card-section>
    </q-card>

    <!-- History Table -->
    <q-card>
      <q-card-section>
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6">
            <q-icon name="history" class="q-mr-sm" />
            Riwayat
          </div>
          <div class="row q-gutter-sm">
            <q-input
              v-model="filterDate"
              type="date"
              dense
              outlined
              label="Filter Tanggal"
              @update:model-value="fetchData"
            />
            <q-select
              v-model="filterShift"
              :options="shiftOptions"
              dense
              outlined
              emit-value
              map-options
              label="Shift"
              style="min-width: 120px"
              @update:model-value="fetchData"
            />
            <q-btn
              color="primary"
              icon="add"
              label="Input Baru"
              @click="openInputDialog()"
            />
          </div>
        </div>

        <q-table
          :rows="plateCounts"
          :columns="columns"
          row-key="id"
          :loading="loading"
          :pagination="pagination"
          @request="onRequest"
        >
          <template v-slot:body-cell-shift="props">
            <q-td :props="props">
              <q-chip
                :color="props.row.shift === 'siang' ? 'orange' : 'indigo'"
                text-color="white"
                size="sm"
              >
                <q-icon
                  :name="props.row.shift === 'siang' ? 'wb_sunny' : 'nights_stay'"
                  class="q-mr-xs"
                />
                {{ props.row.shift === 'siang' ? 'Siang' : 'Malam' }}
              </q-chip>
            </q-td>
          </template>

          <template v-slot:body-cell-netIncome="props">
            <q-td :props="props">
              <span class="text-positive text-weight-medium">
                {{ formatCurrency(props.row.netIncome) }}
              </span>
            </q-td>
          </template>

          <template v-slot:body-cell-netReturn="props">
            <q-td :props="props">
              <span class="text-warning text-weight-medium">
                {{ formatCurrency(props.row.netReturn) }}
              </span>
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                flat
                round
                dense
                icon="edit"
                color="primary"
                @click="openEditDialog(props.row.id)"
              >
                <q-tooltip>Edit</q-tooltip>
              </q-btn>
              <q-btn
                v-if="isPemilik"
                flat
                round
                dense
                icon="delete"
                color="negative"
                @click="confirmDelete(props.row)"
              >
                <q-tooltip>Hapus</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Input/Edit Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="width: 500px; max-width: 90vw">
        <q-card-section class="row items-center">
          <div class="text-h6">
            {{ isEditing ? 'Edit Data Piring' : 'Input Jumlah Piring' }}
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-form @submit.prevent="saveData" class="q-gutter-md">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.date"
                  type="date"
                  label="Tanggal *"
                  outlined
                  :rules="[val => !!val || 'Tanggal wajib diisi']"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-select
                  v-model="form.shift"
                  :options="[
                    { label: 'Siang', value: 'siang' },
                    { label: 'Malam', value: 'malam' }
                  ]"
                  label="Shift *"
                  outlined
                  emit-value
                  map-options
                  :rules="[val => !!val || 'Shift wajib dipilih']"
                />
              </div>
            </div>

            <q-input
              v-model.number="form.plateCount"
              type="number"
              label="Jumlah Piring *"
              placeholder="Masukkan jumlah piring"
              outlined
              min="0"
              style="min-width: 200px;"
              input-class="text-right"
              :rules="[
                val => (val !== null && val !== '') || 'Jumlah piring wajib diisi',
                val => val >= 0 || 'Jumlah tidak boleh negatif'
              ]"
            >
              <template v-slot:append>
                <span class="text-grey-7" style="min-width: 40px;">piring</span>
              </template>
            </q-input>

            <!-- Price Configuration (Collapsible) - Only for Pemilik -->
            <q-expansion-item
              v-if="isPemilik"
              icon="settings"
              label="Pengaturan Harga"
              caption="Klik untuk mengubah harga per piring"
            >
              <q-card>
                <q-card-section class="q-gutter-sm">
                  <q-input
                    v-model.number="form.pricePerPlate"
                    type="number"
                    label="Harga per Piring (dari Pabrik)"
                    outlined
                    dense
                    prefix="Rp"
                  />
                  <q-input
                    v-model.number="form.incomePerPlate"
                    type="number"
                    label="Penghasilan per Piring"
                    outlined
                    dense
                    prefix="Rp"
                  />
                  <q-input
                    v-model.number="form.returnPerPlate"
                    type="number"
                    label="Dikembalikan per Piring"
                    outlined
                    dense
                    prefix="Rp"
                  />
                  <q-input
                    v-model.number="form.taxPercentage"
                    type="number"
                    label="Persentase Pajak"
                    outlined
                    dense
                    suffix="%"
                    step="0.1"
                  />
                </q-card-section>
              </q-card>
            </q-expansion-item>

            <q-input
              v-model="form.notes"
              type="textarea"
              label="Catatan (opsional)"
              outlined
              rows="2"
            />
          </q-form>
        </q-card-section>

        <!-- Preview Calculation - Only for Pemilik -->
        <q-card-section v-if="isPemilik" class="bg-grey-2">
          <div class="text-subtitle2 q-mb-sm">Pratinjau Perhitungan:</div>
          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-6">
              <div class="text-caption text-grey-7">Transfer dari Pabrik:</div>
              <div class="text-weight-medium">{{ formatCurrency(preview.totalTransfer) }}</div>
            </div>
            <div class="col-12 col-sm-6">
              <div class="text-caption text-grey-7">Total Pajak ({{ form.taxPercentage }}%):</div>
              <div class="text-weight-medium text-negative">{{ formatCurrency(preview.totalTax) }}</div>
            </div>
            <div class="col-12">
              <q-separator class="q-my-sm" />
            </div>
            <div class="col-12 col-sm-6">
              <div class="text-caption text-grey-7">Penghasilan Kotor:</div>
              <div>{{ formatCurrency(preview.grossIncome) }}</div>
              <div class="text-caption text-negative">Pajak: -{{ formatCurrency(preview.incomeTax) }}</div>
              <div class="text-weight-bold text-positive">Bersih: {{ formatCurrency(preview.netIncome) }}</div>
            </div>
            <div class="col-12 col-sm-6">
              <div class="text-caption text-grey-7">Pengembalian Kotor:</div>
              <div>{{ formatCurrency(preview.grossReturn) }}</div>
              <div class="text-caption text-negative">Pajak: -{{ formatCurrency(preview.returnTax) }}</div>
              <div class="text-weight-bold text-warning">Bersih: {{ formatCurrency(preview.netReturn) }}</div>
            </div>
            <div class="col-12">
              <q-separator class="q-my-sm" />
              <div class="row justify-between">
                <div>
                  <span class="text-caption text-grey-7">Total Setelah Pajak:</span>
                  <span class="text-weight-bold q-ml-sm">{{ formatCurrency(preview.totalAfterTax) }}</span>
                </div>
                <div>
                  <q-icon
                    :name="preview.verification ? 'check_circle' : 'error'"
                    :color="preview.verification ? 'positive' : 'negative'"
                    size="sm"
                  />
                  <span class="text-caption q-ml-xs">
                    {{ preview.verification ? 'Perhitungan valid' : 'Ada selisih' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Batal" v-close-popup />
          <q-btn
            color="primary"
            :label="isEditing ? 'Simpan Perubahan' : 'Simpan'"
            :loading="saving"
            @click="saveData"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'src/stores/auth-store'
import plateCountService from 'src/services/plateCount'

const $q = useQuasar()
const authStore = useAuthStore()

const isPemilik = computed(() => authStore.isPemilik)

// Data
const plateCounts = ref([])
const periodSummary = ref(null)
const loading = ref(false)
const saving = ref(false)
const showDialog = ref(false)
const isEditing = ref(false)
const editingId = ref(null)

// Period Summary
const summaryPeriod = ref('weekly')
const customStartDate = ref('')
const customEndDate = ref('')
const periodOptions = [
  { label: 'Harian', value: 'daily' },
  { label: 'Mingguan', value: 'weekly' },
  { label: 'Bulanan', value: 'monthly' },
  { label: 'Tahunan', value: 'yearly' },
  { label: 'Custom', value: 'custom' }
]

// Filters
const filterDate = ref('')
const filterShift = ref(null)
const shiftOptions = [
  { label: 'Semua', value: null },
  { label: 'Siang', value: 'siang' },
  { label: 'Malam', value: 'malam' }
]

// Pagination
const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0
})

// Form
const defaultForm = {
  date: new Date().toISOString().split('T')[0],
  shift: 'siang',
  plateCount: null,
  pricePerPlate: 11500,
  incomePerPlate: 7000,
  returnPerPlate: 4500,
  taxPercentage: 2,
  notes: ''
}

const form = ref({ ...defaultForm })

// Table columns - computed based on role
const columns = computed(() => {
  const baseColumns = [
    { name: 'date', label: 'Tanggal', field: 'date', sortable: true, format: val => formatDate(val) },
    { name: 'shift', label: 'Shift', field: 'shift', sortable: true },
    { name: 'plateCount', label: 'Jumlah Piring', field: 'plateCount', sortable: true }
  ]

  if (isPemilik.value) {
    baseColumns.push(
      { name: 'totalTransfer', label: 'Transfer', field: 'totalTransfer', format: val => formatCurrency(val) },
      { name: 'netIncome', label: 'Penghasilan Bersih', field: 'netIncome' },
      { name: 'netReturn', label: 'Dikembalikan', field: 'netReturn' }
    )
  }

  baseColumns.push({ name: 'actions', label: 'Aksi', field: 'actions', align: 'center' })
  return baseColumns
})

// Breakdown table columns - only used by pemilik
const breakdownColumns = [
  { name: 'date', label: 'Tanggal', field: 'date', sortable: true },
  { name: 'shifts', label: 'Shift', field: 'shifts' },
  { name: 'totalPlates', label: 'Total Piring', field: 'totalPlates', sortable: true },
  { name: 'totalTransfer', label: 'Transfer', field: 'totalTransfer', format: val => formatCurrency(val) },
  { name: 'netIncome', label: 'Penghasilan', field: 'netIncome' },
  { name: 'netReturn', label: 'Dikembalikan', field: 'netReturn' }
]

// Computed period label
const periodLabel = computed(() => {
  const { startDate, endDate } = getPeriodDates()
  if (!startDate || !endDate) return 'Pilih periode'

  const start = new Date(startDate)

  if (summaryPeriod.value === 'daily') {
    return `Hari ini: ${formatDateShort(startDate)}`
  } else if (summaryPeriod.value === 'weekly') {
    return `Minggu ini: ${formatDateShort(startDate)} - ${formatDateShort(endDate)}`
  } else if (summaryPeriod.value === 'monthly') {
    return `Bulan ${start.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`
  } else if (summaryPeriod.value === 'yearly') {
    return `Tahun ${start.getFullYear()}`
  } else {
    return `${formatDateShort(startDate)} - ${formatDateShort(endDate)}`
  }
})

// Computed preview - always show with default values
const preview = computed(() => {
  const plateCount = form.value.plateCount || 0
  return plateCountService.calculatePreview(plateCount, {
    pricePerPlate: form.value.pricePerPlate,
    incomePerPlate: form.value.incomePerPlate,
    returnPerPlate: form.value.returnPerPlate,
    taxPercentage: form.value.taxPercentage
  })
})

// Methods
function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0)
}

function formatDateShort(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function getPeriodDates() {
  const today = new Date()
  let startDate, endDate

  switch (summaryPeriod.value) {
    case 'daily':
      startDate = today.toISOString().split('T')[0]
      endDate = startDate
      break
    case 'weekly': {
      // Start from Monday of current week
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
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      startDate = firstDay.toISOString().split('T')[0]
      endDate = lastDay.toISOString().split('T')[0]
      break
    }
    case 'yearly':
      startDate = `${today.getFullYear()}-01-01`
      endDate = `${today.getFullYear()}-12-31`
      break
    case 'custom':
      startDate = customStartDate.value
      endDate = customEndDate.value
      break
    default:
      startDate = today.toISOString().split('T')[0]
      endDate = startDate
  }

  return { startDate, endDate }
}

async function fetchPeriodSummary() {
  const { startDate, endDate } = getPeriodDates()

  if (!startDate || !endDate) {
    if (summaryPeriod.value === 'custom') {
      $q.notify({
        type: 'warning',
        message: 'Pilih tanggal mulai dan akhir'
      })
    }
    return
  }

  loading.value = true
  try {
    const response = await plateCountService.getSummary({ startDate, endDate })
    periodSummary.value = response.data
  } catch (error) {
    console.error('Error fetching period summary:', error)
    $q.notify({
      type: 'negative',
      message: 'Gagal memuat ringkasan periode'
    })
  } finally {
    loading.value = false
  }
}

async function fetchData() {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      limit: pagination.value.rowsPerPage
    }

    if (filterDate.value) {
      params.startDate = filterDate.value
      params.endDate = filterDate.value
    }

    if (filterShift.value) {
      params.shift = filterShift.value
    }

    const response = await plateCountService.getAll(params)
    plateCounts.value = response.data
    pagination.value.rowsNumber = response.pagination.total
  } catch (error) {
    console.error('Error fetching data:', error)
    $q.notify({
      type: 'negative',
      message: 'Gagal memuat data'
    })
  } finally {
    loading.value = false
  }
}

function onRequest(props) {
  pagination.value.page = props.pagination.page
  pagination.value.rowsPerPage = props.pagination.rowsPerPage
  fetchData()
}

function openInputDialog(shift = null) {
  isEditing.value = false
  editingId.value = null
  form.value = {
    ...defaultForm,
    date: new Date().toISOString().split('T')[0],
    shift: shift || 'siang'
  }
  showDialog.value = true
}

async function openEditDialog(id) {
  try {
    loading.value = true
    const response = await plateCountService.getById(id)
    const data = response.data

    isEditing.value = true
    editingId.value = id
    form.value = {
      date: data.date,
      shift: data.shift,
      plateCount: parseInt(data.plateCount),
      pricePerPlate: parseFloat(data.pricePerPlate),
      incomePerPlate: parseFloat(data.incomePerPlate),
      returnPerPlate: parseFloat(data.returnPerPlate),
      taxPercentage: parseFloat(data.taxPercentage),
      notes: data.notes || ''
    }
    showDialog.value = true
  } catch (error) {
    console.error('Error fetching record:', error)
    $q.notify({
      type: 'negative',
      message: 'Gagal memuat data'
    })
  } finally {
    loading.value = false
  }
}

async function saveData() {
  // Validation
  if (!form.value.date || !form.value.shift || form.value.plateCount === null) {
    $q.notify({
      type: 'warning',
      message: 'Mohon lengkapi semua field yang wajib diisi'
    })
    return
  }

  saving.value = true
  try {
    if (isEditing.value) {
      await plateCountService.update(editingId.value, form.value)
      $q.notify({
        type: 'positive',
        message: 'Data berhasil diperbarui'
      })
    } else {
      await plateCountService.create(form.value)
      $q.notify({
        type: 'positive',
        message: 'Data berhasil disimpan'
      })
    }

    showDialog.value = false
    fetchData()
    fetchPeriodSummary()
  } catch (error) {
    console.error('Error saving data:', error)
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Gagal menyimpan data'
    })
  } finally {
    saving.value = false
  }
}

function confirmDelete(row) {
  $q.dialog({
    title: 'Konfirmasi Hapus',
    message: `Apakah Anda yakin ingin menghapus data shift ${row.shift} tanggal ${formatDate(row.date)}?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await plateCountService.delete(row.id)
      $q.notify({
        type: 'positive',
        message: 'Data berhasil dihapus'
      })
      fetchData()
      fetchPeriodSummary()
    } catch (error) {
      console.error('Error deleting:', error)
      $q.notify({
        type: 'negative',
        message: 'Gagal menghapus data'
      })
    }
  })
}

// Lifecycle
onMounted(() => {
  fetchData()
  fetchPeriodSummary()
})
</script>

<style scoped>
.q-card {
  border-radius: 8px;
}
</style>
