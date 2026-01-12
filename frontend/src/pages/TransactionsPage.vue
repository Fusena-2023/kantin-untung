<template>
  <q-page class="q-pa-sm q-pa-md-md">
    <q-pull-to-refresh @refresh="onRefresh">
      <div class="row q-mb-md items-center justify-between">
        <div class="col">
          <h4 class="text-h5 text-h4-md q-ma-none">Transaksi</h4>
          <p class="text-caption text-subtitle1-md text-grey-7 q-mb-none">
            Kelola transaksi pemasukan dan pengeluaran
          </p>
        </div>
        <div class="col-auto gt-xs">
          <q-btn
            color="primary"
            icon="refresh"
            label="Refresh"
            @click="fetchTransactions"
            :loading="transactionStore.isLoading"
            no-caps
          />
        </div>
      </div>

    <!-- Filters -->
    <q-card class="q-mb-md">
      <q-card-section class="q-pa-sm q-pa-md-md">
        <div class="text-subtitle1 text-h6-md q-mb-sm q-mb-md-md text-weight-medium">Filter</div>
        <div class="row q-col-gutter-sm q-col-gutter-md-md">
          <q-input
            v-model="filters.search"
            label="Cari transaksi..."
            outlined
            class="col-12 col-md-3"
            @keyup.enter="applyFilters"
          >
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>

          <q-select
            v-model="filters.type"
            label="Tipe"
            outlined
            :options="typeOptions"
            emit-value
            map-options
            clearable
            use-input
            input-debounce="0"
            class="col-12 col-md-2"
            @update:model-value="loadCategories"
            @filter="filterTypeOptions"
          />

          <q-select
            v-model="filters.category"
            label="Kategori"
            outlined
            :options="filteredCategoryOptions"
            emit-value
            map-options
            clearable
            use-input
            input-debounce="0"
            class="col-12 col-md-2"
            :loading="categoriesLoading"
            @filter="filterCategoryOptions"
          />

          <q-input
            v-model="dateRangeText"
            label="Rentang Tanggal"
            outlined
            readonly
            class="col-12 col-md-3"
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

          <div class="col-12 col-md-auto">
            <div class="row q-col-gutter-sm">
              <div class="col-6 col-sm-auto">
                <q-btn
                  color="primary"
                  icon="search"
                  label="Filter"
                  @click="applyFilters"
                  class="full-width"
                  no-caps
                />
              </div>
              <div class="col-6 col-sm-auto">
                <q-btn
                  color="grey"
                  icon="refresh"
                  label="Reset"
                  outline
                  @click="resetFilters"
                  class="full-width"
                  no-caps
                />
              </div>
            </div>
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
              {{ formatDate(props.value) }}
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
                    {{ formatDate(transaction.transactionDate) }}
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

    <!-- View Transaction Dialog -->
    <q-dialog v-model="showViewDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Detail Transaksi</div>
        </q-card-section>

        <q-card-section>
          <div class="q-gutter-md" v-if="selectedTransaction">
            <q-input
              label="Tipe"
              :model-value="selectedTransaction.type === 'masuk' ? 'Pemasukan' : 'Pengeluaran'"
              readonly
              outlined
            />
            <q-input
              label="Jumlah"
              :model-value="selectedTransaction.amount ? formatCurrency(selectedTransaction.amount) : '-'"
              readonly
              outlined
            />
            <q-input
              label="Deskripsi"
              :model-value="selectedTransaction.description || '-'"
              readonly
              outlined
            />
            <q-input
              label="Kategori"
              :model-value="selectedTransaction.category || '-'"
              readonly
              outlined
            />
            <q-input
              label="Tanggal"
              :model-value="selectedTransaction.transactionDate ? formatDate(selectedTransaction.transactionDate) : '-'"
              readonly
              outlined
            />
            <q-input
              label="Dibuat oleh"
              :model-value="selectedTransaction.user?.fullName || '-'"
              readonly
              outlined
            />
          </div>

          <div v-else class="text-center text-grey">
            Memuat data transaksi...
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Tutup" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    </q-pull-to-refresh>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'stores/auth-store'
import { useTransactionStore } from 'stores/transaction-store'
import { formatCurrency, formatDate, formatDateShort } from 'src/utils/format'
import categoryService from 'src/services/category'

const router = useRouter()
const authStore = useAuthStore()
const transactionStore = useTransactionStore()

const showViewDialog = ref(false)
const selectedTransaction = ref(null)
const categoriesLoading = ref(false)
const categoryOptions = ref([])
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

const filterTypeOptions = (val, update) => {
  update(() => {
    // typeOptions tidak perlu difilter karena cuma 2 item
  })
}

const filterCategoryOptions = (val, update) => {
  update(() => {
    if (val === '') {
      filteredCategoryOptions.value = categoryOptions.value
    } else {
      const needle = val.toLowerCase()
      filteredCategoryOptions.value = categoryOptions.value.filter(
        v => v.label.toLowerCase().indexOf(needle) > -1
      )
    }
  })
}

const dateRange = ref(null)
const dateRangeText = computed(() => {
  if (!dateRange.value) return ''
  if (typeof dateRange.value === 'string') {
    return formatDateShort(dateRange.value)
  }
  if (dateRange.value.from && dateRange.value.to) {
    return `${formatDateShort(dateRange.value.from)} - ${formatDateShort(dateRange.value.to)}`
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
  } else if (typeof newVal === 'object' && newVal.from) {
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
  // Clean filters before setting
  const cleanedFilters = {}
  Object.keys(filters).forEach(key => {
    const value = filters[key]
    if (value && value !== '' && value !== null && value !== undefined) {
      cleanedFilters[key] = value
    }
  })

  transactionStore.setFilters(cleanedFilters)
  fetchTransactions()
}

const resetFilters = () => {
  filters.search = ''
  filters.type = null
  filters.category = null
  filters.startDate = null
  filters.endDate = null
  dateRange.value = null
  categoryOptions.value = []
  filteredCategoryOptions.value = []

  transactionStore.setFilters({})
  fetchTransactions()
}

const fetchTransactions = async () => {
  try {
    await transactionStore.fetchTransactions()
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

const editTransaction = (transaction) => {
  router.push(`/app/transactions/edit/${transaction.id}`)
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

  // Then fetch transactions
  fetchTransactions()
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
</style>
