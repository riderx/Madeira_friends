<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const currentPath = computed(() => route.path)
</script>

<template>
  <div class="min-h-screen bg-black">
    <!-- Content Area -->
    <div class="container mx-auto px-4 py-8">
      <router-view></router-view>
    </div>
  </div>
</template>