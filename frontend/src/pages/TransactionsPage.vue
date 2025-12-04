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
            class="col-12 col-md-2"
          />

          <q-input
            v-model="filters.category"
            label="Kategori"
            outlined
            class="col-12 col-md-2"
          />

          <q-input
            v-model="filters.startDate"
            label="Tanggal Mulai"
            type="date"
            outlined
            class="col-12 col-md-2"
          />

          <q-input
            v-model="filters.endDate"
            label="Tanggal Akhir"
            type="date"
            outlined
            class="col-12 col-md-2"
          />

          <div class="col-12 col-md-1">
            <q-btn
              color="primary"
              icon="search"
              label="Filter"
              @click="applyFilters"
              class="full-width"
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
              label="Catatan"
              :model-value="selectedTransaction.notes || '-'"
              readonly
              outlined
              type="textarea"
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
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'stores/auth-store'
import { useTransactionStore } from 'stores/transaction-store'
import { formatCurrency, formatDate } from 'src/utils/format'

const router = useRouter()
const authStore = useAuthStore()
const transactionStore = useTransactionStore()

const showViewDialog = ref(false)
const selectedTransaction = ref(null)

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
