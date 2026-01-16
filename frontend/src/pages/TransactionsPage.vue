<template>
  <q-page padding>
    <q-pull-to-refresh @refresh="onRefresh">
      <div class="row items-center q-mb-md">
        <div class="col">
          <h5 class="q-my-none">Transaksi Warung</h5>
          <p class="text-grey-7 q-mb-none">Kelola transaksi pemasukan dan pengeluaran</p>
        </div>
      </div>

    <!-- Ringkasan & Filter (Smart Layout) -->
    <q-card flat bordered class="q-mb-md bg-white rounded-borders">
      <q-card-section class="q-pb-sm">
        <!-- Header & Search Row -->
        <div class="row items-center q-gutter-x-sm">
          <div class="col-grow">
            <q-input
              v-model="filters.search"
              placeholder="Cari transaksi..."
              dense
              outlined
              rounded
              bg-color="grey-1"
              @keyup.enter="applyFilters"
            >
              <template v-slot:prepend>
                <q-icon name="search" color="grey-6" />
              </template>
            </q-input>
          </div>
          <div class="col-auto">
            <q-btn
              :color="showFilters ? 'primary' : 'grey-7'"
              :flat="!showFilters"
              :unelevated="showFilters"
              round
              dense
              icon="tune"
              @click="showFilters = !showFilters"
            >
              <q-tooltip>Filter Lanjutan</q-tooltip>
            </q-btn>
          </div>
          <div class="col-auto">
            <q-btn
              color="grey-7"
              flat
              round
              dense
              icon="refresh"
              @click="resetFilters"
            >
              <q-tooltip>Reset</q-tooltip>
            </q-btn>
          </div>
        </div>

        <!-- Collapsible Advanced Filters -->
        <q-slide-transition>
          <div v-show="showFilters" class="q-mt-sm">
            <div class="row q-col-gutter-sm">
              <div class="col-6 col-sm-3">
                <q-select
                  v-model="filters.type"
                  label="Tipe"
                  dense
                  outlined
                  :options="typeOptions"
                  emit-value
                  map-options
                  clearable
                  bg-color="white"
                  @update:model-value="loadCategories"
                />
              </div>
              <div class="col-6 col-sm-3">
                <q-select
                  v-model="filters.category"
                  label="Kategori"
                  dense
                  outlined
                  :options="filteredCategoryOptions"
                  emit-value
                  map-options
                  clearable
                  bg-color="white"
                  :loading="categoriesLoading"
                  use-input
                  input-debounce="0"
                  @filter="filterCategoryFn"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="dateRangeText"
                  placeholder="Rentang Tanggal"
                  dense
                  outlined
                  readonly
                  bg-color="white"
                  clearable
                  @clear="clearDateRange"
                >
                  <template v-slot:prepend>
                    <q-icon name="event" class="cursor-pointer">
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
              <div class="col-12 text-right">
                <q-btn 
                  color="primary" 
                  unelevated 
                  label="Terapkan Filter" 
                  size="sm" 
                  no-caps 
                  @click="applyFilters"
                />
              </div>
            </div>
          </div>
        </q-slide-transition>
      </q-card-section>

      <q-separator v-if="authStore.isPemilik" />

      <!-- Compact Summary Section (Collapsible Header) -->
      <q-expansion-item
        v-if="authStore.isPemilik"
        dense
        dense-toggle
        expand-separator
        icon="analytics"
        label="Ringkasan Keuangan"
        header-class="text-weight-bold text-grey-8"
        default-opened
      >
        <q-card-section class="q-pt-sm q-pb-md">
          <!-- Summary Cards (Grid Compact) -->
          <div class="row q-col-gutter-sm" v-if="summary">
            <!-- Pemasukan -->
            <div class="col-6 col-md-3">
              <q-card flat bordered class="bg-green-1">
                <q-card-section class="q-pa-sm text-center">
                  <div class="text-caption text-grey-7">Pemasukan</div>
                  <div class="text-subtitle1 text-weight-bold text-positive text-ellipsis">
                    {{ formatCurrency(summary.totalIncome) }}
                  </div>
                </q-card-section>
              </q-card>
            </div>
            <!-- Pengeluaran -->
            <div class="col-6 col-md-3">
              <q-card flat bordered class="bg-red-1">
                <q-card-section class="q-pa-sm text-center">
                  <div class="text-caption text-grey-7">Pengeluaran</div>
                  <div class="text-subtitle1 text-weight-bold text-negative text-ellipsis">
                    {{ formatCurrency(summary.totalExpense) }}
                  </div>
                </q-card-section>
              </q-card>
            </div>
            <!-- Keuntungan -->
            <div class="col-6 col-md-3">
              <q-card flat bordered class="bg-blue-1">
                <q-card-section class="q-pa-sm text-center">
                  <div class="text-caption text-grey-7">Keuntungan</div>
                  <div class="text-subtitle1 text-weight-bold text-primary text-ellipsis">
                    {{ formatCurrency(summary.profit) }}
                  </div>
                </q-card-section>
              </q-card>
            </div>
            <!-- Transaksi -->
            <div class="col-6 col-md-3">
              <q-card flat bordered class="bg-purple-1">
                <q-card-section class="q-pa-sm text-center">
                  <div class="text-caption text-grey-7">Total Transaksi</div>
                  <div class="text-subtitle1 text-weight-bold text-purple-9">
                    {{ summary.count }}
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
          
          <!-- Period Selector (Compact) -->
          <div class="row justify-end q-mt-sm">
            <q-btn-toggle
              v-model="summaryPeriod"
              toggle-color="primary"
              :options="[
                {label: 'Hari Ini', value: 'today'},
                {label: 'Bulan Ini', value: 'month'}
              ]"
              unelevated
              rounded
              size="sm"
              dense
              flat
              class="text-grey-7"
              @update:model-value="onPeriodChange"
            />
          </div>
        </q-card-section>
      </q-expansion-item>
    </q-card>

    <!-- Transactions List -->
    <q-card>
      <q-card-section class="q-pa-sm q-pa-md-md">
        <!-- Desktop Table View -->
        <q-table
          :rows="groupedTransactions"
          :columns="columns"
          row-key="id"
          :loading="transactionStore.isLoading"
          :pagination="pagination"
          @request="onRequest"
          binary-state-sort
          class="gt-xs"
          hide-header
        >
          <!-- Custom header -->
          <template #top-row>
            <q-tr class="bg-grey-2">
              <q-th class="text-left">Tanggal</q-th>
              <q-th class="text-center">Tipe</q-th>
              <q-th class="text-left">Deskripsi</q-th>
              <q-th class="text-left">Kategori</q-th>
              <q-th class="text-right">Jumlah</q-th>
              <q-th v-if="authStore.isPemilik" class="text-left">Dibuat oleh</q-th>
              <q-th class="text-center">Aksi</q-th>
            </q-tr>
          </template>

          <!-- Custom body -->
          <template #body="props">
            <!-- Date Group Header -->
            <q-tr v-if="props.row.isGroupHeader" class="bg-blue-1">
              <q-td colspan="100%">
                <div class="row items-center q-gutter-sm">
                  <q-icon name="event" color="primary" />
                  <span class="text-weight-bold text-primary">
                    {{ formatDateFull(props.row.date) }}
                  </span>
                  <q-badge color="primary" :label="props.row.count + ' transaksi'" />
                  <q-space />
                  <span class="text-positive text-weight-medium">+{{ formatCurrency(props.row.totalIncome) }}</span>
                  <span class="text-grey-5">|</span>
                  <span class="text-negative text-weight-medium">-{{ formatCurrency(props.row.totalExpense) }}</span>
                </div>
              </q-td>
            </q-tr>

            <!-- Transaction Row -->
            <q-tr v-else :props="props">
              <q-td key="transactionDate" :props="props">
                <span class="text-grey-7 text-caption">{{ formatTime(props.row.transactionDate) }}</span>
              </q-td>
              <q-td key="type" :props="props" class="text-center">
                <q-chip
                  :color="props.row.type === 'masuk' ? 'positive' : 'negative'"
                  text-color="white"
                  :label="props.row.type === 'masuk' ? 'Pemasukan' : 'Pengeluaran'"
                  size="sm"
                />
              </q-td>
              <q-td key="description" :props="props">
                {{ props.row.description }}
              </q-td>
              <q-td key="category" :props="props">
                {{ props.row.category }}
              </q-td>
              <q-td key="amount" :props="props" class="text-right">
                <span :class="props.row.type === 'masuk' ? 'text-positive' : 'text-negative'">
                  {{ props.row.type === 'masuk' ? '+' : '-' }}{{ formatCurrency(props.row.amount) }}
                </span>
              </q-td>
              <q-td v-if="authStore.isPemilik" key="user" :props="props">
                {{ props.row.user?.fullName || '-' }}
              </q-td>
              <q-td key="actions" :props="props" class="text-center">
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
            </q-tr>
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
              <div class="col-12">
                <q-select
                  v-model="form.category"
                  label="Kategori *"
                  :options="formCategoryOptionsFiltered"
                  emit-value
                  map-options
                  outlined
                  dense
                  :rules="[val => !!val || 'Kategori wajib dipilih']"
                  :loading="formCategoriesLoading"
                  :disable="!form.type"
                  use-input
                  input-debounce="0"
                  @filter="filterFormCategoryFn"
                  behavior="menu"
                />
              </div>
              <div class="col-12">
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
import { formatCurrency, formatDateOnly, formatDateShort, formatDateFull, formatTime } from 'src/utils/format'
import categoryService from 'src/services/category'
import reportService from 'src/services/report'

const authStore = useAuthStore()
const transactionStore = useTransactionStore()

// Summary period
const summaryPeriod = ref('month')
const summary = ref(null)

// periodOptions removed as we use inline options in template

// periodLabel removed as it is no longer used in template

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
const showFilters = ref(false) // New state for filter toggle
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
const filteredCategoryOptions = ref([])

// Form Dialog State
const showFormDialog = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const formSaving = ref(false)
const formCategoriesLoading = ref(false)
const formCategoryOptions = ref([])
const formCategoryOptionsFiltered = ref([])
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
    formCategoryOptionsFiltered.value = []
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
      formCategoryOptionsFiltered.value = formCategoryOptions.value
    } else {
      formCategoryOptions.value = []
      formCategoryOptionsFiltered.value = []
    }
  } catch (error) {
    console.error('Error loading form categories:', error)
    formCategoryOptions.value = []
    formCategoryOptionsFiltered.value = []
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

// Filter function for category dropdown (filter section)
const filterCategoryFn = (val, update) => {
  update(() => {
    if (val === '') {
      filteredCategoryOptions.value = categoryOptions.value
    } else {
      const needle = val.toLowerCase()
      filteredCategoryOptions.value = categoryOptions.value.filter(
        opt => opt.label.toLowerCase().includes(needle)
      )
    }
  })
}

// Filter function for category dropdown (form section)
const filterFormCategoryFn = (val, update) => {
  update(() => {
    if (val === '') {
      formCategoryOptionsFiltered.value = formCategoryOptions.value
    } else {
      const needle = val.toLowerCase()
      formCategoryOptionsFiltered.value = formCategoryOptions.value.filter(
        opt => opt.label.toLowerCase().includes(needle)
      )
    }
  })
}

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

// Grouped transactions by date
const groupedTransactions = computed(() => {
  if (!transactions.value || transactions.value.length === 0) return []

  const result = []
  const grouped = {}

  // Group by date
  transactions.value.forEach(tx => {
    const dateKey = tx.transactionDate ? tx.transactionDate.split('T')[0] : 'unknown'
    if (!grouped[dateKey]) {
      grouped[dateKey] = {
        transactions: [],
        totalIncome: 0,
        totalExpense: 0
      }
    }
    grouped[dateKey].transactions.push(tx)
    if (tx.type === 'masuk') {
      grouped[dateKey].totalIncome += parseFloat(tx.amount) || 0
    } else {
      grouped[dateKey].totalExpense += parseFloat(tx.amount) || 0
    }
  })

  // Sort dates descending
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a))

  // Build result with headers and rows
  sortedDates.forEach(date => {
    const group = grouped[date]

    // Add header row
    result.push({
      id: `header-${date}`,
      isGroupHeader: true,
      date: date,
      count: group.transactions.length,
      totalIncome: group.totalIncome,
      totalExpense: group.totalExpense
    })

    // Add transaction rows
    group.transactions.forEach(tx => {
      result.push(tx)
    })
  })

  return result
})

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
