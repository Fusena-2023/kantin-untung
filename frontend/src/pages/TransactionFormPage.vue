<template>
  <q-page class="q-pa-sm q-pa-md-md">
    <div class="row q-mb-md items-center">
      <div class="col-auto q-mr-sm">
        <q-btn
          flat
          round
          dense
          color="grey-7"
          icon="arrow_back"
          @click="$router.back()"
          size="md"
        >
          <q-tooltip>Kembali</q-tooltip>
        </q-btn>
      </div>
      <div class="col">
        <h4 class="text-h5 text-h4-md q-ma-none">
          {{ isEdit ? 'Edit Transaksi' : 'Tambah Transaksi' }}
        </h4>
        <p class="text-caption text-subtitle1-md text-grey-7 q-mb-none">
          {{ isEdit ? 'Ubah data transaksi' : 'Buat transaksi baru' }}
        </p>
      </div>
    </div>

    <q-card>
      <q-card-section class="q-pa-sm q-pa-md-md">
        <q-form @submit="onSubmit" @reset="onReset" ref="transactionForm">
          <div class="row q-col-gutter-sm q-col-gutter-md-md">
            <!-- 1. Tipe Transaksi -->
            <div class="col-12 col-md-6">
              <q-select
                v-model="form.type"
                label="Tipe Transaksi *"
                :options="typeOptions"
                emit-value
                map-options
                outlined
                :rules="[val => !!val || 'Tipe transaksi diperlukan']"
              >
                <template v-slot:prepend>
                  <q-icon :name="form.type === 'masuk' ? 'trending_up' : 'trending_down'" />
                </template>
              </q-select>
            </div>

            <!-- 2. Kategori -->
            <div class="col-12 col-md-6">
              <q-select
                v-model="form.category"
                label="Kategori *"
                :options="categoryOptions"
                emit-value
                map-options
                outlined
                :rules="[val => !!val || 'Kategori diperlukan']"
                :loading="categoriesLoading"
                :disable="!form.type"
                :hint="!form.type ? 'Pilih tipe transaksi terlebih dahulu' : ''"
              >
                <template v-slot:prepend>
                  <q-icon name="category" />
                </template>
              </q-select>
            </div>

            <!-- 3. Jumlah -->
            <div class="col-12 col-md-6">
              <q-input
                :model-value="formatCurrency(form.amount)"
                @update:model-value="updateAmount"
                label="Jumlah *"
                type="text"
                inputmode="decimal"
                outlined
                @keydown="onlyNumbers"
                :rules="[
                  val => form.amount !== null && form.amount !== '' || 'Jumlah diperlukan',
                  val => !isNaN(form.amount) || 'Jumlah harus berupa angka',
                  val => form.amount > 0 || 'Jumlah harus lebih dari 0'
                ]"
                prefix="Rp"
              >
                <template v-slot:prepend>
                  <q-icon name="attach_money" />
                </template>
              </q-input>
            </div>

            <!-- 4. Deskripsi -->
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.description"
                label="Deskripsi (Opsional)"
                outlined
                :rules="[
                  val => !val || val.length <= 500 || 'Deskripsi maksimal 500 karakter'
                ]"
                counter
                maxlength="500"
              >
                <template v-slot:prepend>
                  <q-icon name="description" />
                </template>
              </q-input>
            </div>

            <!-- 5. Tanggal Transaksi -->
            <div class="col-12 col-md-6">
              <q-input
                v-model="displayDate"
                label="Tanggal Transaksi *"
                outlined
                readonly
                :rules="[val => !!val || 'Tanggal transaksi diperlukan']"
                hint="Format: DD/MM/YYYY (waktu menggunakan waktu sistem)"
              >
                <template v-slot:prepend>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="form.transactionDate" mask="YYYY-MM-DD">
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Tutup" color="primary" flat />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
          </div>

          <div class="row q-col-gutter-sm q-mt-sm q-mt-md-md">
            <div class="col-12 col-sm-4">
              <q-btn
                label="Simpan"
                type="submit"
                color="primary"
                :loading="isLoading"
                class="full-width"
                no-caps
                icon="save"
              />
            </div>
            <div class="col-6 col-sm-4">
              <q-btn
                label="Reset"
                type="reset"
                color="grey"
                outline
                class="full-width"
                no-caps
                icon="refresh"
              />
            </div>
            <div class="col-6 col-sm-4">
              <q-btn
                label="Batal"
                color="grey"
                flat
                @click="$router.back()"
                class="full-width"
                no-caps
                icon="close"
              />
            </div>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTransactionStore } from 'stores/transaction-store'
import categoryService from 'src/services/category'
import { dateToIndonesian } from 'src/utils/format'

const router = useRouter()
const route = useRoute()
const transactionStore = useTransactionStore()

const transactionForm = ref(null)
const isLoading = ref(false)
const categoriesLoading = ref(false)
const categoryOptions = ref([])

// Helper function to get date string in local timezone (YYYY-MM-DD)
const getLocalDateString = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const form = ref({
  type: '',
  amount: null,
  description: '',
  category: '',
  transactionDate: getLocalDateString(new Date())
})

// Computed untuk menampilkan tanggal dalam format Indonesia DD/MM/YYYY
const displayDate = computed(() => {
  if (!form.value.transactionDate) return ''
  return dateToIndonesian(form.value.transactionDate)
})

const typeOptions = [
  { label: 'Pemasukan', value: 'masuk', icon: 'trending_up', color: 'positive' },
  { label: 'Pengeluaran', value: 'keluar', icon: 'trending_down', color: 'negative' }
]

const isEdit = computed(() => !!route.params.id)
const transactionId = computed(() => route.params.id)

// Load categories based on transaction type
const loadCategories = async () => {
  if (!form.value.type) {
    categoryOptions.value = []
    return
  }

  try {
    categoriesLoading.value = true
    const response = await categoryService.getCategories(form.value.type)

    if (response.data && response.data.data && response.data.data.categories) {
      categoryOptions.value = response.data.data.categories.map(cat => ({
        label: cat.name,
        value: cat.name,
        icon: cat.icon,
        color: cat.color
      }))
    } else {
      categoryOptions.value = []
    }
  } catch (error) {
    console.error('Error loading categories:', error)
    categoryOptions.value = []
  } finally {
    categoriesLoading.value = false
  }
}

// Watch for type changes to reload categories
const typeWatcher = computed(() => form.value.type)
watch(typeWatcher, () => {
  loadCategories()
  form.value.category = '' // Reset category when type changes
})

// Format currency with thousand separator
const formatCurrency = (value) => {
  if (!value) return ''
  const numValue = typeof value === 'string' ? parseInt(value.replace(/\D/g, '')) : value
  if (isNaN(numValue)) return ''
  return numValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

// Update amount value from formatted input
const updateAmount = (value) => {
  // Remove all non-digit characters except decimal point
  const cleanedValue = value.replace(/\D/g, '')
  form.value.amount = cleanedValue ? parseInt(cleanedValue) : null
}

// Handle only numbers input for amount field
const onlyNumbers = (event) => {
  const key = event.key
  // Allow: numbers, decimal point, and control keys
  if (!/[0-9.,]|[-]/.test(key) &&
      !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(key) &&
      !(event.ctrlKey && (key === 'a' || key === 'c' || key === 'v' || key === 'x'))) {
    event.preventDefault()
  }
}

const loadTransaction = async () => {
  if (!isEdit.value) return

  try {
    isLoading.value = true
    const transaction = await transactionStore.fetchTransaction(transactionId.value)

    // Convert transaction date to proper format
    const transactionDateTime = new Date(transaction.transactionDate)

    // Set type first
    form.value.type = transaction.type

    // Load categories based on type
    await loadCategories()

    // Then set other values including category
    form.value = {
      type: transaction.type,
      amount: parseFloat(transaction.amount),
      description: transaction.description || '',
      category: transaction.category,
      transactionDate: transactionDateTime.toISOString().split('T')[0]
    }
  } catch (error) {
    // Simple alert instead of $q.notify
    alert(error)
    router.back()
  } finally {
    isLoading.value = false
  }
}

const onSubmit = async () => {
  try {
    isLoading.value = true

    // Gunakan waktu sistem saat ini untuk waktu transaksi
    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

    // Gabungkan tanggal yang dipilih dengan waktu sistem saat ini
    const localDateTimeString = `${form.value.transactionDate}T${currentTime}`

    // Parse sebagai waktu lokal
    const parts = localDateTimeString.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/)
    const year = parseInt(parts[1])
    const month = parseInt(parts[2]) - 1
    const day = parseInt(parts[3])
    const hours = parseInt(parts[4])
    const minutes = parseInt(parts[5])
    const seconds = parseInt(parts[6])

    const transactionDateTime = new Date(year, month, day, hours, minutes, seconds)

    // Convert to ISO format
    const tzOffset = transactionDateTime.getTimezoneOffset() * 60000
    const localISOString = new Date(transactionDateTime.getTime() - tzOffset).toISOString()

    const transactionData = {
      type: form.value.type,
      amount: form.value.amount,
      description: form.value.description?.trim() || null,
      category: form.value.category.trim(),
      transactionDate: localISOString
    }

    console.log('Sending transaction data:', {
      localDateTime: localDateTimeString,
      isoString: transactionData.transactionDate,
      serverReceives: new Date(localISOString)
    })

    if (isEdit.value) {
      await transactionStore.updateTransaction(transactionId.value, transactionData)
      // Simple alert instead of $q.notify
      alert('Transaksi berhasil diupdate')
    } else {
      await transactionStore.createTransaction(transactionData)
      // Simple alert instead of $q.notify
      alert('Transaksi berhasil dibuat')
    }

    // Direct navigation to transactions page
    router.push('/app/transactions')
  } catch (error) {
    console.error('Submit error:', error)
    // Show error message
    const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Gagal menyimpan transaksi'
    alert(errorMsg)
  } finally {
    isLoading.value = false
  }
}

const onReset = () => {
  if (isEdit.value) {
    loadTransaction()
  } else {
    form.value = {
      type: '',
      amount: null,
      description: '',
      category: '',
      transactionDate: getLocalDateString(new Date())
    }
  }
}

onMounted(() => {
  if (isEdit.value) {
    loadTransaction()
  } else {
    // Load categories if type is already selected
    if (form.value.type) {
      loadCategories()
    }
  }
})
</script>

<style scoped>
.q-field__counter {
  color: var(--q-color-grey-6);
}
</style>
