<template>
  <q-page padding>
    <div class="q-gutter-y-md">
      <!-- Header -->
      <div class="row items-center justify-between">
        <div>
          <h5 class="q-my-none">Jumlah Piring</h5>
          <p class="text-grey q-my-none">Pencatatan jumlah piring per shift</p>
        </div>
        <q-btn
          color="primary"
          icon="add"
          label="Input Data"
          @click="openInputDialog()"
        />
      </div>

      <!-- Period Summary Cards (hanya untuk pemilik) -->
      <div v-if="isPemilik">
        <!-- Date Range Selector -->
        <q-card flat bordered class="q-mb-md">
          <q-card-section class="q-py-sm">
            <div class="row items-center q-gutter-sm">
              <!-- Quick Week Selector -->
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
                </q-list>
              </q-btn-dropdown>

              <span class="text-grey-5">|</span>

              <!-- Manual Date Range -->
              <q-input
                v-model="customStartDate"
                type="date"
                label="Dari (Senin)"
                dense
                outlined
                style="width: 160px"
                @update:model-value="fetchPeriodSummary"
              />
              <q-input
                v-model="customEndDate"
                type="date"
                label="Sampai (Minggu)"
                dense
                outlined
                style="width: 160px"
                @update:model-value="fetchPeriodSummary"
              />

              <q-space />

              <!-- Refresh Button & Auto-refresh Toggle -->
              <q-btn
                flat
                round
                dense
                icon="refresh"
                color="primary"
                :loading="loading"
                @click="refreshAllData"
              >
                <q-tooltip>Refresh Data</q-tooltip>
              </q-btn>
              <q-toggle
                v-model="autoRefresh"
                label="Auto"
                dense
                size="sm"
                color="primary"
              >
                <q-tooltip>Auto refresh setiap 30 detik</q-tooltip>
              </q-toggle>
              <span v-if="autoRefresh" class="text-caption text-grey-6">
                ({{ autoRefreshCountdown }}s)
              </span>
            </div>
          </q-card-section>
        </q-card>

        <!-- Summary Cards -->
        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-12 col-md-4">
            <q-card flat bordered class="bg-blue-1">
              <q-card-section>
                <div class="text-subtitle2 text-grey-7">Total Piring</div>
                <div class="text-h5 text-primary">
                  {{ periodSummary.totalPlates?.toLocaleString('id-ID') || 0 }}
                </div>
                <div class="text-caption text-grey-6">
                  SGP: {{ periodSummary.totalSgpCount?.toLocaleString('id-ID') || 0 }} |
                  Hirose: {{ periodSummary.totalHiroseCount?.toLocaleString('id-ID') || 0 }}
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-md-4">
            <q-card flat bordered class="bg-green-1">
              <q-card-section>
                <div class="text-subtitle2 text-grey-7">Nilai Piring</div>
                <div class="text-h5 text-positive">
                  {{ formatCurrency(periodSummary.totalTransfer || 0) }}
                </div>
                <div class="text-caption text-grey-6">
                  {{ periodSummary.recordCount || 0 }} data
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-md-4">
            <q-card flat bordered class="bg-teal-1">
              <q-card-section>
                <div class="text-subtitle2 text-grey-7">Penghasilan Kotor</div>
                <div class="text-h5 text-teal">
                  {{ formatCurrency(periodSummary.totalNetIncome || 0) }}
                </div>
                <div class="text-caption text-grey-6">
                  Pajak: {{ formatCurrency(periodSummary.totalIncomeTax || 0) }}
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- PENGEMBALIAN BERSIH - Card Utama -->
        <div class="row q-col-gutter-md q-mb-sm">
          <div class="col-12 col-md-8 offset-md-2">
            <q-card class="bg-orange-2" style="border: 2px solid #FB8C00;">
              <q-card-section class="text-center q-py-md">
                <q-icon name="savings" size="28px" color="orange-9" class="q-mb-xs" />
                <div class="text-subtitle2 text-orange-9 text-weight-medium">PENGEMBALIAN BERSIH</div>
                <div class="text-h4 text-orange-10 text-weight-bold">
                  {{ formatCurrency(periodSummary.totalNetReturn || 0) }}
                </div>
                <div class="text-caption text-orange-8">
                  Pajak: {{ formatCurrency(periodSummary.totalReturnTax || 0) }}
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Admin Fee and Final Income -->
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-md-4">
            <q-card flat bordered class="bg-red-1">
              <q-card-section>
                <div class="text-subtitle2 text-grey-7">Admin Transfer Bank</div>
                <div class="text-h5 text-negative">
                  - {{ formatCurrency(periodSummary.totalAdminFee || 0) }}
                </div>
                <div class="text-caption text-grey-6">
                  {{ periodSummary.weekCount || 0 }} minggu × Rp 2.900
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-md-4">
            <q-card flat bordered class="bg-cyan-1">
              <q-card-section>
                <div class="text-subtitle2 text-grey-7">Jumlah Ditransfer Pabrik</div>
                <div class="text-h5 text-cyan text-weight-bold">
                  {{ formatCurrency(amountFromFactory) }}
                </div>
                <div class="text-caption text-grey-6">
                  Transfer - Pajak - Admin
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-md-4">
            <q-card flat bordered class="bg-light-green-2">
              <q-card-section>
                <div class="text-subtitle1 text-grey-7">Penghasilan Bersih Final</div>
                <div class="text-h4 text-positive text-weight-bold">
                  {{ formatCurrency(periodSummary.finalNetIncome || 0) }}
                </div>
                <div class="text-caption text-grey-6">
                  Penghasilan kotor - Admin transfer bank
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Filter & Data Table -->
      <q-card flat bordered>
        <q-card-section>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-12 col-md-4">
              <q-input
                v-model="filterDate"
                type="date"
                label="Filter Tanggal"
                outlined
                dense
                clearable
                @update:model-value="fetchData"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-select
                v-model="filterShift"
                :options="shiftOptions"
                label="Filter Shift"
                outlined
                dense
                clearable
                emit-value
                map-options
                @update:model-value="fetchData"
              />
            </div>
          </div>

          <q-table
            :rows="groupedPlateCounts"
            :columns="columns"
            row-key="id"
            :loading="loading"
            :pagination="pagination"
            @request="onRequest"
            flat
            bordered
            hide-header
          >
            <!-- Custom header -->
            <template #top-row>
              <q-tr class="bg-grey-2">
                <q-th class="text-left">Tanggal</q-th>
                <q-th class="text-center">Shift</q-th>
                <q-th class="text-center">SGP</q-th>
                <q-th class="text-center">Hirose</q-th>
                <q-th class="text-center">Total</q-th>
                <q-th v-if="isPemilik" class="text-right">Transfer</q-th>
                <q-th v-if="isPemilik" class="text-right">Penghasilan</q-th>
                <q-th v-if="isPemilik" class="text-right">Pengembalian</q-th>
                <q-th class="text-center">Aksi</q-th>
              </q-tr>
            </template>

            <template #body="props">
              <!-- Date Group Header -->
              <q-tr v-if="props.row.isGroupHeader" class="bg-blue-1">
                <q-td :colspan="isPemilik ? 9 : 6" class="text-weight-bold">
                  <q-icon name="event" class="q-mr-sm" />
                  {{ formatDate(props.row.date) }}
                  <q-badge color="primary" class="q-ml-sm">
                    {{ props.row.totalPlates }} piring
                  </q-badge>
                </q-td>
              </q-tr>

              <!-- Data Row -->
              <q-tr v-else :props="props">
                <q-td class="text-grey-6 text-caption">
                  <!-- Empty for grouped look -->
                </q-td>
                <q-td class="text-center">
                  <q-chip
                    :color="getShiftColor(props.row.shift)"
                    text-color="white"
                    dense
                    :icon="getShiftIcon(props.row.shift)"
                  >
                    {{ getShiftLabel(props.row.shift) }}
                  </q-chip>
                </q-td>
                <q-td class="text-center">
                  <span class="text-weight-medium text-blue">
                    {{ props.row.sgpCount?.toLocaleString('id-ID') || 0 }}
                  </span>
                </q-td>
                <q-td class="text-center">
                  <span class="text-weight-medium text-purple">
                    {{ props.row.hiroseCount?.toLocaleString('id-ID') || 0 }}
                  </span>
                </q-td>
                <q-td class="text-center">
                  <span class="text-weight-bold text-primary">
                    {{ props.row.totalPlates?.toLocaleString('id-ID') || 0 }}
                  </span>
                </q-td>
                <q-td v-if="isPemilik" class="text-right">
                  <span class="text-positive">
                    {{ formatCurrency(props.row.totalTransfer) }}
                  </span>
                </q-td>
                <q-td v-if="isPemilik" class="text-right">
                  <span class="text-teal">
                    {{ formatCurrency(props.row.totalNetIncome) }}
                  </span>
                </q-td>
                <q-td v-if="isPemilik" class="text-right">
                  <span class="text-orange">
                    {{ formatCurrency(props.row.totalNetReturn) }}
                  </span>
                </q-td>
                <q-td class="text-center">
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
              </q-tr>
            </template>
          </q-table>
        </q-card-section>
      </q-card>
    </div>

    <!-- Input/Edit Dialog -->
    <q-dialog v-model="showDialog" persistent>
      <q-card style="width: 520px; max-width: 95vw;">
        <q-card-section class="row items-center q-pb-sm">
          <div class="text-h6">{{ isEditing ? 'Edit Data' : 'Input Data Baru' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-separator />

        <q-card-section>
          <q-form @submit.prevent="saveData" class="q-gutter-sm">
            <q-input
              v-model="form.date"
              type="date"
              label="Tanggal *"
              outlined
              dense
              :rules="[val => !!val || 'Tanggal wajib diisi']"
            />

            <q-select
              v-model="form.shift"
              :options="shiftOptions"
              label="Shift *"
              outlined
              dense
              emit-value
              map-options
              :rules="[val => !!val || 'Shift wajib dipilih']"
            />

            <!-- Input Jumlah Piring -->
            <div>
              <div class="text-subtitle2 text-grey-7 q-mb-xs">Jumlah Piring</div>
              <div class="row q-col-gutter-sm">
                <div class="col-6">
                  <q-input
                    v-model.number="form.sgpCount"
                    type="number"
                    label="SGP"
                    outlined
                    dense
                    min="0"
                    :rules="[val => val >= 0 || 'Tidak boleh negatif']"
                  >
                    <template #prepend>
                      <q-icon name="restaurant" color="blue" />
                    </template>
                  </q-input>
                </div>
                <div class="col-6">
                  <q-input
                    v-model.number="form.hiroseCount"
                    type="number"
                    label="Hirose"
                    outlined
                    dense
                    min="0"
                    :rules="[val => val >= 0 || 'Tidak boleh negatif']"
                  >
                    <template #prepend>
                      <q-icon name="restaurant" color="purple" />
                    </template>
                  </q-input>
                </div>
              </div>
            </div>

            <!-- Pengaturan Harga (expandable) - hanya untuk pemilik -->
            <q-expansion-item
              v-if="isPemilik"
              v-model="showPriceSettings"
              icon="settings"
              label="Pengaturan Harga"
              caption="Klik untuk mengubah harga default"
              header-class="text-grey-8"
              dense
            >
              <q-card flat bordered class="q-mt-sm">
                <q-card-section class="q-py-md">
                  <div class="row q-col-gutter-md">
                    <div class="col-6">
                      <q-input
                        v-model.number="form.pricePerPlate"
                        type="number"
                        label="Harga per Piring (dari Pabrik)"
                        outlined
                        dense
                        prefix="Rp"
                        :rules="[val => val > 0 || 'Harus lebih dari 0']"
                      />
                    </div>
                    <div class="col-6">
                      <q-input
                        v-model.number="form.taxPercentage"
                        type="number"
                        label="Pajak (%)"
                        outlined
                        dense
                        suffix="%"
                        :rules="[val => val >= 0 || 'Tidak boleh negatif']"
                      />
                    </div>
                    <div class="col-6">
                      <q-input
                        v-model.number="form.incomePerPlate"
                        type="number"
                        label="Penghasilan per Piring"
                        outlined
                        dense
                        prefix="Rp"
                        :rules="[val => val > 0 || 'Harus lebih dari 0']"
                      />
                    </div>
                    <div class="col-6">
                      <q-input
                        v-model.number="form.returnPerPlate"
                        type="number"
                        label="Pengembalian per Piring"
                        outlined
                        dense
                        prefix="Rp"
                        :rules="[val => val > 0 || 'Harus lebih dari 0']"
                      />
                    </div>
                  </div>
                  <div class="text-caption text-grey-6 q-mt-sm">
                    Default: Harga Rp 9.500 = Penghasilan Rp 7.000 + Pengembalian Rp 2.500
                  </div>
                </q-card-section>
              </q-card>
            </q-expansion-item>

            <!-- Preview Kalkulasi (hanya untuk pemilik) -->
            <q-card v-if="isPemilik" flat bordered class="bg-grey-1">
              <q-card-section class="q-py-sm">
                <div class="text-subtitle2 q-mb-sm">Preview Kalkulasi</div>

                <div class="row q-col-gutter-sm text-body2">
                  <div class="col-6">
                    <div class="text-grey-7">Total Piring:</div>
                    <div class="text-weight-bold text-primary">
                      {{ totalPlatesPreview.toLocaleString('id-ID') }}
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="text-grey-7">Nilai Piring:</div>
                    <div class="text-weight-bold text-positive">
                      {{ formatCurrency(totalTransferPreview) }}
                    </div>
                  </div>
                </div>

                <q-separator class="q-my-sm" />

                <!-- SGP -->
                <div class="text-caption text-blue q-mb-xs">SGP ({{ form.sgpCount }} piring)</div>
                <div class="row q-col-gutter-xs text-caption">
                  <div class="col-6">Penghasilan: {{ formatCurrency(sgpIncomePreview) }}</div>
                  <div class="col-6">Pengembalian: {{ formatCurrency(sgpReturnPreview) }}</div>
                </div>

                <!-- Hirose -->
                <div class="text-caption text-purple q-mt-sm q-mb-xs">Hirose ({{ form.hiroseCount }} piring)</div>
                <div class="row q-col-gutter-xs text-caption">
                  <div class="col-6">Penghasilan: {{ formatCurrency(hiroseIncomePreview) }}</div>
                  <div class="col-6">Pengembalian: {{ formatCurrency(hiroseReturnPreview) }}</div>
                </div>

                <q-separator class="q-my-sm" />

                <div class="row q-col-gutter-sm text-body2">
                  <div class="col-6">
                    <div class="text-grey-7">Total Penghasilan Bersih:</div>
                    <div class="text-weight-bold text-teal">
                      {{ formatCurrency(totalNetIncomePreview) }}
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="text-grey-7">Total Pengembalian Bersih:</div>
                    <div class="text-weight-bold text-orange">
                      {{ formatCurrency(totalNetReturnPreview) }}
                    </div>
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <div class="row justify-end q-gutter-sm q-mt-md">
              <q-btn label="Batal" flat v-close-popup />
              <q-btn
                type="submit"
                label="Simpan"
                color="primary"
                :loading="saving"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/auth-store'
import plateCountService from 'src/services/plateCount'

const $q = useQuasar()
const authStore = useAuthStore()

// Check if user is pemilik - comprehensive check
const isPemilik = computed(() => {
  const user = authStore.user
  if (!user) return false

  // Check multiple possible field names
  return user.role === 1 ||
         user.role === 'pemilik' ||
         user.roleId === 1 ||
         user.role_id === 1 ||
         user.userRole?.name === 'pemilik' ||
         authStore.isPemilik
})

// Shift options
const shiftOptions = [
  { label: 'Shift 1', value: 'shift1' },
  { label: 'Shift 2', value: 'shift2' },
  { label: 'Tambahan S1', value: 'tambahan_s1' },
  { label: 'Tambahan S2', value: 'tambahan_s2' }
]

// Helper functions
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

function getShiftIcon(shift) {
  const icons = {
    shift1: 'wb_sunny',
    shift2: 'nights_stay',
    tambahan_s1: 'add_circle',
    tambahan_s2: 'add_circle_outline'
  }
  return icons[shift] || 'schedule'
}

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

// State
const loading = ref(false)
const saving = ref(false)
const showDialog = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const plateCounts = ref([])
const filterDate = ref(null)
const filterShift = ref(null)

// Week selector helper functions
function getMondayOfWeek(date, weekOffset = 0) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) + (weekOffset * 7) // Adjust to Monday
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
  customStartDate.value = monday.toISOString().split('T')[0]
  customEndDate.value = sunday.toISOString().split('T')[0]
  fetchPeriodSummary()
}

// Computed: Selected week number based on start date
const selectedWeekNumber = computed(() => {
  if (!customStartDate.value) return '-'
  return getWeekNumber(new Date(customStartDate.value))
})

// Period summary - default ke minggu ini (Senin-Minggu)
const mondayThisWeek = getMondayOfWeek(new Date())
const sundayThisWeek = getSundayOfWeek(new Date())
const customStartDate = ref(mondayThisWeek.toISOString().split('T')[0])
const customEndDate = ref(sundayThisWeek.toISOString().split('T')[0])
const periodSummary = ref({
  totalPlates: 0,
  totalSgpCount: 0,
  totalHiroseCount: 0,
  totalTransfer: 0,
  totalNetIncome: 0,
  totalIncomeTax: 0,
  totalNetReturn: 0,
  totalReturnTax: 0,
  recordCount: 0
})

// Computed: Jumlah yang ditransfer pabrik = Nilai Piring - Pajak - Admin
const amountFromFactory = computed(() => {
  return (periodSummary.value.totalTransfer || 0) -
         (periodSummary.value.totalTax || 0) -
         (periodSummary.value.totalAdminFee || 0)
})

// Auto-refresh untuk sinkronisasi data antar user
const autoRefresh = ref(true)
const autoRefreshCountdown = ref(30)
const AUTO_REFRESH_INTERVAL = 30 // seconds
let refreshIntervalId = null
let countdownIntervalId = null

// Pagination
const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0
})

// Table columns
const columns = computed(() => {
  const baseCols = [
    { name: 'date', label: 'Tanggal', field: 'date', format: formatDate, align: 'left', sortable: true },
    { name: 'shift', label: 'Shift', field: 'shift', align: 'center' },
    { name: 'sgpCount', label: 'SGP', field: 'sgpCount', align: 'center' },
    { name: 'hiroseCount', label: 'Hirose', field: 'hiroseCount', align: 'center' },
    { name: 'totalPlates', label: 'Total', field: 'totalPlates', align: 'center' }
  ]

  if (isPemilik.value) {
    baseCols.push(
      { name: 'totalTransfer', label: 'Transfer', field: 'totalTransfer', align: 'right' },
      { name: 'totalNetIncome', label: 'Penghasilan', field: 'totalNetIncome', align: 'right' },
      { name: 'totalNetReturn', label: 'Pengembalian', field: 'totalNetReturn', align: 'right' }
    )
  }

  baseCols.push({ name: 'actions', label: 'Aksi', field: 'actions', align: 'center' })

  return baseCols
})

// Grouped data by date
const groupedPlateCounts = computed(() => {
  const result = []
  let currentDate = null

  plateCounts.value.forEach(row => {
    // If new date, add group header
    if (row.date !== currentDate) {
      currentDate = row.date
      // Calculate total for this date
      const dateRows = plateCounts.value.filter(r => r.date === currentDate)
      const dateTotalPlates = dateRows.reduce((sum, r) => sum + (parseInt(r.totalPlates) || 0), 0)

      result.push({
        id: `header-${currentDate}`,
        isGroupHeader: true,
        date: currentDate,
        totalPlates: dateTotalPlates
      })
    }
    // Add data row
    result.push({
      ...row,
      isGroupHeader: false
    })
  })

  return result
})

// Default form values
const defaultForm = {
  date: new Date().toISOString().split('T')[0],
  shift: 'shift1',
  sgpCount: 0,
  hiroseCount: 0,
  pricePerPlate: 9500,
  incomePerPlate: 7000,
  returnPerPlate: 2500,
  taxPercentage: 2
}

// State untuk expand pengaturan harga
const showPriceSettings = ref(false)

const form = ref({ ...defaultForm })

// Computed preview values
const totalPlatesPreview = computed(() => {
  return (parseInt(form.value.sgpCount) || 0) + (parseInt(form.value.hiroseCount) || 0)
})

const totalTransferPreview = computed(() => {
  return totalPlatesPreview.value * form.value.pricePerPlate
})

const sgpIncomePreview = computed(() => {
  const gross = (parseInt(form.value.sgpCount) || 0) * form.value.incomePerPlate
  const tax = gross * (form.value.taxPercentage / 100)
  return gross - tax
})

const sgpReturnPreview = computed(() => {
  const gross = (parseInt(form.value.sgpCount) || 0) * form.value.returnPerPlate
  const tax = gross * (form.value.taxPercentage / 100)
  return gross - tax
})

const hiroseIncomePreview = computed(() => {
  const gross = (parseInt(form.value.hiroseCount) || 0) * form.value.incomePerPlate
  const tax = gross * (form.value.taxPercentage / 100)
  return gross - tax
})

const hiroseReturnPreview = computed(() => {
  const gross = (parseInt(form.value.hiroseCount) || 0) * form.value.returnPerPlate
  const tax = gross * (form.value.taxPercentage / 100)
  return gross - tax
})

const totalNetIncomePreview = computed(() => {
  return sgpIncomePreview.value + hiroseIncomePreview.value
})

const totalNetReturnPreview = computed(() => {
  return sgpReturnPreview.value + hiroseReturnPreview.value
})

// Functions
async function fetchPeriodSummary() {
  const startDate = customStartDate.value
  const endDate = customEndDate.value

  if (!startDate || !endDate) {
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
    shift: shift || 'shift1'
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
      sgpCount: parseInt(data.sgpCount),
      hiroseCount: parseInt(data.hiroseCount),
      pricePerPlate: parseFloat(data.pricePerPlate),
      incomePerPlate: parseFloat(data.incomePerPlate),
      returnPerPlate: parseFloat(data.returnPerPlate),
      taxPercentage: parseFloat(data.taxPercentage)
    }
    showDialog.value = true
  } catch (error) {
    console.error('Error loading data:', error)
    $q.notify({
      type: 'negative',
      message: 'Gagal memuat data'
    })
  } finally {
    loading.value = false
  }
}

async function saveData() {
  saving.value = true
  try {
    const payload = {
      date: form.value.date,
      shift: form.value.shift,
      sgpCount: parseInt(form.value.sgpCount) || 0,
      hiroseCount: parseInt(form.value.hiroseCount) || 0,
      pricePerPlate: form.value.pricePerPlate,
      incomePerPlate: form.value.incomePerPlate,
      returnPerPlate: form.value.returnPerPlate,
      taxPercentage: form.value.taxPercentage
    }

    if (isEditing.value) {
      await plateCountService.update(editingId.value, payload)
      $q.notify({
        type: 'positive',
        message: 'Data berhasil diperbarui'
      })
    } else {
      await plateCountService.create(payload)
      $q.notify({
        type: 'positive',
        message: 'Data berhasil disimpan'
      })
    }

    showDialog.value = false
    await fetchData()
    await fetchPeriodSummary()
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

async function confirmDelete(row) {
  $q.dialog({
    title: 'Konfirmasi Hapus',
    message: `Apakah Anda yakin ingin menghapus data ${getShiftLabel(row.shift)} tanggal ${formatDate(row.date)}?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await plateCountService.delete(row.id)
      $q.notify({
        type: 'positive',
        message: 'Data berhasil dihapus'
      })
      await fetchData()
      await fetchPeriodSummary()
    } catch (error) {
      console.error('Error deleting:', error)
      $q.notify({
        type: 'negative',
        message: 'Gagal menghapus data'
      })
    }
  })
}

// Refresh all data
async function refreshAllData() {
  await fetchData()
  await fetchPeriodSummary()
  autoRefreshCountdown.value = AUTO_REFRESH_INTERVAL
}

// Start auto-refresh timer
function startAutoRefresh() {
  stopAutoRefresh()

  // Countdown timer
  countdownIntervalId = setInterval(() => {
    autoRefreshCountdown.value--
    if (autoRefreshCountdown.value <= 0) {
      autoRefreshCountdown.value = AUTO_REFRESH_INTERVAL
    }
  }, 1000)

  // Data refresh timer
  refreshIntervalId = setInterval(() => {
    refreshAllData()
  }, AUTO_REFRESH_INTERVAL * 1000)
}

// Stop auto-refresh timer
function stopAutoRefresh() {
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId)
    refreshIntervalId = null
  }
  if (countdownIntervalId) {
    clearInterval(countdownIntervalId)
    countdownIntervalId = null
  }
}

// Watch auto-refresh toggle
watch(autoRefresh, (newVal) => {
  if (newVal) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
})

// Lifecycle
onMounted(() => {
  fetchData()
  fetchPeriodSummary()

  // Start auto-refresh if enabled (only for pemilik)
  if (isPemilik.value && autoRefresh.value) {
    startAutoRefresh()
  }
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.q-card {
  border-radius: 8px;
}
</style>
