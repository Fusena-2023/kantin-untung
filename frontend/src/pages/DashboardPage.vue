<template>
  <q-page class="q-pa-md">
    <div class="row q-mb-lg">
      <div class="col">
        <h4 class="text-h4 q-ma-none">Dashboard</h4>
        <p class="text-subtitle1 text-grey-7">
          Selamat datang, {{ authStore.user?.username }}!
          Ringkasan keuangan kantin hari ini
        </p>
      </div>
      <div class="col-auto">
        <q-btn
          color="primary"
          icon="refresh"
          label="Refresh"
          @click="fetchData"
          :loading="reportStore.isLoading"
        />
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="row q-gutter-lg q-mb-lg">
      <div class="col-12 col-md-3">
        <q-card class="bg-positive text-white">
          <q-card-section>
            <div class="text-h6">Pemasukan Hari Ini</div>
            <div class="text-h4">{{ formatCurrency(reportStore.todayIncome) }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card class="bg-negative text-white">
          <q-card-section>
            <div class="text-h6">Pengeluaran Hari Ini</div>
            <div class="text-h4">{{ formatCurrency(reportStore.todayExpense) }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-3">
        <q-card class="bg-info text-white">
          <q-card-section>
            <div class="text-h6">Keuntungan Hari Ini</div>
            <div class="text-h4">{{ formatCurrency(reportStore.todayProfit) }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div v-if="authStore.user?.role === 'pemilik'" class="col-12 col-md-3">
        <q-card class="bg-warning text-white">
          <q-card-section>
            <div class="text-h6">Total User</div>
            <div class="text-h4">{{ dashboard?.users?.total || 0 }}</div>
            <div class="text-caption">{{ dashboard?.users?.active || 0 }} aktif</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Monthly Summary -->
    <div class="row q-gutter-lg q-mb-lg">
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">Ringkasan Bulanan</div>
            <div class="row q-gutter-md">
              <div class="col">
                <div class="text-subtitle2 text-positive">Pemasukan</div>
                <div class="text-h6">{{ formatCurrency(dashboard?.thisMonth?.income || 0) }}</div>
              </div>
              <div class="col">
                <div class="text-subtitle2 text-negative">Pengeluaran</div>
                <div class="text-h6">{{ formatCurrency(dashboard?.thisMonth?.expense || 0) }}</div>
              </div>
              <div class="col">
                <div class="text-subtitle2 text-info">Keuntungan</div>
                <div class="text-h6">{{ formatCurrency(dashboard?.thisMonth?.profit || 0) }}</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">Transaksi Terbaru</div>
            <q-list v-if="dashboard?.recentTransactions?.length">
              <q-item
                v-for="transaction in dashboard.recentTransactions"
                :key="transaction.id"
              >
                <q-item-section avatar>
                  <q-avatar
                    :color="transaction.type === 'masuk' ? 'positive' : 'negative'"
                    text-color="white"
                    :icon="transaction.type === 'masuk' ? 'trending_up' : 'trending_down'"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ transaction.description }}</q-item-label>
                  <q-item-label caption>{{ transaction.category }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-item-label
                    :class="transaction.type === 'masuk' ? 'text-positive' : 'text-negative'"
                  >
                    {{ transaction.type === 'masuk' ? '+' : '-' }}{{ formatCurrency(transaction.amount) }}
                  </q-item-label>
                  <q-item-label caption>{{ formatDate(transaction.created_at) }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
            <div v-else class="text-center text-grey-5 q-py-lg">
              Belum ada transaksi
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="row q-gutter-lg">
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div class="text-h6 q-mb-md">Aksi Cepat</div>
            <div class="row q-gutter-md">
              <q-btn
                color="primary"
                icon="add"
                label="Tambah Transaksi"
                to="/app/transactions/create"
              />
              <q-btn
                v-if="authStore.user?.role === 'pemilik'"
                color="secondary"
                icon="people"
                label="Kelola User"
                to="/app/users"
              />
              <q-btn
                v-if="authStore.user?.role === 'pemilik'"
                color="accent"
                icon="assessment"
                label="Laporan"
                to="/app/reports"
              />
              <q-btn
                color="info"
                icon="list"
                label="Lihat Transaksi"
                to="/app/transactions"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useReportStore } from 'stores/report-store'
import { useAuthStore } from 'stores/auth-store'
import { formatCurrency, formatDate } from 'src/utils/format'

const reportStore = useReportStore()
const authStore = useAuthStore()

const dashboard = computed(() => reportStore.dashboard)

const fetchData = async () => {
  try {
    await reportStore.fetchDashboard()
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
  }
}

onMounted(() => {
  fetchData()
})
</script>
