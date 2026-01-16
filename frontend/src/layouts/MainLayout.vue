<template>
  <q-layout view="lHh Lpr lFf" :key="layoutKey">
    <q-header elevated class="bg-gradient-kantin" v-if="isAuthenticated">
      <q-toolbar class="q-py-sm">
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" v-if="isAuthenticated" />

        <q-toolbar-title class="row items-center">
          <q-img src="~assets/logo-kantin.png" width="32px" class="q-mr-md" />
          <span class="text-weight-bold">Kantin Untung</span>
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer 
      v-model="leftDrawerOpen" 
      show-if-above 
      bordered 
      v-if="isAuthenticated" 
      :key="drawerKey"
      class="bg-grey-1"
    >
      <q-scroll-area class="fit">
        <!-- Profile Section in Drawer -->
        <div class="q-pa-md bg-white q-mb-md">
          <div class="row items-center q-gutter-md">
            <q-avatar size="48px" color="orange-1" text-color="orange-9" font-size="20px">
              {{ getInitials(user?.fullName) }}
            </q-avatar>
            <div class="col overflow-hidden">
               <div class="text-weight-bold text-subtitle1 text-grey-9 ellipsis">{{ user?.fullName }}</div>
               <div class="text-caption text-grey-7">{{ isPemilik ? 'Administrator / Pemilik' : 'Staff Operasional' }}</div>
            </div>
          </div>
        </div>

        <q-list class="q-px-sm">
          <q-item-label header class="text-grey-7 text-weight-bold letter-spacing-1 q-pt-none">
            MENU UTAMA
          </q-item-label>

          <!-- Dashboard - Only for Pemilik -->
          <q-item
            clickable
            v-ripple
            to="/app/dashboard"
            current-on-path
            active-class="bg-orange-1 text-orange-9 text-weight-bold"
            class="rounded-borders q-mb-xs"
            v-if="isPemilik"
            @click="closeDrawerIfMobile"
          >
            <q-item-section avatar>
              <q-icon name="dashboard" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Dashboard</q-item-label>
            </q-item-section>
          </q-item>

          <!-- Group Input -->
          <q-expansion-item
            icon="edit_note"
            label="Input Data"
            header-class="rounded-borders q-mb-xs"
            active-class="text-orange-9"
            default-opened
          >
            <!-- Transaksi Warung -->
            <q-item 
              clickable 
              v-ripple 
              to="/app/transactions" 
              active-class="bg-orange-1 text-orange-9 text-weight-bold"
              class="rounded-borders q-mb-xs q-pl-lg"
              @click="closeDrawerIfMobile"
            >
              <q-item-section avatar>
                <q-icon name="store" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Transaksi Warung</q-item-label>
              </q-item-section>
            </q-item>

            <!-- Input Catering -->
            <q-item 
              clickable 
              v-ripple 
              to="/app/plate-counts" 
              active-class="bg-orange-1 text-orange-9 text-weight-bold"
              class="rounded-borders q-mb-xs q-pl-lg"
              @click="closeDrawerIfMobile"
            >
              <q-item-section avatar>
                <q-icon name="restaurant" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Input Catering</q-item-label>
              </q-item-section>
            </q-item>
          </q-expansion-item>

           <!-- Group Laporan (Untuk Pemilik) -->
          <template v-if="isPemilik">
             <q-separator class="q-my-md" />
             <q-item-label header class="text-grey-7 text-weight-bold letter-spacing-1">
              LAPORAN & KELOLA
            </q-item-label>


             <q-expansion-item
              icon="assessment"
              label="Laporan Keuangan"
              header-class="rounded-borders q-mb-xs"
               active-class="text-orange-9"
            >
              <!-- Laporan Transaksi Warung -->
              <q-item 
                clickable 
                v-ripple 
                to="/app/reports" 
                active-class="bg-orange-1 text-orange-9 text-weight-bold"
                class="rounded-borders q-mb-xs q-pl-lg"
                @click="closeDrawerIfMobile"
              >
                <q-item-section avatar>
                  <q-icon name="receipt_long" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Lap. Transaksi Warung</q-item-label>
                </q-item-section>
              </q-item>

              <!-- Laporan Catering -->
              <q-item 
                clickable 
                v-ripple 
                to="/app/plate-counts/report" 
                 active-class="bg-orange-1 text-orange-9 text-weight-bold"
                class="rounded-borders q-mb-xs q-pl-lg"
                @click="closeDrawerIfMobile"
              >
                <q-item-section avatar>
                  <q-icon name="restaurant_menu" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>Lap. Catering</q-item-label>
                </q-item-section>
              </q-item>
            </q-expansion-item>

            <!-- User Management -->
            <q-item
              clickable
              v-ripple
              to="/app/users"
               active-class="bg-orange-1 text-orange-9 text-weight-bold"
              class="rounded-borders q-mb-xs"
              @click="closeDrawerIfMobile"
            >
              <q-item-section avatar>
                <q-icon name="people" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Kelola Pengguna</q-item-label>
              </q-item-section>
            </q-item>
          </template>

          <q-separator class="q-my-md" />

          <!-- Logout -->
          <q-item 
            clickable 
            v-ripple 
            @click="handleLogout"
            class="rounded-borders text-grey-8 hover:bg-red-1 hover:text-negative"
          >
            <q-item-section avatar>
              <q-icon name="logout" color="negative" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-negative text-weight-medium">Keluar Aplikasi</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container class="bg-grey-1">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useAuthStore } from 'src/stores/auth-store'
import { useQuasar } from 'quasar'

const authStore = useAuthStore()
const $q = useQuasar()

const leftDrawerOpen = ref(false)
const layoutKey = ref(0) // Existing keys
const drawerKey = ref(0)

// Helper to close drawer on mobile after navigation
const closeDrawerIfMobile = () => {
  if ($q.screen.lt.md) {
    leftDrawerOpen.value = false
  }
}


// Existing computed properties
const isAuthenticated = computed(() => authStore.isAuthenticated)
const isPemilik = computed(() => authStore.isPemilik)
const user = computed(() => authStore.user)

// Helper for avatar initials
const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
}

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
.bg-gradient-kantin {
  /* Warm gradient to match login page */
  background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%);
}

.text-white-8 {
  color: rgba(255, 255, 255, 0.8);
}

.letter-spacing-1 {
  letter-spacing: 1px;
}

/* Custom scrollbar for better look in drawer */
:deep(.q-drawer__content) {
  scrollbar-width: thin;
  scrollbar-color: #bdbdbd #f5f5f5;
}
</style>
