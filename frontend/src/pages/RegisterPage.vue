<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="row window-height overflow-hidden bg-gradient-kantin">
        <!-- Left Side - Visual & Branding -->
        <div class="col-md-6 gt-sm column justify-center items-center relative-position z-top">
          <div class="text-center q-pa-xl text-white">
            <q-img src="~assets/logo-kantin.png" width="300px" class="q-mb-lg drop-shadow-lg" />
            <h1 class="text-h3 text-weight-bold q-my-md text-shadow">Kantin Untung</h1>
            <div class="text-h6 text-weight-medium opacity-90 text-shadow" style="max-width: 500px">
              Bergabunglah sekarang untuk manajemen kantin yang lebih baik.
            </div>
          </div>
        </div>

        <!-- Right Side - Register Form -->
        <div class="col-12 col-md-6 column justify-center items-center q-pa-lg relative-position">
           <!-- Glass Card Container -->
          <div class="glass-card full-width q-pa-xl" style="max-width: 480px">
            <!-- Mobile Header -->
            <div class="lt-md text-center q-mb-lg">
              <q-img src="~assets/logo-kantin.png" width="100px" class="q-mb-sm" />
            </div>

            <div class="text-h4 text-weight-bold text-grey-9 q-mb-xs">Buat Akun Baru</div>
            <div class="text-subtitle1 text-grey-7 q-mb-lg">Daftarkan kantin Anda sekarang</div>

            <q-form @submit="onRegister" class="q-gutter-y-sm">
              <!-- Username & Nama Lengkap Row -->
              <div class="row q-col-gutter-sm">
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="form.username"
                    placeholder="Username"
                    outlined
                    dense
                    class="rounded-input"
                    bg-color="grey-1"
                    :rules="[
                      val => !!val || 'Username diperlukan',
                      val => val.length >= 3 || 'Min 3 karakter',
                      val => /^[a-zA-Z0-9_]+$/.test(val) || 'Huruf, angka, _'
                    ]"
                  >
                    <template v-slot:prepend>
                      <q-icon name="person_outline" size="20px" color="orange-8" class="q-pl-sm" />
                    </template>
                  </q-input>
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="form.fullName"
                    placeholder="Nama Lengkap"
                    outlined
                    dense
                    class="rounded-input"
                    bg-color="grey-1"
                    :rules="[
                      val => !!val || 'Nama diperlukan',
                      val => val.length >= 2 || 'Min 2 karakter'
                    ]"
                  >
                    <template v-slot:prepend>
                      <q-icon name="badge" size="20px" color="orange-8" class="q-pl-sm" />
                    </template>
                  </q-input>
                </div>
              </div>

              <!-- Email -->
              <q-input
                v-model="form.email"
                placeholder="Email"
                type="email"
                outlined
                dense
                class="rounded-input"
                bg-color="grey-1"
                :rules="[
                  val => !!val || 'Email diperlukan',
                  val => /.+@.+\..+/.test(val) || 'Format email tidak valid'
                ]"
              >
                <template v-slot:prepend>
                  <q-icon name="mail_outline" size="20px" color="orange-8" class="q-pl-sm" />
                </template>
              </q-input>

              <!-- Password Row -->
              <div class="row q-col-gutter-sm">
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="form.password"
                    placeholder="Password"
                    :type="showPassword ? 'text' : 'password'"
                    outlined
                    dense
                    class="rounded-input"
                    bg-color="grey-1"
                    :rules="[
                      val => !!val || 'Password diperlukan',
                      val => val.length >= 6 || 'Min 6 karakter'
                    ]"
                  >
                    <template v-slot:prepend>
                      <q-icon name="lock_outline" size="20px" color="orange-8" class="q-pl-sm" />
                    </template>
                    <template v-slot:append>
                      <q-icon
                        :name="showPassword ? 'visibility_off' : 'visibility'"
                        class="cursor-pointer q-pr-xs"
                        size="xs"
                        color="grey-6"
                        @click="showPassword = !showPassword"
                      />
                    </template>
                  </q-input>
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    v-model="form.confirmPassword"
                    placeholder="Konfirmasi"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    outlined
                    dense
                    class="rounded-input"
                    bg-color="grey-1"
                    :rules="[
                      val => !!val || 'Konfirmasi diperlukan',
                      val => val === form.password || 'Password tidak sama'
                    ]"
                  >
                    <template v-slot:prepend>
                      <q-icon name="lock_outline" size="20px" color="orange-8" class="q-pl-sm" />
                    </template>
                    <template v-slot:append>
                      <q-icon
                        :name="showConfirmPassword ? 'visibility_off' : 'visibility'"
                        class="cursor-pointer q-pr-xs"
                        size="xs"
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
                label="DAFTAR SEKARANG"
                unelevated
                class="full-width q-mt-md shadow-2"
                :loading="isLoading"
                :disable="isLoading"
                no-caps
                rounded
                style="background: linear-gradient(to right, #ff9800, #f57c00); height: 44px; font-weight: bold; font-size: 15px; letter-spacing: 0.5px;"
              />

              <!-- Login Link -->
              <div class="text-center q-mt-md">
                <span class="text-grey-8 text-caption">Sudah punya akun?</span>
                <router-link to="/login" class="text-orange-9 text-weight-bold q-ml-xs text-caption" style="text-decoration: none">
                  Masuk di sini
                </router-link>
              </div>
            </q-form>
          </div>

          <div class="absolute-bottom text-center q-pb-md text-caption text-white lt-md">
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
.bg-gradient-kantin {
  /* Same warm gradient as Login Page */
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
