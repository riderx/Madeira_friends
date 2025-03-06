<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({
  breaks: true,
  linkify: true,
  typographer: true
})
const rentals = ref([])
const loading = ref(true)
const page = ref(1)
const hasMore = ref(true)
const selectedType = ref('')
const perPage = 9

const rentalTypes = ['flat', 'house', 'scooter', 'motorbike', 'car']

async function fetchRentals() {
  try {
    let query = supabase
      .from('rentals')
      .select('*, profiles!rentals_creator_id_fkey(full_name)')
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range((page.value - 1) * perPage, page.value * perPage - 1)
    
    if (selectedType.value) {
      query = query.eq('type', selectedType.value)
    }
    
    const { data, error } = await query

    if (error) throw error
    
    if (page.value === 1) {
      rentals.value = data
    } else {
      rentals.value = [...rentals.value, ...data]
    }
    
    hasMore.value = data.length === perPage
  } catch (error) {
    console.error('Error fetching rentals:', error)
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  selectedType.value = ''
  page.value = 1
  fetchRentals()
}

async function loadMore() {
  page.value++
  await fetchRentals()
}

onMounted(() => {
  fetchRentals()
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-4xl">Rentals</h1>
      
      <select 
        v-model="selectedType"
        class="bg-black border-2 border-white px-3 py-2 uppercase"
        @change="page = 1; fetchRentals()"
      >
        <option value="">All Types</option>
        <option v-for="type in rentalTypes" :key="type" :value="type">
          {{ type }}
        </option>
      </select>
    </div>
    
    <div v-if="loading && page === 1" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-if="rentals.length === 0" class="col-span-full text-center py-8">
        <p class="text-gray-400">No rentals available at the moment.</p>
      </div>
      
      <div v-for="rental in rentals" :key="rental.id" class="card-event">
        <figure v-if="rental.images?.[0]" class="relative h-48">
          <img :src="rental.images[0]" :alt="rental.title" class="w-full h-full object-cover" />
          <div class="absolute top-2 right-2">
            <span class="badge-category">{{ rental.type }}</span>
          </div>
        </figure>
        
        <div class="p-4">
          <h2 class="text-xl mb-4">{{ rental.title }}</h2>
          
          <div class="flex items-center gap-2 text-sm text-white/60 mb-2">
            <span class="material-icons text-base">euro</span>
            {{ rental.price_per_day }} € per day
          </div>
          
          <div class="flex items-center gap-2 text-sm text-white/60 mb-4">
            <span class="material-icons text-base">location_on</span>
            {{ rental.location }}
          </div>
          
          <div class="prose prose-invert prose-sm mb-4" v-html="md.render(rental.description || '')"></div>
          
          <div class="flex items-center gap-2 text-sm text-white/60">
            <span class="material-icons text-base">person</span>
            <span>By {{ rental.profiles?.full_name }}</span>
            <span class="material-icons text-base ml-4">schedule</span>
            <span>Min {{ rental.min_duration }} days</span>
          </div>
          
          <div class="flex justify-end mt-4">
            <router-link :to="`/rentals/${rental.id}`" class="btn-primary px-6 py-2">
              View Details
            </router-link>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="hasMore" class="flex justify-center mt-8">
      <button 
        @click="loadMore"
        class="btn-primary px-8 py-2"
        :disabled="loading"
      >
        <span v-if="loading" class="loading loading-spinner"></span>
        <span v-else>Load More</span>
      </button>
    </div>
  </div>
</template>

<style>
.prose {
  max-width: none;
}
</style>