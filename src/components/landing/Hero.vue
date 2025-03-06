<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function navigateToApp() {
  router.push('/app/events')
}
</script>

<template>
  <header class="container mx-auto px-4 py-16 text-center">
    <img 
      src="/assets/6cf6d34f7a43dd7e192cce5422460503.jpg?v=0b5e7665" 
      alt="Madeira Friends Logo"
      class="w-48 h-48 mx-auto mb-8 rounded-full"
    />
    <h1 class="text-5xl font-bold mb-4">MADEIRA FRIENDS</h1>
    <p class="text-xl mb-12">Your international community on the island. Digital nomads, remote workers, expats and locals.</p>
    
    <div class="flex flex-col sm:flex-row gap-4 justify-center mb-16">
      <a href="#supportus" class="btn-primary px-8 py-4">
        BECOME A SUPPORTER
      </a>
      <button @click="router.push('/register')" class="btn-primary px-8 py-4">
        JOIN THE COMMUNITY
      </button>
      <a href="#contact" class="btn-primary px-8 py-4">
        NEED HELP?
      </a>
      <button @click="navigateToApp" class="btn-primary px-8 py-4">
        EXPLORE EVENTS
      </button>
    </div>
  </header>
</template>