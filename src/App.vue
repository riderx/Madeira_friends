<script setup lang="ts">
import { useAuthStore } from './stores/auth'
import { useRoute } from 'vue-router'
import Navigation from './components/Navigation.vue'
import { computed, onMounted } from 'vue'

const authStore = useAuthStore()
const route = useRoute()

const showNavigation = computed(() => {
  return authStore.user && route.path.startsWith('/app')
})

onMounted(() => {
  authStore.initUser()
})
</script>

<template>
  <div class="min-h-screen bg-black">
    <router-view v-if="!authStore.loading" />
    <Navigation v-if="!authStore.loading && showNavigation" />
    <div v-else class="flex items-center justify-center min-h-screen">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>
  </div>
</template>
