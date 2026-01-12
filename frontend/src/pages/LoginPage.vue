<template>
  <q-page class="row justify-center items-center bg-grey-2">
    <div class="column q-pa-md" style="max-width: 380px; width: 100%">
      <q-card flat bordered class="login-card">
        <!-- Header -->
        <q-card-section class="text-center q-pb-none">
          <div class="q-mb-md">
            <q-icon name="store" size="48px" color="primary" />
          </div>
          <div class="text-h5 text-weight-bold text-grey-9">
            Kantin Untung
          </div>
          <div class="text-caption text-grey-6 q-mt-xs">
            Sistem Pencatatan Keuangan
          </div>
        </q-card-section>

        <q-card-section class="q-pt-lg">
          <q-form @submit="onSubmit" @reset="onReset" greedy>
            <q-input
              v-model="form.username"
              label="Username"
              outlined
              dense
              :rules="[val => val && val.length > 0 || 'Username diperlukan']"
              class="q-mb-sm"
            >
              <template v-slot:prepend>
                <q-icon name="person" size="sm" color="grey-6" />
              </template>
            </q-input>

            <q-input
              v-model="form.password"
              label="Password"
              :type="showPassword ? 'text' : 'password'"
              outlined
              dense
              :rules="[val => val && val.length > 0 || 'Password diperlukan']"
              class="q-mb-md"
            >
              <template v-slot:prepend>
                <q-icon name="lock" size="sm" color="grey-6" />
              </template>
              <template v-slot:append>
                <q-icon
                  :name="showPassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  size="sm"
                  color="grey-6"
                  @click="showPassword = !showPassword"
                />
              </template>
            </q-input>

            <q-btn
              label="Login"
              type="submit"
              color="primary"
              unelevated
              :loading="authStore.isLoading"
              class="full-width q-mb-sm"
              no-caps
            />

            <q-btn
              label="Reset"
              type="reset"
              color="grey-7"
              flat
              class="full-width"
              no-caps
            />

            <div class="text-center q-mt-md">
              <span class="text-grey-7 text-body2">Belum punya akun?</span>
              <router-link to="/register" class="text-primary text-weight-medium q-ml-xs">
                Daftar
              </router-link>
            </div>
          </q-form>
        </q-card-section>
      </q-card>

      <!-- Footer -->
      <div class="text-center q-mt-md text-caption text-grey-6">
        © 2026 Kantin Untung. All rights reserved.
      </div>
    </div>
  </q-page>
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

const onSubmit = async () => {
  try {
    const user = await authStore.login(form.value)

    // Simple success message without $q.notify
    console.log('Login successful:', user)

    // Ensure token is properly set in localStorage and axios headers
    const token = authStore.token
    if (token) {
      localStorage.setItem('auth_token', token)
      console.log('Token stored:', token.substring(0, 20) + '...')
    }

    // Force auth state update and complete reload
    authStore.initializeAuth()

    // Direct navigation based on role with full page reload
    const targetPath = user.role === 'pemilik' ? '/app/dashboard' : '/app/transactions'

    // Force complete page reload to ensure all components reinitialize properly
    setTimeout(() => {
      window.location.href = window.location.origin + '/#' + targetPath
    }, 200)

  } catch (error) {
    console.error('Login error:', error)
    // Simple alert instead of $q.notify for now
    alert(typeof error === 'string' ? error : 'Login gagal')
  }
}

const onReset = () => {
  form.value.username = ''
  form.value.password = ''
}
</script>

<style scoped>
.login-card {
  border-radius: 12px;
  background: white;
}

a {
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>
