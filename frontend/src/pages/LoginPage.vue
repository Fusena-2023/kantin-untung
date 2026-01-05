<template>
  <q-page class="row justify-center items-center">
    <div class="column q-pa-md" style="max-width: 400px; width: 100%">
      <q-card>
        <q-card-section class="text-center">
          <div class="text-h4 text-weight-bold text-primary q-mb-md">
            Kantin Untung
          </div>
          <div class="text-subtitle1 text-grey-7">
            Sistem Pencatatan Keuangan
          </div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="onSubmit" @reset="onReset" greedy>
            <q-input
              v-model="form.username"
              label="Username"
              filled
              :rules="[val => val && val.length > 0 || 'Username diperlukan']"
              class="q-mb-md"
            >
              <template v-slot:prepend>
                <q-icon name="person" />
              </template>
            </q-input>

            <q-input
              v-model="form.password"
              label="Password"
              :type="showPassword ? 'text' : 'password'"
              filled
              :rules="[val => val && val.length > 0 || 'Password diperlukan']"
              class="q-mb-md"
            >
              <template v-slot:prepend>
                <q-icon name="lock" />
              </template>
              <template v-slot:append>
                <q-icon
                  :name="showPassword ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showPassword = !showPassword"
                />
              </template>
            </q-input>

            <div class="row q-gutter-md">
              <q-btn
                label="Login"
                type="submit"
                color="primary"
                :loading="authStore.isLoading"
                class="col"
              />
              <q-btn
                label="Reset"
                type="reset"
                color="primary"
                flat
                class="col"
              />
            </div>

            <div class="text-center q-mt-md">
              <span class="text-grey-7">Belum punya akun?</span>
              <router-link to="/register" class="text-primary text-weight-medium q-ml-xs">
                Daftar di sini
              </router-link>
            </div>
          </q-form>
        </q-card-section>
      </q-card>
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
a {
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>
