<template>
  <q-page class="q-pa-md">
    <div class="row q-mb-lg items-center">
      <div class="col">
        <h4 class="text-h4 q-ma-none">
          {{ isEdit ? 'Edit Transaksi' : 'Tambah Transaksi' }}
        </h4>
        <p class="text-subtitle1 text-grey-7">
          {{ isEdit ? 'Ubah data transaksi' : 'Buat transaksi baru' }}
        </p>
      </div>
      <div class="col-auto">
        <q-btn
          flat
          color="grey"
          icon="arrow_back"
          label="Kembali"
          @click="$router.back()"
        />
      </div>
    </div>

    <q-card>
      <q-card-section>
        <q-form @submit="onSubmit" @reset="onReset" ref="transactionForm">
          <div class="row q-gutter-md">
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

            <div class="col-12 col-md-6">
              <q-input
                v-model.number="form.amount"
                label="Jumlah *"
                type="number"
                step="0.01"
                min="0.01"
                outlined
                :rules="[
                  val => !!val || 'Jumlah diperlukan',
                  val => val > 0 || 'Jumlah harus lebih dari 0'
                ]"
                prefix="Rp"
              >
                <template v-slot:prepend>
                  <q-icon name="attach_money" />
                </template>
              </q-input>
            </div>

            <div class="col-12 col-md-6">
              <q-input
                v-model="form.description"
                label="Deskripsi *"
                outlined
                :rules="[
                  val => !!val || 'Deskripsi diperlukan',
                  val => val.length <= 500 || 'Deskripsi maksimal 500 karakter'
                ]"
                counter
                maxlength="500"
              >
                <template v-slot:prepend>
                  <q-icon name="description" />
                </template>
              </q-input>
            </div>

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
              >
                <template v-slot:prepend>
                  <q-icon name="category" />
                </template>
              </q-select>
            </div>

            <div class="col-12 col-md-6">
              <q-input
                v-model="form.transactionDate"
                label="Tanggal Transaksi *"
                outlined
                :rules="[val => !!val || 'Tanggal transaksi diperlukan']"
              >
                <template v-slot:prepend>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="form.transactionDate" mask="YYYY-MM-DD">
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Close" color="primary" flat />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
                <template v-slot:append>
                  <q-icon name="access_time" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-time v-model="form.transactionTime" mask="HH:mm" format24h>
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="Close" color="primary" flat />
                        </div>
                      </q-time>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>

            <div class="col-12">
              <q-input
                v-model="form.notes"
                label="Catatan"
                type="textarea"
                outlined
                rows="3"
                :rules="[val => !val || val.length <= 1000 || 'Catatan maksimal 1000 karakter']"
                counter
                maxlength="1000"
              >
                <template v-slot:prepend>
                  <q-icon name="note" />
                </template>
              </q-input>
            </div>
          </div>

          <div class="row q-gutter-md q-mt-md">
            <q-btn
              label="Simpan"
              type="submit"
              color="primary"
              :loading="isLoading"
              class="col-auto"
            />
            <q-btn
              label="Reset"
              type="reset"
              color="grey"
              flat
              class="col-auto"
            />
            <q-btn
              label="Batal"
              color="grey"
              flat
              @click="$router.back()"
              class="col-auto"
            />
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

const router = useRouter()
const route = useRoute()
const transactionStore = useTransactionStore()

const transactionForm = ref(null)
const isLoading = ref(false)
const categoriesLoading = ref(false)
const categoryOptions = ref([])

const form = ref({
  type: '',
  amount: null,
  description: '',
  category: '',
  transactionDate: new Date().toISOString().split('T')[0],
  transactionTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
  notes: ''
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
}// Watch for type changes to reload categories
const typeWatcher = computed(() => form.value.type)
watch(typeWatcher, () => {
  loadCategories()
  form.value.category = '' // Reset category when type changes
})

const loadTransaction = async () => {
  if (!isEdit.value) return

  try {
    isLoading.value = true
    const transaction = await transactionStore.fetchTransaction(transactionId.value)

    // Convert transaction date to proper format
    const transactionDateTime = new Date(transaction.transactionDate)

    form.value = {
      type: transaction.type,
      amount: parseFloat(transaction.amount),
      description: transaction.description,
      category: transaction.category,
      transactionDate: transactionDateTime.toISOString().split('T')[0],
      transactionTime: transactionDateTime.toTimeString().split(' ')[0].substring(0, 5),
      notes: transaction.notes || ''
    }

    // Load categories after setting the type
    await loadCategories()
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

    // Combine date and time
    const transactionDateTime = new Date(`${form.value.transactionDate}T${form.value.transactionTime}:00`)

    const transactionData = {
      type: form.value.type,
      amount: form.value.amount,
      description: form.value.description.trim(),
      category: form.value.category.trim(),
      transactionDate: transactionDateTime.toISOString(),
      notes: form.value.notes?.trim() || null
    }

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
    // Simple alert instead of $q.notify
    alert(typeof error === 'string' ? error : 'Gagal menyimpan transaksi')
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
      transactionDate: new Date().toISOString().split('T')[0],
      transactionTime: new Date().toTimeString().split(' ')[0].substring(0, 5),
      notes: ''
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
