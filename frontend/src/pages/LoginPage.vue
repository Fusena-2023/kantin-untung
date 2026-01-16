<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
    <q-page class="row bg-gradient-kantin" style="min-height: 100vh">
        <!-- Left Side - Visual & Branding -->
        <div class="col-md-6 gt-sm column justify-center items-center relative-position z-top" style="min-height: 100vh">
          <div class="text-center q-pa-xl text-white">
            <q-img src="~assets/logo-kantin.png" width="300px" class="q-mb-lg drop-shadow-lg" />
            <h1 class="text-h3 text-weight-bold q-my-md text-shadow">Kantin Untung</h1>
            <div class="text-h6 text-weight-medium opacity-90 text-shadow" style="max-width: 500px">
              Solusi cerdas pencatatan keuangan kantin Anda.
            </div>
          </div>
        </div>

        <!-- Right Side - Login Form -->
        <div class="col-12 col-md-6 column justify-center items-center q-pa-lg relative-position" style="min-height: 100vh">
           <!-- Glass Card Container -->
          <div class="glass-card full-width q-pa-xl" style="max-width: 480px">
            <!-- Mobile Header (Visible only on small screens) -->
            <div class="lt-md text-center q-mb-lg">
              <q-img src="~assets/logo-kantin.png" width="120px" class="q-mb-md" />
            </div>

            <div class="text-h4 text-weight-bold text-grey-9 q-mb-xs text-center">Selamat Datang Kembali!</div>
            <div class="text-subtitle1 text-grey-7 q-mb-xl text-center">Masuk untuk mengelola kantinmu</div>

            <q-form @submit="onSubmit" @reset="onReset" greedy class="q-gutter-y-md">
              <q-input
                v-model="form.username"
                placeholder="Username"
                outlined
                class="rounded-input"
                bg-color="grey-1"
                :rules="[val => val && val.length > 0 || 'Username diperlukan']"
                hide-bottom-space
              >
                <template v-slot:prepend>
                  <q-icon name="person_outline" size="22px" color="orange-8" class="q-pl-sm" />
                </template>
              </q-input>

              <q-input
                v-model="form.password"
                placeholder="Password"
                :type="showPassword ? 'text' : 'password'"
                outlined
                class="rounded-input"
                bg-color="grey-1"
                :rules="[val => val && val.length > 0 || 'Password diperlukan']"
                hide-bottom-space
              >
                <template v-slot:prepend>
                  <q-icon name="lock_outline" size="22px" color="orange-8" class="q-pl-sm" />
                </template>
                <template v-slot:append>
                  <q-icon
                    :name="showPassword ? 'visibility_off' : 'visibility'"
                    class="cursor-pointer q-pr-sm"
                    size="xs"
                    color="grey-6"
                    @click="showPassword = !showPassword"
                  />
                </template>
              </q-input>

              <div class="row items-center justify-between q-mt-sm">
                <q-checkbox v-model="rememberMe" label="Ingat saya" size="sm" color="orange-8" dense />
                <a href="#" class="text-caption text-orange-9 text-weight-bold" style="text-decoration: none">Lupa Password?</a>
              </div>

              <q-btn
                label="MASUK"
                type="submit"
                unelevated
                :loading="authStore.isLoading"
                class="full-width q-mt-lg shadow-2"
                no-caps
                rounded
                style="background: linear-gradient(to right, #ff9800, #f57c00); height: 50px; font-weight: bold; font-size: 16px; letter-spacing: 0.5px;"
              />

               <div class="text-center q-mt-lg">
                <span class="text-grey-8 text-caption">Belum punya akun?</span>
                <router-link to="/register" class="text-orange-9 text-weight-bold q-ml-xs text-caption" style="text-decoration: none">
                  Daftar Sekarang
                </router-link>
              </div>
            </q-form>
          </div>
          
          <div class="text-center q-py-md text-caption text-white lt-md">
            © 2026 Kantin Untung
          </div>
           <div class="absolute-bottom text-center q-pb-md text-caption text-grey-8 gt-sm">
            © 2026 Kantin Untung
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from 'stores/auth-store'

const authStore = useAuthStore()

const form = ref({
  username: '',
  password: ''
})

const showPassword = ref(false)
const rememberMe = ref(false)

const onSubmit = async () => {
  try {
    const user = await authStore.login(form.value)

    const token = authStore.token
    if (token) {
      localStorage.setItem('auth_token', token)
    }

    authStore.initializeAuth()

    const isPemilik = user.role === 1 || user.userRole?.name === 'pemilik'
    const targetPath = isPemilik ? '/app/dashboard' : '/app/transactions'

    setTimeout(() => {
      window.location.href = window.location.origin + '/#' + targetPath
    }, 200)

  } catch (error) {
    console.error('Login error:', error)
    alert(typeof error === 'string' ? error : 'Login gagal')
  }
}

const onReset = () => {
  form.value.username = ''
  form.value.password = ''
}
</script>

<style scoped>
.bg-gradient-kantin {
  /* Warm gradient spanning the whole page */
  background: linear-gradient(135deg, #ff9800 0%, #ff5722 50%, #e91e63 100%);
}

.glass-card {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border-radius: 24px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.rounded-input :deep(.q-field__control) {
  border-radius: 12px !important;
  padding-left: 12px;
  padding-right: 12px;
}

/* Enhancing inputs */
.rounded-input :deep(.q-field__control:before) {
  border-color: rgba(0,0,0,0.1);
}

.drop-shadow-lg {
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.15));
}

.text-shadow {
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.opacity-90 {
  opacity: 0.9;
}
</style>
