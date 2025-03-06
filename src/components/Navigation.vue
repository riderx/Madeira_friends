<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const currentPath = computed(() => route.path)
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 px-4 py-2 bg-black border-t-2 border-white">
    <div class="container relative flex items-center justify-around mx-auto">
      <router-link 
        to="/app/events" 
        class="flex flex-col items-center p-2"
        :class="{ 'text-white': currentPath === '/app/events', 'text-white/60': currentPath !== '/app/events' }"
      >
        <i class="text-2xl fas fa-calendar-days"></i>
        <span class="mt-1 text-xs">Events</span>
      </router-link>
      
      <router-link 
        to="/app/rentals" 
        class="flex flex-col items-center p-2"
        :class="{ 'text-white': currentPath === '/app/rentals', 'text-white/60': currentPath !== '/app/rentals' }"
      >
        <i class="text-2xl fas fa-house"></i>
        <span class="mt-1 text-xs">Rentals</span>
      </router-link>
      
      <router-link 
        to="/app/bookings" 
        class="flex flex-col items-center p-2"
        :class="{ 'text-white': currentPath === '/app/bookings', 'text-white/60': currentPath !== '/app/bookings' }"
      >
        <i class="text-2xl fas fa-ticket"></i>
        <span class="mt-1 text-xs">Bookings</span>
      </router-link>
      
      <router-link 
        to="/app/creator" 
        class="flex flex-col items-center p-2"
        :class="{ 'text-white': currentPath === '/app/creator', 'text-white/60': currentPath !== '/app/creator' }"
      >
        <i class="text-2xl fas fa-plus"></i>
        <span class="mt-1 text-xs">Create</span>
      </router-link>
      
      <router-link 
        to="/app/account" 
        class="flex flex-col items-center p-2"
        :class="{ 'text-white': currentPath.startsWith('/app/account'), 'text-white/60': !currentPath.startsWith('/app/account') }"
      >
        <i class="text-2xl fas fa-user"></i>
        <span class="mt-1 text-xs">Profile</span>
      </router-link>
    </div>
  </nav>
</template>
