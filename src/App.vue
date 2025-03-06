<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navigation from './components/Navigation.vue'
import StructuredData from './components/StructuredData.vue'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const appReady = ref(false)

const showNavigation = computed(() => {
  return authStore.user && route.path.startsWith('/app')
})

// Watch for changes in authentication state to update navigation
watch(
  () => authStore.user,
  (newUser) => {
    if (newUser && route.path.startsWith('/app')) {
      console.log('User authenticated, ensuring correct app navigation')
    }
    else if (!newUser && route.path.startsWith('/app')) {
      console.log(
        'User not authenticated but on app path, redirecting to login',
      )
      router.push('/login')
    }
  },
)

onMounted(async () => {
  try {
    await authStore.initUser()
  }
  catch (e) {
    console.error('Error initializing app:', e)
  }
  finally {
    appReady.value = true
  }
})
</script>

<template>
  <div class="min-h-screen bg-black">
    <!-- Loading spinner while app initializes -->
    <div
      v-if="!appReady || authStore.loading"
      class="flex items-center justify-center min-h-screen"
    >
      <span class="loading loading-spinner loading-lg text-primary" />
    </div>

    <!-- App content once authentication is determined -->
    <template v-else>
      <router-view />
      <Navigation v-if="showNavigation" />
      <StructuredData />
    </template>
  </div>
</template>
