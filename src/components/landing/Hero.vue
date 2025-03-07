<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function navigateToRegister() {
  router.push('/auth')
}
</script>

<template>
  <div class="relative text-white bg-black">
    <div class="absolute flex gap-2 top-4 right-4">
      <button
        class="px-4 py-2 text-sm font-bold text-black transition-colors duration-200 bg-white border-2 border-white cursor-pointer hover:bg-black hover:border-white hover:text-white"
        @click="navigateToRegister"
      >
        JOIN
      </button>
    </div>

    <header class="container px-4 py-16 mx-auto text-center">
      <img
        src="/assets/6cf6d34f7a43dd7e192cce5422460503.jpg?v=0b5e7665"
        alt="Madeira Friends Logo"
        class="w-48 h-48 mx-auto mb-8 border-4 border-white"
      >
      <h1 class="mb-4 text-5xl font-black">
        MADEIRA FRIENDS
      </h1>
      <p class="mb-12 text-xl font-bold">
        Your international community on the island. Digital nomads, remote
        workers, expats and locals.
      </p>

      <div class="flex justify-center mb-16">
        <a href="#supportus" class="px-8 py-4 font-bold text-center text-black transition-colors bg-yellow-400 border-2 border-yellow-400 cursor-pointer hover:bg-black hover:text-yellow-400 min-w-48">
          BECOME A SUPPORTER
        </a>
      </div>
    </header>
  </div>
</template>
