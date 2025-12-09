<template>
  <q-page class="flex flex-center bg-gradient">
    <q-card class="register-card q-pa-md" style="width: 100%; max-width: 500px;">
      <q-card-section class="text-center">
        <div class="text-h4 text-weight-bold text-primary q-mb-xs">
          Daftar Akun Baru
        </div>
        <div class="text-subtitle2 text-grey-7">
          Kantin Untung - Sistem Manajemen Keuangan
        </div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="onRegister" class="q-gutter-md">
          <q-input
            v-model="form.username"
            label="Username *"
            outlined
            dense
            :rules="[
              val => !!val || 'Username diperlukan',
              val => val.length >= 3 || 'Username minimal 3 karakter',
              val => /^[a-zA-Z0-9_]+$/.test(val) || 'Hanya huruf, angka, dan underscore'
            ]"
            hint="Minimal 3 karakter, hanya huruf, angka, dan underscore"
          >
            <template v-slot:prepend>
              <q-icon name="person" />
            </template>
          </q-input>

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
              <q-icon name="email" />
            </template>
          </q-input>

          <q-input
            v-model="form.fullName"
            label="Nama Lengkap *"
            outlined
            dense
            :rules="[
              val => !!val || 'Nama lengkap diperlukan',
              val => val.length >= 2 || 'Nama lengkap minimal 2 karakter'
            ]"
          >
            <template v-slot:prepend>
              <q-icon name="badge" />
            </template>
          </q-input>

          <q-input
            v-model="form.password"
            label="Password *"
            :type="showPassword ? 'text' : 'password'"
            outlined
            dense
            :rules="[
              val => !!val || 'Password diperlukan',
              val => val.length >= 6 || 'Password minimal 6 karakter'
            ]"
            hint="Minimal 6 karakter"
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

          <q-input
            v-model="form.confirmPassword"
            label="Konfirmasi Password *"
            :type="showConfirmPassword ? 'text' : 'password'"
            outlined
            dense
            :rules="[
              val => !!val || 'Konfirmasi password diperlukan',
              val => val === form.password || 'Password tidak sama'
            ]"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
            <template v-slot:append>
              <q-icon
                :name="showConfirmPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showConfirmPassword = !showConfirmPassword"
              />
            </template>
          </q-input>

          <div class="q-mt-md">
            <q-btn
              type="submit"
              label="Daftar"
              color="primary"
              class="full-width"
              :loading="isLoading"
              :disable="isLoading"
              size="md"
            />
          </div>

          <div class="text-center q-mt-md">
            <span class="text-grey-7">Sudah punya akun?</span>
            <router-link to="/login" class="text-primary text-weight-medium q-ml-xs">
              Login di sini
            </router-link>
          </div>
        </q-form>
      </q-card-section>
    </q-card>
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
.bg-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.register-card {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

a {
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>
