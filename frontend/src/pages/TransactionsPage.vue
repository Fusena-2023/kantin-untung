<template>
  <q-page class="q-pa-md">
    <div class="row q-mb-lg items-center">
      <div class="col">
        <h4 class="text-h4 q-ma-none">Transaksi</h4>
        <p class="text-subtitle1 text-grey-7">
          Kelola transaksi pemasukan dan pengeluaran
        </p>
      </div>
      <div class="col-auto">
        <q-btn
          color="primary"
          icon="add"
          label="Tambah Transaksi"
          to="/app/transactions/create"
          v-if="authStore.isAuthenticated"
        />
      </div>
    </div>

    <!-- Filters -->
    <q-card class="q-mb-lg">
      <q-card-section>
        <div class="text-h6 q-mb-md">Filter</div>
        <div class="row q-gutter-md">
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

          <div class="col-12 col-md-auto q-gutter-sm">
            <q-btn
              color="primary"
              icon="search"
              label="Filter"
              @click="applyFilters"
            />
            <q-btn
              color="grey"
              icon="refresh"
              label="Reset"
              outline
              @click="resetFilters"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Transactions Table -->
    <q-card>
      <q-card-section>
        <q-table
          :rows="transactions"
          :columns="columns"
          row-key="id"
          :loading="transactionStore.isLoading"
          :pagination="pagination"
          @request="onRequest"
          binary-state-sort
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

          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                flat
                round
                color="info"
                icon="visibility"
                @click="viewTransaction(props.row)"
              />
              <q-btn
                flat
                round
                color="warning"
                icon="edit"
                @click="editTransaction(props.row)"
                v-if="canEdit(props.row)"
              />
              <q-btn
                flat
                round
                color="negative"
                icon="delete"
                @click="deleteTransaction(props.row)"
                v-if="authStore.isPemilik"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

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
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'stores/auth-store'
import { useTransactionStore } from 'stores/transaction-store'
import { formatCurrency, formatDate } from 'src/utils/format'
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
    return dateRange.value
  }
  if (dateRange.value.from && dateRange.value.to) {
    return `${formatDateShort(dateRange.value.from)} - ${formatDateShort(dateRange.value.to)}`
  }
  return ''
})

const formatDateShort = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

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
