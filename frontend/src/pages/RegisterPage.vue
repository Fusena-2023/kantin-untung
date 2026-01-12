<template>
  <q-page class="row justify-center items-center bg-grey-2">
    <div class="column q-pa-md" style="max-width: 420px; width: 100%">
      <q-card flat bordered class="register-card">
        <!-- Header -->
        <q-card-section class="text-center q-pb-none">
          <div class="q-mb-md">
            <q-icon name="store" size="48px" color="primary" />
          </div>
          <div class="text-h5 text-weight-bold text-grey-9">
            Daftar Akun Baru
          </div>
          <div class="text-caption text-grey-6 q-mt-xs">
            Kantin Untung - Sistem Manajemen Keuangan
          </div>
        </q-card-section>

        <q-card-section class="q-pt-md">
          <q-form @submit="onRegister" class="q-gutter-sm">
            <!-- Username & Nama Lengkap Row -->
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.username"
                  label="Username *"
                  outlined
                  dense
                  :rules="[
                    val => !!val || 'Username diperlukan',
                    val => val.length >= 3 || 'Minimal 3 karakter',
                    val => /^[a-zA-Z0-9_]+$/.test(val) || 'Huruf, angka, underscore saja'
                  ]"
                >
                  <template v-slot:prepend>
                    <q-icon name="person" size="sm" color="grey-6" />
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.fullName"
                  label="Nama Lengkap *"
                  outlined
                  dense
                  :rules="[
                    val => !!val || 'Nama lengkap diperlukan',
                    val => val.length >= 2 || 'Minimal 2 karakter'
                  ]"
                >
                  <template v-slot:prepend>
                    <q-icon name="badge" size="sm" color="grey-6" />
                  </template>
                </q-input>
              </div>
            </div>

            <!-- Email -->
            <q-input
              v-model="form.email"
              label="Email *"
              type="email"
              outlined
              dense
              :rules="[
                val => !!val || 'Email diperlukan',
                val => /.+@.+\..+/.test(val) || 'Format email tidak valid'
              ]"
            >
              <template v-slot:prepend>
                <q-icon name="email" size="sm" color="grey-6" />
              </template>
            </q-input>

            <!-- Password Row -->
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.password"
                  label="Password *"
                  :type="showPassword ? 'text' : 'password'"
                  outlined
                  dense
                  :rules="[
                    val => !!val || 'Password diperlukan',
                    val => val.length >= 6 || 'Minimal 6 karakter'
                  ]"
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
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.confirmPassword"
                  label="Konfirmasi Password *"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  outlined
                  dense
                  :rules="[
                    val => !!val || 'Konfirmasi diperlukan',
                    val => val === form.password || 'Password tidak sama'
                  ]"
                >
                  <template v-slot:prepend>
                    <q-icon name="lock" size="sm" color="grey-6" />
                  </template>
                  <template v-slot:append>
                    <q-icon
                      :name="showConfirmPassword ? 'visibility_off' : 'visibility'"
                      class="cursor-pointer"
                      size="sm"
                      color="grey-6"
                      @click="showConfirmPassword = !showConfirmPassword"
                    />
                  </template>
                </q-input>
              </div>
            </div>

            <!-- Submit Button -->
            <q-btn
              type="submit"
              label="Daftar Sekarang"
              color="primary"
              unelevated
              class="full-width q-mt-sm"
              :loading="isLoading"
              :disable="isLoading"
              no-caps
            />

            <!-- Login Link -->
            <div class="text-center q-mt-md">
              <span class="text-grey-7 text-body2">Sudah punya akun?</span>
              <router-link to="/login" class="text-primary text-weight-medium q-ml-xs">
                Login
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
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'

const router = useRouter()
const $q = useQuasar()

const form = ref({
  username: '',
  email: '',
  fullName: '',
  password: '',
  confirmPassword: ''
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)

const onRegister = async () => {
  try {
    isLoading.value = true

    // Validation
    if (form.value.password !== form.value.confirmPassword) {
      $q.notify({
        type: 'negative',
        message: 'Password dan konfirmasi password tidak sama',
        icon: 'warning',
        position: 'top'
      })
      return
    }

    const registerData = {
      username: form.value.username.trim(),
      email: form.value.email.trim(),
      fullName: form.value.fullName.trim(),
      password: form.value.password
    }

    const response = await api.post('/auth/register', registerData)

    if (response.data.success) {
      $q.notify({
        type: 'positive',
        message: 'Registrasi berhasil! Silakan login.',
        icon: 'check',
        position: 'top'
      })

      // Redirect to login page
      setTimeout(() => {
        router.push('/login')
      }, 1000)
    }
  } catch (error) {
    console.error('Register error:', error)
    const errorMessage = error.response?.data?.message || 'Gagal mendaftar'

    $q.notify({
      type: 'negative',
      message: errorMessage,
      icon: 'warning',
      position: 'top'
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.register-card {
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
