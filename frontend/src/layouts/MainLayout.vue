<template>
  <q-layout view="lHh Lpr lFf" :key="layoutKey">
    <q-header elevated v-if="isAuthenticated">
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" v-if="isAuthenticated" />

        <q-toolbar-title>
          <router-link to="/" class="text-white no-decoration">
            Kantin Untung
          </router-link>
        </q-toolbar-title>

        <!-- User Info -->
        <div v-if="isAuthenticated" class="row items-center q-gutter-sm">
          <q-icon name="person" />
          <span>{{ user?.fullName }}</span>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered v-if="isAuthenticated" :key="drawerKey">
      <q-list>
        <q-item-label header class="text-primary text-weight-bold">
          MENU NAVIGASI
        </q-item-label>

        <!-- Dashboard - Only for Pemilik -->
        <q-item
          clickable
          v-ripple
          to="/app/dashboard"
          v-if="isPemilik"
        >
          <q-item-section avatar>
            <q-icon name="dashboard" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Dashboard</q-item-label>
          </q-item-section>
        </q-item>

        <!-- Transactions - For All Users -->
        <q-item clickable v-ripple to="/app/transactions">
          <q-item-section avatar>
            <q-icon name="receipt" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Transaksi</q-item-label>
          </q-item-section>
        </q-item>

        <!-- User Management - Only for Pemilik -->
        <q-item
          clickable
          v-ripple
          to="/app/users"
          v-if="isPemilik"
        >
          <q-item-section avatar>
            <q-icon name="people" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Kelola Pengguna</q-item-label>
          </q-item-section>
        </q-item>

        <!-- Reports - Only for Pemilik -->
        <q-item
          clickable
          v-ripple
          to="/app/reports"
          v-if="isPemilik"
        >
          <q-item-section avatar>
            <q-icon name="assessment" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Laporan</q-item-label>
          </q-item-section>
        </q-item>

        <q-separator />

        <!-- Logout -->
        <q-item clickable v-ripple @click="handleLogout">
          <q-item-section avatar>
            <q-icon name="logout" color="negative" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-negative">Logout</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useAuthStore } from 'src/stores/auth-store'

const authStore = useAuthStore()

const leftDrawerOpen = ref(false)
const layoutKey = ref(0) // Existing keys
const drawerKey = ref(0)

// Existing computed properties
const isAuthenticated = computed(() => authStore.isAuthenticated)
const isPemilik = computed(() => authStore.isPemilik)
const user = computed(() => authStore.user)

// Watch auth state changes and force reactivity
watch(() => authStore.user, async (newUser) => {
  if (newUser) {
    // Force component re-render by changing keys
    layoutKey.value += 1
    drawerKey.value += 1
    await nextTick()
  }
}, { deep: true })

// Watch isInitialized flag
watch(() => authStore.isInitialized, async (isInit) => {
  if (isInit) {
    layoutKey.value += 1
    drawerKey.value += 1
    await nextTick()
  }
})

// Watch authentication state
watch(() => authStore.isAuthenticated, (isAuth) => {
  if (isAuth) {
    layoutKey.value += 1
    drawerKey.value += 1
  }
})

onMounted(async () => {
  // Pastikan auth state di-initialize saat component mount
  if (!authStore.isInitialized) {
    authStore.initializeAuth()
  }

  // Wait a bit for auth to settle after initialization
  await new Promise(resolve => setTimeout(resolve, 100))
})

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

const handleLogout = async () => {
  if (confirm('Apakah Anda yakin ingin keluar?')) {
    try {
      // Clear auth state immediately
      authStore.user = null
      authStore.token = null
      authStore.isInitialized = false

      // Clear localStorage
      localStorage.removeItem('auth_token')
      localStorage.clear()

      // Clear axios headers
      if (window.axios?.defaults?.headers?.common) {
        delete window.axios.defaults.headers.common['Authorization']
      }

      // Force redirect - clear URL completely and go to login
      window.location.href = window.location.origin + '/#/login'
    } catch (error) {
      console.error('Logout error:', error)
      // Force redirect even if error
      window.location.href = window.location.origin + '/#/login'
    }
  }
}
</script>

<style scoped>
.no-decoration {
  text-decoration: none;
}
</style>
