<template>
  <q-page class="q-pa-sm q-pa-md-md">
    <q-pull-to-refresh @refresh="onRefresh">
      <div class="row q-mb-md items-center justify-between">
        <div class="col">
          <h4 class="text-h5 text-h4-md q-ma-none">Manajemen User</h4>
          <p class="text-caption text-body2-md text-grey-6 q-mb-none">
            Kelola akun pegawai dan pemilik kantin
          </p>
        </div>
        <div class="col-auto gt-xs">
          <q-btn
            color="primary"
            icon="add"
            label="Tambah User"
            @click="openCreateDialog"
            no-caps
          />
        </div>
      </div>

    <!-- Users Table -->
    <q-card class="modern-card">
      <q-card-section class="q-pa-sm q-pa-md-md">
        <div class="row q-col-gutter-sm q-col-gutter-md-md q-mb-md">
          <q-input
            v-model="filters.search"
            label="Cari user..."
            outlined
            dense
            class="col-12 col-md-8"
            @keyup.enter="fetchUsers"
          >
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>

          <q-select
            v-model="filters.role"
            label="Filter Role"
            outlined
            dense
            :options="roleOptions"
            emit-value
            map-options
            clearable
            class="col-12 col-md-4"
            @update:model-value="fetchUsers"
          />
        </div>

        <!-- Desktop Table View -->
        <q-table
          :rows="users"
          :columns="columns"
          row-key="id"
          :loading="isLoading"
          :pagination="pagination"
          @request="onRequest"
          binary-state-sort
          class="gt-xs"
        >
          <template v-slot:body-cell-role="props">
            <q-td :props="props">
              <q-chip
                :color="props.row.userRole?.name === 'pemilik' ? 'orange' : 'blue'"
                text-color="white"
                :label="props.row.userRole?.displayName || 'Tidak ada role'"
                size="sm"
              />
            </q-td>
          </template>

          <template v-slot:body-cell-isActive="props">
            <q-td :props="props">
              <q-chip
                :color="props.value ? 'positive' : 'negative'"
                text-color="white"
                :label="props.value ? 'Aktif' : 'Nonaktif'"
                size="sm"
              />
            </q-td>
          </template>

          <template v-slot:body-cell-created_at="props">
            <q-td :props="props">
              <span v-if="props.row.created_at || props.row.createdAt">
                {{ formatDate(props.row.created_at || props.row.createdAt) }}
              </span>
              <span v-else class="text-grey">-</span>
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                flat
                round
                dense
                color="warning"
                icon="edit"
                @click="editUser(props.row)"
                size="sm"
              >
                <q-tooltip>Edit</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                dense
                color="negative"
                icon="delete"
                @click.stop.prevent="deleteUser(props.row)"
                :disable="isSubmitting"
                size="sm"
                class="q-ml-xs"
              >
                <q-tooltip>Hapus</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>

        <!-- Mobile Card View -->
        <div class="lt-sm">
          <div v-if="isLoading" class="text-center q-py-lg">
            <q-spinner color="primary" size="3em" />
            <div class="text-grey q-mt-sm">Memuat data...</div>
          </div>

          <div v-else-if="users.length === 0" class="text-center text-grey-5 q-py-lg">
            <q-icon name="people_outline" size="3em" color="grey-5" />
            <div class="q-mt-sm">Tidak ada user</div>
          </div>

          <div v-else class="q-gutter-sm">
            <q-card
              v-for="user in users"
              :key="user.id"
              bordered
              flat
            >
              <q-card-section class="q-pa-sm">
                <div class="row items-center q-mb-xs">
                  <div class="col">
                    <div class="text-subtitle2 text-weight-medium">{{ user.fullName }}</div>
                    <div class="text-caption text-grey-7">@{{ user.username }}</div>
                  </div>
                  <div class="col-auto">
                    <q-chip
                      :color="user.userRole?.name === 'pemilik' ? 'orange' : 'blue'"
                      text-color="white"
                      :label="user.userRole?.displayName || 'Tidak ada role'"
                      size="sm"
                      dense
                    />
                  </div>
                </div>

                <div class="row q-col-gutter-xs text-caption text-grey-7 q-mb-sm">
                  <div class="col-12">
                    <q-icon name="email" size="xs" class="q-mr-xs" />
                    {{ user.email }}
                  </div>
                  <div class="col-auto">
                    <q-chip
                      :color="user.isActive ? 'positive' : 'negative'"
                      text-color="white"
                      :label="user.isActive ? 'Aktif' : 'Nonaktif'"
                      size="sm"
                      dense
                    />
                  </div>
                  <div class="col-auto" v-if="user.created_at || user.createdAt">
                    <q-icon name="event" size="xs" class="q-mr-xs" />
                    {{ formatDate(user.created_at || user.createdAt) }}
                  </div>
                </div>

                <div class="row q-gutter-xs">
                  <q-btn
                    flat
                    dense
                    color="warning"
                    icon="edit"
                    label="Edit"
                    @click="editUser(user)"
                    size="sm"
                    no-caps
                  />
                  <q-btn
                    flat
                    dense
                    color="negative"
                    icon="delete"
                    label="Hapus"
                    @click="deleteUser(user)"
                    :disable="isSubmitting"
                    size="sm"
                    no-caps
                  />
                </div>
              </q-card-section>
            </q-card>

            <!-- Mobile Pagination -->
            <div class="row justify-center q-mt-md" v-if="pagination.rowsNumber > pagination.rowsPerPage">
              <q-pagination
                v-model="pagination.page"
                :max="Math.ceil(pagination.rowsNumber / pagination.rowsPerPage)"
                :max-pages="5"
                direction-links
                boundary-links
                @update:model-value="onPageChange"
                color="primary"
                size="sm"
              />
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    </q-pull-to-refresh>

    <!-- Floating Action Button (Mobile Only) -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]" class="lt-sm">
      <q-btn
        fab
        icon="add"
        color="primary"
        @click="openCreateDialog"
        class="fab-button"
        size="lg"
      >
        <q-tooltip
          anchor="center left"
          self="center right"
          :offset="[10, 0]"
          class="bg-primary text-subtitle2"
        >
          Tambah User Baru
        </q-tooltip>
      </q-btn>
    </q-page-sticky>

    <!-- Create/Edit User Dialog -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ editingUser ? 'Edit User' : 'Tambah User' }}</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit.prevent="onSubmit" ref="userFormRef" class="q-gutter-md">
            <q-input
              v-model="userForm.username"
              label="Username *"
              outlined
              dense
              :rules="[val => !!val && val.length >= 3 || 'Username minimal 3 karakter']"
              hint="Minimal 3 karakter, hanya huruf, angka, dan underscore"
            />

            <q-input
              v-model="userForm.email"
              label="Email *"
              type="email"
              outlined
              dense
              :rules="[
                val => !!val || 'Email diperlukan',
                val => /.+@.+\..+/.test(val) || 'Format email tidak valid'
              ]"
            />

            <q-input
              v-model="userForm.fullName"
              label="Nama Lengkap *"
              outlined
              dense
              :rules="[val => !!val && val.length >= 2 || 'Nama lengkap minimal 2 karakter']"
            />

            <q-input
              v-model="userForm.password"
              :label="editingUser ? 'Password (kosongkan jika tidak diubah)' : 'Password *'"
              type="password"
              outlined
              dense
              :rules="!editingUser ? [val => !!val && val.length >= 6 || 'Password minimal 6 karakter'] : [
                val => !val || val.length >= 6 || 'Password minimal 6 karakter jika diisi'
              ]"
              :hint="editingUser ? 'Kosongkan jika tidak ingin mengubah password' : 'Minimal 6 karakter'"
            />

            <q-select
              v-model="userForm.role"
              label="Role *"
              outlined
              dense
              :options="roleOptions"
              emit-value
              map-options
              :rules="[val => val !== '' && val !== null && val !== undefined || 'Role diperlukan']"
            />

            <q-checkbox
              v-model="userForm.isActive"
              label="Status Aktif"
              v-if="editingUser"
              color="primary"
              @update:model-value="onActiveStatusChange"
            />
          </q-form>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat label="Batal" color="grey" @click="forceCloseDialog" />
          <q-btn flat label="Tutup Paksa" color="orange" @click="emergencyClose" v-if="isSubmitting" />
          <q-btn
            label="Simpan"
            color="primary"
            @click="handleSimpanClick"
            :loading="isSubmitting"
            :disable="isSubmitting"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, reactive, watch } from 'vue'
import { useQuasar, Notify } from 'quasar'
import UserService from 'src/services/user'
import { formatDate } from 'src/utils/format'

const $q = useQuasar()

// Helper function for safe notifications
const showNotification = (options) => {
  try {
    if ($q && typeof $q.notify === 'function') {
      $q.notify(options)
    } else {
      Notify.create(options)
    }
  } catch (error) {
    console.error('Notification error:', error)
    // Fallback to basic alert if all else fails
    alert(`${options.color === 'positive' ? 'Success' : 'Error'}: ${options.message}`)
  }
}

const users = ref([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const showCreateDialog = ref(false)
const editingUser = ref(null)
const userFormRef = ref(null)

const filters = reactive({
  search: '',
  role: ''
})

const userForm = reactive({
  username: '',
  email: '',
  fullName: '',
  password: '',
  role: 2, // Default ke pegawai
  isActive: true
})

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0
})

const roleOptions = [
  { label: 'Pegawai', value: 2 },
  { label: 'Pemilik', value: 1 }
]

const columns = [
  {
    name: 'username',
    label: 'Username',
    align: 'left',
    field: 'username',
    sortable: true
  },
  {
    name: 'fullName',
    label: 'Nama Lengkap',
    align: 'left',
    field: 'fullName',
    sortable: true
  },
  {
    name: 'email',
    label: 'Email',
    align: 'left',
    field: 'email',
    sortable: true
  },
  {
    name: 'role',
    label: 'Role',
    align: 'center',
    field: row => row.userRole?.displayName || 'Tidak ada role',
    sortable: true
  },
  {
    name: 'isActive',
    label: 'Status',
    align: 'center',
    field: 'isActive',
    sortable: true
  },
  {
    name: 'created_at',
    label: 'Dibuat',
    align: 'left',
    field: row => row.created_at || row.createdAt,
    sortable: true
  },
  {
    name: 'actions',
    label: 'Aksi',
    align: 'center',
    field: 'actions'
  }
]

const fetchUsers = async () => {
  try {
    isLoading.value = true
    const params = {
      page: pagination.value.page,
      limit: pagination.value.rowsPerPage,
      search: filters.search,
      role: filters.role
    }

    const response = await UserService.getUsers(params)
    users.value = response.data.users
    pagination.value.rowsNumber = response.data.pagination?.total || response.data.users.length
  } catch (error) {
    showNotification({
      color: 'negative',
      message: error,
      icon: 'warning'
    })
  } finally {
    isLoading.value = false
  }
}

const onRefresh = async (done) => {
  await fetchUsers()
  done()
}

const onPageChange = (page) => {
  pagination.value.page = page
  fetchUsers()
}

const onRequest = (props) => {
  pagination.value.page = props.pagination.page
  pagination.value.rowsPerPage = props.pagination.rowsPerPage
  fetchUsers()
}

const onActiveStatusChange = (newValue) => {
  console.log('Checkbox status aktif changed:', newValue)
  console.log('Current form state:', userForm)
}

const openCreateDialog = () => {
  console.log('Opening create dialog...')
  editingUser.value = null

  // Reset form untuk user baru
  Object.assign(userForm, {
    username: '',
    email: '',
    fullName: '',
    password: '',
    role: 2, // Default ke pegawai
    isActive: true
  })

  showCreateDialog.value = true
  console.log('Create dialog opened')
}

const editUser = (user) => {
  console.log('Edit user data:', user) // Debug log
  editingUser.value = user
  userForm.username = user.username
  userForm.email = user.email
  userForm.fullName = user.fullName
  userForm.password = ''
  userForm.role = user.role || user.userRole?.id || 2
  userForm.isActive = user.isActive !== undefined ? user.isActive : true
  showCreateDialog.value = true
  console.log('Edit form populated:', userForm)
}

const deleteUser = async (user) => {
  console.log('=== DELETE USER FUNCTION CALLED ===')
  console.log('Delete user clicked:', user)

  if (!user || !user.id) {
    console.error('Invalid user data:', user)
    showNotification({
      color: 'negative',
      message: 'Data user tidak valid',
      icon: 'warning',
      position: 'top'
    })
    return
  }

  const userName = user.fullName || user.username || 'User tidak dikenal'

  try {
    console.log('Creating delete confirmation dialog...')

    // Use native confirm as fallback
    const confirmed = confirm(`Apakah Anda yakin ingin menghapus user "${userName}"?`)

    if (!confirmed) {
      console.log('Delete cancelled by user')
      return
    }

    console.log('Delete confirmed for user:', user.id)
    console.log('Calling UserService.deleteUser...')

    await UserService.deleteUser(user.id)

    console.log('User deleted successfully')

    showNotification({
      color: 'positive',
      message: 'User berhasil dihapus',
      icon: 'check',
      position: 'top'
    })

    console.log('Refreshing users list...')
    await fetchUsers()
    console.log('Users list refreshed')

  } catch (error) {
    console.error('Delete user error:', error)
    showNotification({
      color: 'negative',
      message: typeof error === 'string' ? error : (error.message || 'Gagal menghapus user'),
      icon: 'warning',
      position: 'top'
    })
  }
}

const handleSimpanClick = () => {
  console.log('=== TOMBOL SIMPAN DIKLIK ===')
  console.log('Current form data:', userForm)
  console.log('Is editing:', !!editingUser.value)
  console.log('Is submitting:', isSubmitting.value)

  if (isSubmitting.value) {
    console.log('Already submitting, ignoring click')
    return
  }

  validateAndSubmit()
}

const validateAndSubmit = () => {
  console.log('Validating form...', userForm)

  // Simple validation before submit
  if (!userForm.username || !userForm.email || !userForm.fullName) {
    showNotification({
      color: 'negative',
      message: 'Mohon lengkapi semua field yang diperlukan',
      icon: 'warning',
      position: 'top'
    })
    return
  }

  if (!editingUser.value && !userForm.password) {
    showNotification({
      color: 'negative',
      message: 'Password diperlukan untuk user baru',
      icon: 'warning',
      position: 'top'
    })
    return
  }

  if (!userForm.role) {
    showNotification({
      color: 'negative',
      message: 'Role harus dipilih',
      icon: 'warning',
      position: 'top'
    })
    return
  }

  console.log('Form validation passed, submitting...')
  onSubmit()
}

const onSubmit = async () => {
  if (isSubmitting.value) {
    console.log('Already submitting, skipping...')
    return
  }

  try {
    isSubmitting.value = true
    console.log('Starting submit...', {
      editingUser: editingUser.value,
      isEdit: !!editingUser.value,
      formData: userForm
    })

    const userData = {
      username: userForm.username.trim(),
      email: userForm.email.trim(),
      fullName: userForm.fullName.trim(),
      role: parseInt(userForm.role)
    }

    if (userForm.password && userForm.password.trim()) {
      userData.password = userForm.password.trim()
    }

    let result
    if (editingUser.value) {
      userData.isActive = userForm.isActive
      console.log('Updating user...', userData)
      result = await UserService.updateUser(editingUser.value.id, userData)
      console.log('Update result:', result)

      showNotification({
        color: 'positive',
        message: 'User berhasil diupdate',
        icon: 'check',
        position: 'top'
      })
    } else {
      if (!userData.password) {
        throw new Error('Password diperlukan untuk user baru')
      }
      console.log('Creating user...', userData)
      result = await UserService.createUser(userData)
      console.log('Create result:', result)

      showNotification({
        color: 'positive',
        message: 'User berhasil dibuat',
        icon: 'check',
        position: 'top'
      })
    }

    // Force close dialog and refresh
    console.log('Closing dialog and refreshing...')

    // Close dialog first
    forceCloseDialog()

    // Then refresh data
    setTimeout(async () => {
      try {
        await fetchUsers()
        console.log('Users refreshed successfully')
      } catch (refreshError) {
        console.error('Error refreshing users:', refreshError)
      }
    }, 100)

  } catch (error) {
    console.error('Submit error:', error)
    showNotification({
      color: 'negative',
      message: typeof error === 'string' ? error : (error.message || 'Terjadi kesalahan saat menyimpan user'),
      icon: 'warning',
      position: 'top'
    })
  } finally {
    isSubmitting.value = false
    console.log('Submit finished')
  }
}

const emergencyClose = () => {
  console.log('EMERGENCY CLOSE ACTIVATED!')
  showCreateDialog.value = false
  editingUser.value = null
  isSubmitting.value = false

  // Reset everything
  Object.assign(userForm, {
    username: '',
    email: '',
    fullName: '',
    password: '',
    role: 2,
    isActive: true
  })

  // Force page refresh if needed
  setTimeout(() => {
    if (showCreateDialog.value) {
      console.log('Emergency close failed, reloading page...')
      location.reload()
    }
  }, 500)
}

const forceCloseDialog = () => {
  try {
    console.log('Force closing dialog...')
    console.log('Current dialog state:', showCreateDialog.value)
    console.log('Current editing user:', editingUser.value)
    console.log('Current submitting state:', isSubmitting.value)

    // Force close dialog immediately
    showCreateDialog.value = false
    editingUser.value = null
    isSubmitting.value = false

    // Immediate reset without timeout
    Object.assign(userForm, {
      username: '',
      email: '',
      fullName: '',
      password: '',
      role: 2,
      isActive: true
    })

    console.log('Dialog force closed successfully')
    console.log('New dialog state:', showCreateDialog.value)

    // Force Vue reactivity update
    setTimeout(() => {
      console.log('Dialog state after timeout:', showCreateDialog.value)
      if (showCreateDialog.value) {
        console.log('WARNING: Dialog still open after force close!')
        showCreateDialog.value = false
      }
    }, 10)
  } catch (error) {
    console.error('Error closing dialog:', error)
  }
}

onMounted(() => {
  fetchUsers()
})

// Watch dialog state changes
watch(showCreateDialog, (newVal, oldVal) => {
  console.log('Dialog state changed:', { from: oldVal, to: newVal })
  if (!newVal) {
    console.log('Dialog closed')
  } else {
    console.log('Dialog opened')
  }
})

// Watch editing user changes
watch(editingUser, (newVal, oldVal) => {
  console.log('Editing user changed:', { from: oldVal, to: newVal })
})

// Watch isSubmitting changes
watch(isSubmitting, (newVal, oldVal) => {
  console.log('isSubmitting changed:', { from: oldVal, to: newVal })
})
</script>

<style scoped>
/* Modern Card Styling */
.modern-card {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.modern-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* Floating Action Button */
.fab-button {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fab-button:hover {
  transform: scale(1.1) rotate(90deg);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
}

.fab-button:active {
  transform: scale(0.95);
}
</style>
