<template>
  <section class="bg-white text-black py-16">
    <div class="container mx-auto px-4 text-center">
      <h2 class="text-3xl font-bold mb-8">WE HELPED MANY FRIENDS IN 2023</h2>
      
      <div class="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto mb-16">
        <div v-for="(stat, index) in stats" :key="index">
          <p class="text-4xl font-bold mb-2">{{ stat.value }}</p>
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