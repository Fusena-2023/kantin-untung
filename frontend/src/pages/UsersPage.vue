<template>
  <q-page class="q-pa-md">
    <div class="row q-mb-lg items-center">
      <div class="col">
        <h4 class="text-h4 q-ma-none">Manajemen User</h4>
        <p class="text-subtitle1 text-grey-7">
          Kelola akun pegawai dan pemilik kantin
        </p>
      </div>
      <div class="col-auto">
        <q-btn
          color="primary"
          icon="add"
          label="Tambah User"
          @click="showCreateDialog = true"
        />
      </div>
    </div>

    <!-- Users Table -->
    <q-card>
      <q-card-section>
        <div class="row q-mb-md">
          <q-input
            v-model="filters.search"
            label="Cari user..."
            outlined
            class="col-12 col-md-4"
            @keyup.enter="fetchUsers"
          >
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>

          <q-space />

          <q-select
            v-model="filters.role"
            label="Filter Role"
            outlined
            :options="roleOptions"
            emit-value
            map-options
            clearable
            class="col-12 col-md-2"
            @update:model-value="fetchUsers"
          />
        </div>

        <q-table
          :rows="users"
          :columns="columns"
          row-key="id"
          :loading="isLoading"
          :pagination="pagination"
          @request="onRequest"
          binary-state-sort
        >
          <template v-slot:body-cell-role="props">
            <q-td :props="props">
              <q-chip
                :color="props.value === 'pemilik' ? 'orange' : 'blue'"
                text-color="white"
                :label="props.value === 'pemilik' ? 'Pemilik' : 'Pegawai'"
              />
            </q-td>
          </template>

          <template v-slot:body-cell-isActive="props">
            <q-td :props="props">
              <q-chip
                :color="props.value ? 'positive' : 'negative'"
                text-color="white"
                :label="props.value ? 'Aktif' : 'Nonaktif'"
              />
            </q-td>
          </template>

          <template v-slot:body-cell-created_at="props">
            <q-td :props="props">
              {{ formatDate(props.value) }}
            </q-td>
          </template>

          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                flat
                round
                color="warning"
                icon="edit"
                @click="editUser(props.row)"
              />
              <q-btn
                flat
                round
                color="negative"
                icon="delete"
                @click="deleteUser(props.row)"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <!-- Create/Edit User Dialog -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ editingUser ? 'Edit User' : 'Tambah User' }}</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="onSubmit" ref="userForm">
            <q-input
              v-model="userForm.username"
              label="Username *"
              outlined
              class="q-mb-md"
              :rules="[val => !!val || 'Username diperlukan']"
            />

            <q-input
              v-model="userForm.email"
              label="Email *"
              type="email"
              outlined
              class="q-mb-md"
              :rules="[val => !!val || 'Email diperlukan']"
            />

            <q-input
              v-model="userForm.fullName"
              label="Nama Lengkap *"
              outlined
              class="q-mb-md"
              :rules="[val => !!val || 'Nama lengkap diperlukan']"
            />

            <q-input
              v-model="userForm.password"
              :label="editingUser ? 'Password (kosongkan jika tidak diubah)' : 'Password *'"
              type="password"
              outlined
              class="q-mb-md"
              :rules="!editingUser ? [val => !!val || 'Password diperlukan'] : []"
            />

            <q-select
              v-model="userForm.role"
              label="Role *"
              outlined
              :options="roleOptions"
              emit-value
              map-options
              class="q-mb-md"
              :rules="[val => !!val || 'Role diperlukan']"
            />

            <q-checkbox
              v-model="userForm.isActive"
              label="Aktif"
              v-if="editingUser"
            />
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Batal" color="grey" @click="closeDialog" />
          <q-btn
            label="Simpan"
            color="primary"
            @click="$refs.userForm.submit()"
            :loading="isSubmitting"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useQuasar } from 'quasar'
import UserService from 'src/services/user'
import { formatDate } from 'src/utils/format'

const $q = useQuasar()

const users = ref([])
const isLoading = ref(false)
const isSubmitting = ref(false)
const showCreateDialog = ref(false)
const editingUser = ref(null)

const filters = reactive({
  search: '',
  role: ''
})

const userForm = reactive({
  username: '',
  email: '',
  fullName: '',
  password: '',
  role: '',
  isActive: true
})

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0
})

const roleOptions = [
  { label: 'Pegawai', value: 'pegawai' },
  { label: 'Pemilik', value: 'pemilik' }
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
    field: 'full_name',
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
    field: 'role',
    sortable: true
  },
  {
    name: 'isActive',
    label: 'Status',
    align: 'center',
    field: 'is_active',
    sortable: true
  },
  {
    name: 'created_at',
    label: 'Dibuat',
    align: 'left',
    field: 'created_at',
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

    const data = await UserService.getUsers(params)
    users.value = data.users
    pagination.value.rowsNumber = data.pagination.total
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error,
      icon: 'warning'
    })
  } finally {
    isLoading.value = false
  }
}

const onRequest = (props) => {
  pagination.value.page = props.pagination.page
  pagination.value.rowsPerPage = props.pagination.rowsPerPage
  fetchUsers()
}

const editUser = (user) => {
  editingUser.value = user
  userForm.username = user.username
  userForm.email = user.email
  userForm.fullName = user.full_name
  userForm.password = ''
  userForm.role = user.role
  userForm.isActive = user.is_active
  showCreateDialog.value = true
}

const deleteUser = async (user) => {
  $q.dialog({
    title: 'Konfirmasi',
    message: `Apakah Anda yakin ingin menghapus user "${user.full_name}"?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await UserService.deleteUser(user.id)
      $q.notify({
        color: 'positive',
        message: 'User berhasil dihapus',
        icon: 'check'
      })
      fetchUsers()
    } catch (error) {
      $q.notify({
        color: 'negative',
        message: error,
        icon: 'warning'
      })
    }
  })
}

const onSubmit = async () => {
  try {
    isSubmitting.value = true

    const userData = {
      username: userForm.username,
      email: userForm.email,
      fullName: userForm.fullName,
      role: userForm.role
    }

    if (userForm.password) {
      userData.password = userForm.password
    }

    if (editingUser.value) {
      userData.isActive = userForm.isActive
      await UserService.updateUser(editingUser.value.id, userData)
      $q.notify({
        color: 'positive',
        message: 'User berhasil diupdate',
        icon: 'check'
      })
    } else {
      userData.password = userForm.password
      await UserService.createUser(userData)
      $q.notify({
        color: 'positive',
        message: 'User berhasil dibuat',
        icon: 'check'
      })
    }

    closeDialog()
    fetchUsers()
  } catch (error) {
    $q.notify({
      color: 'negative',
      message: error,
      icon: 'warning'
    })
  } finally {
    isSubmitting.value = false
  }
}

const closeDialog = () => {
  showCreateDialog.value = false
  editingUser.value = null
  Object.assign(userForm, {
    username: '',
    email: '',
    fullName: '',
    password: '',
    role: '',
    isActive: true
  })
}

onMounted(() => {
  fetchUsers()
})
</script>
