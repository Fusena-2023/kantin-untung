<template>
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from 'stores/auth-store'

const authStore = useAuthStore()

onMounted(() => {
  // Initialize authentication on app startup
  authStore.initializeAuth()
})
</script>
