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
const events = ref([])
const loading = ref(true)
const page = ref(1)
const hasMore = ref(true)
const selectedCategory = ref('')
const timeFilter = ref('all')
const perPage = 9

const categories = ['Party', 'Sports', 'Culture', 'Food', 'Hiking', 'Other']

const timeFilterOptions = [
  { value: 'all', label: 'All Events' },
  { value: 'future', label: 'Upcoming' },
  { value: 'past', label: 'Past' }
]

async function fetchEvents() {
  try {
    let query = supabase
      .from('events')
      .select('*, profiles!events_creator_id_fkey(full_name)')
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('date', { ascending: timeFilter.value !== 'past' })
      .range((page.value - 1) * perPage, page.value * perPage - 1)
    
    if (selectedCategory.value) {
      query = query.eq('category', selectedCategory.value)
    }
    
    if (timeFilter.value === 'future') {
      query = query.gte('date', new Date().toISOString())
    } else if (timeFilter.value === 'past') {
      query = query.lt('date', new Date().toISOString())
    }
    
    const { data, error } = await query

    if (error) throw error
    
    if (page.value === 1) {
      events.value = data
    } else {
      events.value = [...events.value, ...data]
    }
    
    hasMore.value = data.length === perPage
  } catch (error) {
    console.error('Error fetching events:', error)
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  selectedCategory.value = ''
  timeFilter.value = 'all'
  page.value = 1
  fetchEvents()
}

async function loadMore() {
  page.value++
  await fetchEvents()
}

onMounted(() => {
  fetchEvents()
})
</script>

<template>
  <div class="container px-4 py-8 mx-auto">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-4xl">Events</h1>
      
      <div class="flex gap-4">
        <select 
          v-model="timeFilter"
          class="px-3 py-2 uppercase bg-black border-2 border-white"
          @change="page = 1; fetchEvents()"
        >
          <option v-for="option in timeFilterOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
        
        <select 
          v-model="selectedCategory"
          class="px-3 py-2 uppercase bg-black border-2 border-white"
          @change="page = 1; fetchEvents()"
        >
          <option value="">All Categories</option>
          <option v-for="category in categories" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
      </div>
    </div>
    
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
    
    <div v-else class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div v-if="events.length === 0" class="py-8 text-center col-span-full">
        <p class="text-gray-400">No events available at the moment.</p>
      </div>
      
      <div v-for="event in events" :key="event.id" class="card-event">
        <figure v-if="event.images?.[0]" class="relative h-48">
          <img :src="event.images[0]" :alt="event.title" class="object-cover w-full h-full" />
          <div class="absolute top-2 right-2">
            <span class="badge-category">{{ event.category }}</span>
          </div>
        </figure>
        
        <div class="p-4">
          <h2 class="mb-4 text-xl">{{ event.title }}</h2>
          
          <div class="flex items-center gap-2 mb-2 text-sm text-white/60">
            <span class="text-base material-icons">schedule</span>
            {{ format(new Date(event.date), 'PPP') }}
          </div>
          
          <div class="flex items-center gap-2 mb-4 text-sm text-white/60">
            <span class="text-base material-icons">location_on</span>
            {{ event.location }}
          </div>
          
          <div class="mb-4 prose-sm prose prose-invert" v-html="md.render(event.description || '')"></div>
          
          <div class="flex items-center gap-2 text-sm text-white/60">
            <div class="flex items-center gap-2">
              <span class="text-base material-icons">person</span>
              <span>By {{ event.profiles?.full_name }}</span>
            </div>
            <div class="flex items-center gap-2 ml-4">
              <span class="text-base material-icons">group</span>
              <span>{{ event.max_attendees ? `${event.max_attendees} spots` : 'Unlimited' }}</span>
            </div>
          </div>
          
          <div class="flex justify-end mt-4">
            <router-link :to="`/app/events/${event.id}`" class="px-6 py-2 btn-primary">
              View Details
            </router-link>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="hasMore" class="flex justify-center mt-8">
      <button 
        @click="loadMore"
        class="px-8 py-2 btn-primary"
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
