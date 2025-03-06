<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function navigateToApp() {
  router.push('/app/events')
}
</script>

<template>
  <header class="container px-4 py-16 mx-auto text-center">
    <img
      src="/assets/6cf6d34f7a43dd7e192cce5422460503.jpg?v=0b5e7665"
      alt="Madeira Friends Logo"
      class="w-48 h-48 mx-auto mb-8 rounded-full"
    >
    <h1 class="mb-4 text-5xl font-bold">
      MADEIRA FRIENDS
    </h1>
    <p class="mb-12 text-xl">
      Your international community on the island. Digital nomads, remote
      workers, expats and locals.
    </p>

    <div class="flex flex-col justify-center gap-4 mb-16 sm:flex-row">
      <a href="#supportus" class="px-8 py-4 btn-primary">
        BECOME A SUPPORTER
      </a>
      <button class="px-8 py-4 btn-primary" @click="router.push('/register')">
        JOIN THE COMMUNITY
      </button>
      <a href="#contact" class="px-8 py-4 btn-primary"> NEED HELP? </a>
      <button class="px-8 py-4 btn-primary" @click="navigateToApp">
        EXPLORE EVENTS
      </button>
    </div>
  </header>
</template>
