<template>
  <q-page padding>
    <q-pull-to-refresh @refresh="onRefresh">
      <div class="row items-center q-mb-md">
        <div class="col">
          <h5 class="q-my-none">Transaksi Warung</h5>
          <p class="text-grey-7 q-mb-none">Kelola transaksi pemasukan dan pengeluaran</p>
        </div>
      </div>

    <!-- Ringkasan & Filter -->
    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6">
            <q-icon name="analytics" class="q-mr-sm" />
            Ringkasan
          </div>
          <div class="row q-gutter-sm items-center" v-if="authStore.isPemilik">
            <q-btn-toggle
              v-model="summaryPeriod"
              toggle-color="primary"
              :options="periodOptions"
              unelevated
              rounded
              dense
              @update:model-value="onPeriodChange"
            />
          </div>
        </div>

        <!-- Period Label - Only for Pemilik -->
        <div class="text-subtitle2 text-grey-7 q-mb-md" v-if="authStore.isPemilik">
          <q-icon name="date_range" class="q-mr-xs" />
          {{ periodLabel }}
        </div>

        <!-- Summary Cards - Pemilik -->
        <div class="row q-col-gutter-md q-mb-md" v-if="summary && authStore.isPemilik">
          <div class="col-6 col-sm-3">
            <q-card flat bordered class="bg-green-1">
              <q-card-section class="text-center q-pa-sm">
                <div class="text-h6 text-positive">{{ formatCurrency(summary.totalIncome) }}</div>
                <div class="text-caption text-grey-7">Pemasukan</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6 col-sm-3">
            <q-card flat bordered class="bg-red-1">
              <q-card-section class="text-center q-pa-sm">
                <div class="text-h6 text-negative">{{ formatCurrency(summary.totalExpense) }}</div>
                <div class="text-caption text-grey-7">Pengeluaran</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6 col-sm-3">
            <q-card flat bordered class="bg-blue-1">
              <q-card-section class="text-center q-pa-sm">
                <div class="text-h6 text-primary">{{ formatCurrency(summary.profit) }}</div>
                <div class="text-caption text-grey-7">Keuntungan</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6 col-sm-3">
            <q-card flat bordered class="bg-purple-1">
              <q-card-section class="text-center q-pa-sm">
                <div class="text-h6 text-purple-9">{{ summary.count }}</div>
                <div class="text-caption text-grey-7">Transaksi</div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Summary Cards - Pegawai (Hanya jumlah transaksi) -->
        <div class="row q-col-gutter-md q-mb-md" v-if="summary && !authStore.isPemilik">
          <div class="col-12 col-sm-4">
            <q-card flat bordered class="bg-blue-1">
              <q-card-section class="text-center q-pa-sm">
                <div class="text-h4 text-primary">{{ summary.count }}</div>
                <div class="text-caption text-grey-7">Transaksi Anda</div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Filter Section -->
        <q-separator class="q-mb-md" />
        <div class="row q-col-gutter-sm items-end">
          <div class="col-12 col-sm-3">
            <q-input
              v-model="filters.search"
              label="Cari transaksi..."
              dense
              outlined
              @keyup.enter="applyFilters"
            >
              <template v-slot:append>
                <q-icon name="search" size="sm" />
              </template>
            </q-input>
          </div>

          <div class="col-6 col-sm-2">
            <q-select
              v-model="filters.type"
              label="Tipe"
              dense
              outlined
              :options="typeOptions"
              emit-value
              map-options
              clearable
              @update:model-value="loadCategories"
            />
          </div>

          <div class="col-6 col-sm-2">
            <q-select
              v-model="filters.category"
              label="Kategori"
              dense
              outlined
              :options="filteredCategoryOptions"
              emit-value
              map-options
              clearable
              :loading="categoriesLoading"
            />
          </div>

          <div class="col-12 col-sm-3">
            <q-input
              v-model="dateRangeText"
              label="Rentang Tanggal"
              dense
              outlined
              readonly
              clearable
              @clear="clearDateRange"
            >
              <template v-slot:prepend>
                <q-icon name="event" class="cursor-pointer" size="sm">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date
                      v-model="dateRange"
                      range
                      mask="YYYY-MM-DD"
                    >
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="OK" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div class="col-auto">
            <q-btn
              color="primary"
              icon="search"
              dense
              @click="applyFilters"
              class="q-mr-xs"
            />
            <q-btn
              color="grey"
              icon="refresh"
              dense
              outline
              @click="resetFilters"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Transactions List -->
    <q-card>
      <q-card-section class="q-pa-sm q-pa-md-md">
        <!-- Desktop Table View -->
        <q-table
          :rows="transactions"
          :columns="columns"
          row-key="id"
          :loading="transactionStore.isLoading"
          :pagination="pagination"
          @request="onRequest"
          binary-state-sort
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
              <span :class="props.row.type === 'masuk' ? 'text-positive' : 'text-negative'">
                {{ props.row.type === 'masuk' ? '+' : '-' }}{{ formatCurrency(props.value) }}
              </span>
            </q-td>
          </template>

          <template v-slot:body-cell-transactionDate="props">
            <q-td :props="props">
              {{ formatDateOnly(props.value) }}
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                flat
                round
                dense
                color="info"
                icon="visibility"
                @click="viewTransaction(props.row)"
                size="sm"
              >
                <q-tooltip>Lihat</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                dense
                color="warning"
                icon="edit"
                @click="editTransaction(props.row)"
                v-if="canEdit(props.row)"
                size="sm"
              >
                <q-tooltip>Edit</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                dense
                color="negative"
                icon="delete"
                @click="deleteTransaction(props.row)"
                v-if="authStore.isPemilik"
                size="sm"
              >
                <q-tooltip>Hapus</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>

        <!-- Mobile Card View -->
        <div class="lt-sm">
          <div v-if="transactionStore.isLoading" class="text-center q-py-lg">
            <q-spinner color="primary" size="3em" />
            <div class="text-grey q-mt-sm">Memuat transaksi...</div>
          </div>

          <div v-else-if="transactions.length === 0" class="text-center text-grey-5 q-py-lg">
            <q-icon name="inbox" size="3em" color="grey-5" />
            <div class="q-mt-sm">Tidak ada transaksi</div>
          </div>

          <div v-else class="q-gutter-sm">
            <q-card
              v-for="transaction in transactions"
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

                <div class="row q-col-gutter-xs text-caption text-grey-7 q-mb-sm">
                  <div class="col-auto">
                    <q-icon name="category" size="xs" class="q-mr-xs" />
                    {{ transaction.category }}
                  </div>
                  <div class="col-auto">
                    <q-icon name="event" size="xs" class="q-mr-xs" />
                    {{ formatDateOnly(transaction.transactionDate) }}
                  </div>
                  <div v-if="transaction.user && authStore.isPemilik" class="col-auto">
                    <q-icon name="person" size="xs" class="q-mr-xs" />
                    {{ transaction.user.fullName }}
                  </div>
                </div>

                <div class="row q-gutter-xs">
                  <q-btn
                    flat
                    dense
                    color="info"
                    icon="visibility"
                    label="Lihat"
                    @click="viewTransaction(transaction)"
                    size="sm"
                    no-caps
                  />
                  <q-btn
                    v-if="canEdit(transaction)"
                    flat
                    dense
                    color="warning"
                    icon="edit"
                    label="Edit"
                    @click="editTransaction(transaction)"
                    size="sm"
                    no-caps
                  />
                  <q-btn
                    v-if="authStore.isPemilik"
                    flat
                    dense
                    color="negative"
                    icon="delete"
                    label="Hapus"
                    @click="deleteTransaction(transaction)"
                    size="sm"
                    no-caps
                  />
                </div>
              </q-card-section>
            </q-card>

            <!-- Mobile Pagination -->
            <div class="row justify-center q-mt-md">
              <q-pagination
                v-model="pagination.page"
                :max="Math.ceil(pagination.rowsNumber / pagination.rowsPerPage)"
                :max-pages="5"
                direction-links
                boundary-links
                @update:model-value="onPageChange"
                color="primary"
                size="sm"
              />
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Floating Action Button with Auto-hide -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <transition name="fab-slide">
        <q-btn
          v-show="showFab"
          fab
          icon="add"
          color="primary"
          @click="openAddDialog"
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
      </transition>
    </q-page-sticky>

    <!-- Mini FAB to show main FAB when hidden -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]" v-show="!showFab && fabHiddenByScroll">
      <q-btn
        round
        size="sm"
        color="grey-7"
        icon="add"
        class="mini-fab"
        @click="showFab = true; fabHiddenByScroll = false"
      >
        <q-tooltip>Tampilkan tombol</q-tooltip>
      </q-btn>
    </q-page-sticky>

    <!-- View Transaction Dialog -->
    <q-dialog v-model="showViewDialog">
      <q-card style="width: 400px; max-width: 95vw">
        <q-card-section class="q-pb-none">
          <div class="row items-center">
            <q-icon name="receipt_long" size="sm" color="primary" class="q-mr-sm" />
            <span class="text-subtitle1 text-weight-medium">Detail Transaksi</span>
            <q-space />
            <q-btn icon="close" flat round dense size="sm" v-close-popup />
          </div>
        </q-card-section>

        <q-card-section class="q-pt-md" v-if="selectedTransaction">
          <div class="q-gutter-sm">
            <div class="row items-center q-mb-sm">
              <q-chip
                :color="selectedTransaction.type === 'masuk' ? 'positive' : 'negative'"
                text-color="white"
                size="md"
                dense
              >
                {{ selectedTransaction.type === 'masuk' ? 'Pemasukan' : 'Pengeluaran' }}
              </q-chip>
              <q-space />
              <span
                class="text-h6 text-weight-bold"
                :class="selectedTransaction.type === 'masuk' ? 'text-positive' : 'text-negative'"
              >
                {{ selectedTransaction.type === 'masuk' ? '+' : '-' }}{{ formatCurrency(selectedTransaction.amount) }}
              </span>
            </div>

            <q-separator class="q-my-sm" />

            <div class="row q-col-gutter-sm text-body2">
              <div class="col-6">
                <div class="text-caption text-grey-7">Kategori</div>
                <div class="text-weight-medium">{{ selectedTransaction.category || '-' }}</div>
              </div>
              <div class="col-6">
                <div class="text-caption text-grey-7">Tanggal</div>
                <div class="text-weight-medium">{{ formatDateOnly(selectedTransaction.transactionDate) }}</div>
              </div>
            </div>

            <div class="q-mt-sm" v-if="selectedTransaction.description">
              <div class="text-caption text-grey-7">Deskripsi</div>
              <div class="text-body2">{{ selectedTransaction.description }}</div>
            </div>

            <div class="q-mt-sm" v-if="selectedTransaction.user && authStore.isPemilik">
              <div class="text-caption text-grey-7">Dibuat oleh</div>
              <div class="text-body2">{{ selectedTransaction.user.fullName }}</div>
            </div>
          </div>
        </q-card-section>

        <q-card-actions class="q-px-md q-py-sm bg-grey-2">
          <q-space />
          <q-btn flat dense label="Tutup" color="grey-7" v-close-popup class="q-px-md" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Input/Edit Transaction Dialog -->
    <q-dialog v-model="showFormDialog" persistent>
      <q-card style="width: 420px; max-width: 95vw">
        <q-card-section class="q-pb-none">
          <div class="row items-center">
            <q-icon name="receipt" size="sm" color="primary" class="q-mr-sm" />
            <span class="text-subtitle1 text-weight-medium">
              {{ isEditing ? 'Edit Transaksi' : 'Tambah Transaksi' }}
            </span>
            <q-space />
            <q-btn icon="close" flat round dense size="sm" v-close-popup />
          </div>
        </q-card-section>

        <q-card-section class="q-pt-md q-pb-sm">
          <q-form @submit.prevent="saveTransaction" ref="transactionFormRef">
            <!-- Row 1: Tipe Transaksi -->
            <div class="q-mb-sm">
              <q-btn-toggle
                v-model="form.type"
                spread
                no-caps
                unelevated
                toggle-color="primary"
                color="white"
                text-color="grey-7"
                :options="[
                  { label: 'Pemasukan', value: 'masuk', icon: 'trending_up' },
                  { label: 'Pengeluaran', value: 'keluar', icon: 'trending_down' }
                ]"
                class="full-width"
              />
            </div>

            <!-- Row 2: Kategori & Tanggal -->
            <div class="row q-col-gutter-sm q-mb-sm">
              <div class="col-7">
                <q-select
                  v-model="form.category"
                  label="Kategori *"
                  :options="formCategoryOptions"
                  emit-value
                  map-options
                  outlined
                  dense
                  :rules="[val => !!val || 'Kategori wajib dipilih']"
                  :loading="formCategoriesLoading"
                  :disable="!form.type"
                />
              </div>
              <div class="col-5">
                <q-input
                  v-model="form.transactionDate"
                  type="date"
                  label="Tanggal *"
                  outlined
                  dense
                  :rules="[val => !!val || 'Tanggal wajib diisi']"
                />
              </div>
            </div>

            <!-- Row 3: Jumlah -->
            <q-input
              :model-value="formatCurrencyInput(form.amount)"
              @update:model-value="updateFormAmount"
              label="Jumlah *"
              type="text"
              inputmode="numeric"
              outlined
              dense
              prefix="Rp"
              class="q-mb-sm"
              input-class="text-right text-weight-medium"
              :rules="[
                val => form.amount !== null && form.amount !== '' || 'Jumlah wajib diisi',
                val => form.amount > 0 || 'Jumlah harus lebih dari 0'
              ]"
            />

            <!-- Row 4: Deskripsi -->
            <q-input
              v-model="form.description"
              type="textarea"
              label="Deskripsi (opsional)"
              outlined
              dense
              rows="2"
              autogrow
              counter
              maxlength="500"
            />
          </q-form>
        </q-card-section>

        <q-card-actions class="q-px-md q-py-sm bg-grey-2">
          <q-space />
          <q-btn flat dense label="Batal" color="grey-7" v-close-popup class="q-px-md" />
          <q-btn
            unelevated
            dense
            color="primary"
            label="Simpan"
            :loading="formSaving"
            @click="saveTransaction"
            class="q-px-lg"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    </q-pull-to-refresh>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive, watch } from 'vue'
import { useAuthStore } from 'stores/auth-store'
import { useTransactionStore } from 'stores/transaction-store'
import { formatCurrency, formatDateOnly, formatDateShort } from 'src/utils/format'
import categoryService from 'src/services/category'
import reportService from 'src/services/report'

const authStore = useAuthStore()
const transactionStore = useTransactionStore()

// Summary period
const summaryPeriod = ref('month')
const summary = ref(null)

const periodOptions = [
  { label: 'Hari Ini', value: 'today' },
  { label: 'Minggu', value: 'week' },
  { label: 'Bulan', value: 'month' }
]

const periodLabel = computed(() => {
  const today = new Date()
  switch (summaryPeriod.value) {
    case 'today':
      return today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    case 'week':
      return 'Minggu Ini'
    case 'month':
      return today.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
    default:
      return ''
  }
})

const getDateRangeForPeriod = () => {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  switch (summaryPeriod.value) {
    case 'today':
      return { startDate: todayStr, endDate: todayStr }
    case 'week': {
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      return { startDate: weekAgo.toISOString().split('T')[0], endDate: todayStr }
    }
    case 'month': {
      const monthAgo = new Date(today)
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      return { startDate: monthAgo.toISOString().split('T')[0], endDate: todayStr }
    }
    default:
      return { startDate: todayStr, endDate: todayStr }
  }
}

const fetchSummary = async () => {
  // Hanya pemilik yang bisa akses report summary
  if (!authStore.isPemilik) {
    // Untuk pegawai, hitung dari jumlah transaksi yang ada
    summary.value = {
      totalIncome: 0,
      totalExpense: 0,
      profit: 0,
      count: transactions.value?.length || 0
    }
    return
  }

  try {
    const { startDate, endDate } = getDateRangeForPeriod()
    const data = await reportService.getRangeReport(startDate, endDate)
    summary.value = {
      totalIncome: data.summary?.totalIncome || 0,
      totalExpense: data.summary?.totalExpense || 0,
      profit: data.summary?.profit || 0,
      count: data.summary?.totalTransactions || 0
    }
  } catch (error) {
    console.error('Error fetching summary:', error)
    summary.value = { totalIncome: 0, totalExpense: 0, profit: 0, count: 0 }
  }
}

const onPeriodChange = () => {
  if (authStore.isPemilik) {
    fetchSummary()
  }
}

// FAB visibility control
const showFab = ref(true)
const fabHiddenByScroll = ref(false)
let lastScrollTop = 0
let scrollTimeout = null

const handleScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop

  // Hide FAB when scrolling down, show when scrolling up
  if (scrollTop > lastScrollTop && scrollTop > 100) {
    // Scrolling down
    showFab.value = false
    fabHiddenByScroll.value = true
  } else {
    // Scrolling up
    showFab.value = true
    fabHiddenByScroll.value = false
  }

  lastScrollTop = scrollTop <= 0 ? 0 : scrollTop

  // Auto show FAB after user stops scrolling
  if (scrollTimeout) clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(() => {
    showFab.value = true
    fabHiddenByScroll.value = false
  }, 2000) // Show after 2 seconds of no scrolling
}

const showViewDialog = ref(false)
const selectedTransaction = ref(null)
const categoriesLoading = ref(false)
const categoryOptions = ref([])

// Form Dialog State
const showFormDialog = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const formSaving = ref(false)
const formCategoriesLoading = ref(false)
const formCategoryOptions = ref([])
const transactionFormRef = ref(null)

// Helper function to get date string in local timezone (YYYY-MM-DD)
const getLocalDateString = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const form = ref({
  type: 'masuk',
  amount: null,
  description: '',
  category: '',
  transactionDate: getLocalDateString(new Date())
})

// Format currency for input display
const formatCurrencyInput = (value) => {
  if (!value) return ''
  const numValue = typeof value === 'string' ? parseInt(value.toString().replace(/\D/g, '')) : value
  if (isNaN(numValue)) return ''
  return numValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

// Update amount value from formatted input
const updateFormAmount = (value) => {
  const cleanedValue = value.replace(/\D/g, '')
  form.value.amount = cleanedValue ? parseInt(cleanedValue) : null
}

// Watch form type changes
watch(() => form.value.type, async (newType) => {
  if (newType) {
    await loadFormCategories()
    form.value.category = ''
  }
})

const loadFormCategories = async () => {
  if (!form.value.type) {
    formCategoryOptions.value = []
    return
  }

  try {
    formCategoriesLoading.value = true
    const response = await categoryService.getCategories(form.value.type)

    if (response.data && response.data.data && response.data.data.categories) {
      formCategoryOptions.value = response.data.data.categories.map(cat => ({
        label: cat.name,
        value: cat.name
      }))
    } else {
      formCategoryOptions.value = []
    }
  } catch (error) {
    console.error('Error loading form categories:', error)
    formCategoryOptions.value = []
  } finally {
    formCategoriesLoading.value = false
  }
}

const resetForm = () => {
  form.value = {
    type: 'masuk',
    amount: null,
    description: '',
    category: '',
    transactionDate: getLocalDateString(new Date())
  }
  isEditing.value = false
  editingId.value = null
}

const openAddDialog = async () => {
  resetForm()
  await loadFormCategories()
  showFormDialog.value = true
}

const saveTransaction = async () => {
  try {
    formSaving.value = true

    // Validate form
    if (!form.value.type || !form.value.category || !form.value.amount || !form.value.transactionDate) {
      alert('Mohon lengkapi semua field yang wajib diisi')
      return
    }

    // Use current time
    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
    const localDateTimeString = `${form.value.transactionDate}T${currentTime}`

    const parts = localDateTimeString.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/)
    const year = parseInt(parts[1])
    const month = parseInt(parts[2]) - 1
    const day = parseInt(parts[3])
    const hours = parseInt(parts[4])
    const minutes = parseInt(parts[5])
    const seconds = parseInt(parts[6])

    const transactionDateTime = new Date(year, month, day, hours, minutes, seconds)
    const tzOffset = transactionDateTime.getTimezoneOffset() * 60000
    const localISOString = new Date(transactionDateTime.getTime() - tzOffset).toISOString()

    const transactionData = {
      type: form.value.type,
      amount: form.value.amount,
      description: form.value.description?.trim() || null,
      category: form.value.category,
      transactionDate: localISOString
    }

    if (isEditing.value) {
      await transactionStore.updateTransaction(editingId.value, transactionData)
      alert('Transaksi berhasil diupdate')
    } else {
      await transactionStore.createTransaction(transactionData)
      alert('Transaksi berhasil dibuat')
    }

    showFormDialog.value = false
    resetForm()
    await fetchTransactions()
    await fetchSummary()
  } catch (error) {
    console.error('Save error:', error)
    const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Gagal menyimpan transaksi'
    alert(errorMsg)
  } finally {
    formSaving.value = false
  }
}
const filteredCategoryOptions = ref([])

const filters = reactive({
  search: '',
  type: null,
  category: '',
  startDate: null,
  endDate: null
})

const typeOptions = [
  { label: 'Pemasukan', value: 'masuk' },
  { label: 'Pengeluaran', value: 'keluar' }
]

const dateRange = ref(null)
const dateRangeText = computed(() => {
  if (!dateRange.value) return ''
  if (typeof dateRange.value === 'string') {
    // Single date selected
    return formatDateShort(dateRange.value)
  }
  if (dateRange.value.from && dateRange.value.to) {
    // Date range: check if same date
    if (dateRange.value.from === dateRange.value.to) {
      return formatDateShort(dateRange.value.from)
    }
    return `${formatDateShort(dateRange.value.from)} - ${formatDateShort(dateRange.value.to)}`
  }
  if (dateRange.value.from) {
    // Only from date selected
    return formatDateShort(dateRange.value.from)
  }
  return ''
})

const clearDateRange = () => {
  dateRange.value = null
  filters.startDate = null
  filters.endDate = null
}

const loadCategories = async () => {
  if (!filters.type) {
    categoryOptions.value = []
    filteredCategoryOptions.value = []
    filters.category = null
    return
  }

  try {
    categoriesLoading.value = true
    const response = await categoryService.getCategories(filters.type)

    if (response.data && response.data.data && response.data.data.categories) {
      categoryOptions.value = response.data.data.categories.map(cat => ({
        label: cat.name,
        value: cat.name
      }))
      filteredCategoryOptions.value = categoryOptions.value
    } else {
      categoryOptions.value = []
      filteredCategoryOptions.value = []
    }
  } catch (error) {
    console.error('Error loading categories:', error)
    categoryOptions.value = []
    filteredCategoryOptions.value = []
  } finally {
    categoriesLoading.value = false
  }
}

watch(dateRange, (newVal) => {
  if (!newVal) {
    filters.startDate = null
    filters.endDate = null
  } else if (typeof newVal === 'string') {
    // Single date selected
    filters.startDate = newVal
    filters.endDate = newVal
  } else if (typeof newVal === 'object' && newVal.from) {
    // Date range selected
    filters.startDate = newVal.from
    filters.endDate = newVal.to || newVal.from
  }
})

const columns = [
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
    field: 'type',
    sortable: true
  },
  {
    name: 'description',
    label: 'Deskripsi',
    align: 'left',
    field: 'description',
    sortable: true
  },
  {
    name: 'category',
    label: 'Kategori',
    align: 'left',
    field: 'category',
    sortable: true
  },
  {
    name: 'amount',
    label: 'Jumlah',
    align: 'right',
    field: 'amount',
    sortable: true
  },
  {
    name: 'actions',
    label: 'Aksi',
    align: 'center',
    field: 'actions'
  }
]

// Add user column for pemilik
if (authStore.isPemilik) {
  columns.splice(5, 0, {
    name: 'user',
    label: 'Dibuat oleh',
    align: 'left',
    field: row => row.user?.fullName || '-',
    sortable: false
  })
}

const transactions = computed(() => transactionStore.transactions)
const pagination = computed(() => ({
  page: transactionStore.pagination.page,
  rowsPerPage: transactionStore.pagination.limit,
  rowsNumber: transactionStore.pagination.total
}))

const canEdit = (transaction) => {
  if (authStore.isPemilik) return true
  if (authStore.isPegawai) return transaction.userId === authStore.user?.id
  return false
}

const onRefresh = async (done) => {
  await fetchTransactions()
  done()
}

const applyFilters = () => {
  // Set filters with proper null values for empty fields
  const filtersToApply = {
    search: filters.search || null,
    type: filters.type || null,
    category: filters.category || null,
    startDate: filters.startDate || null,
    endDate: filters.endDate || null
  }

  // Use clearFilters first to reset, then set new values
  transactionStore.clearFilters()
  transactionStore.setFilters(filtersToApply)
  fetchTransactions()
}

const resetFilters = () => {
  // Reset local filter state
  filters.search = ''
  filters.type = null
  filters.category = null
  filters.startDate = null
  filters.endDate = null
  dateRange.value = null
  categoryOptions.value = []
  filteredCategoryOptions.value = []

  // Use clearFilters to properly reset store filters
  transactionStore.clearFilters()
  fetchTransactions()
}

const fetchTransactions = async () => {
  try {
    await transactionStore.fetchTransactions()
    // Update summary untuk pegawai setelah transaksi diambil
    if (!authStore.isPemilik) {
      summary.value = {
        totalIncome: 0,
        totalExpense: 0,
        profit: 0,
        count: transactions.value?.length || 0
      }
    }
  } catch (error) {
    console.error('Fetch transactions error:', error)
    alert(typeof error === 'string' ? error : 'Gagal mengambil data transaksi')
  }
}

const onRequest = (props) => {
  transactionStore.setPage(props.pagination.page)
  fetchTransactions()
}

const onPageChange = (page) => {
  transactionStore.setPage(page)
  fetchTransactions()
}

const viewTransaction = (transaction) => {
  selectedTransaction.value = transaction
  showViewDialog.value = true
}

const editTransaction = async (transaction) => {
  isEditing.value = true
  editingId.value = transaction.id

  // Set type first
  form.value.type = transaction.type

  // Load categories
  await loadFormCategories()

  // Parse transaction date
  const transactionDate = new Date(transaction.transactionDate)

  // Set form values
  form.value = {
    type: transaction.type,
    amount: parseFloat(transaction.amount),
    description: transaction.description || '',
    category: transaction.category,
    transactionDate: getLocalDateString(transactionDate)
  }

  showFormDialog.value = true
}

const deleteTransaction = async (transaction) => {
  const confirmDelete = confirm('Apakah Anda yakin ingin menghapus transaksi ini?')

  if (confirmDelete) {
    try {
      await transactionStore.deleteTransaction(transaction.id)
      alert('Transaksi berhasil dihapus')
      // Refresh data after delete
      await fetchTransactions()
    } catch (error) {
      console.error('Delete error:', error)
      alert(typeof error === 'string' ? error : 'Gagal menghapus transaksi')
    }
  }
}

onMounted(() => {
  // Initialize auth store first
  if (!authStore.isInitialized) {
    authStore.initializeAuth()
  }

  // Fetch summary
  fetchSummary()

  // Then fetch transactions
  fetchTransactions()

  // Add scroll listener for FAB auto-hide
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  // Cleanup scroll listener
  window.removeEventListener('scroll', handleScroll)
  if (scrollTimeout) clearTimeout(scrollTimeout)
})
</script>

<style scoped>
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

/* FAB slide transition */
.fab-slide-enter-active,
.fab-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fab-slide-enter-from,
.fab-slide-leave-to {
  opacity: 0;
  transform: translateY(60px) scale(0.5);
}

.fab-slide-enter-to,
.fab-slide-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* Mini FAB for restore */
.mini-fab {
  opacity: 0.6;
  transition: all 0.2s ease;
}

.mini-fab:hover {
  opacity: 1;
  transform: scale(1.1);
}
</style>
