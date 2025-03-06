<template>
  <section class="py-16 text-black bg-white">
    <div class="container px-4 mx-auto text-center">
      <h2 class="mb-8 text-3xl font-bold">WE HELPED MANY FRIENDS IN 2023</h2>
      
      <div class="grid max-w-6xl gap-8 mx-auto mb-16 md:grid-cols-4">
        <div v-for="(stat, index) in stats" :key="index">
          <p class="mb-2 text-4xl font-bold">{{ stat.value }}</p>
          <p class="text-xl">{{ stat.label }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const stats = [
  { value: '10.000+', label: 'People at our events' },
  { value: '270+', label: 'In-person gatherings' },
  { value: '170+', label: 'Rentals' },
  { value: 'Dozens', label: 'Relocated people' },
  { value: 'Multiple', label: 'Giving-back initiatives' },
  { value: 'Several', label: 'New companies' },
  { value: 'Few cool', label: 'Tech events' },
  { value: '😏', label: 'New couples' }
]
</script>
