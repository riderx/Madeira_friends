<script setup lang="ts">
import type { Database } from '../types/supabase'
import { format } from 'date-fns'
import MarkdownIt from 'markdown-it'
import { onMounted, ref } from 'vue'
import { supabase } from '../lib/supabase'

type Event = Database['public']['Tables']['events']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']
const md = new MarkdownIt({
  breaks: true,
  linkify: true,
  typographer: true,
})
const events = ref<(Event & { profiles: Profile })[]>([])
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
  { value: 'past', label: 'Past' },
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
    }
    else if (timeFilter.value === 'past') {
      query = query.lt('date', new Date().toISOString())
    }

    const { data, error } = await query

    if (error)
      throw error

    if (page.value === 1) {
      events.value = data as (Event & { profiles: Profile })[]
    }
    else {
      events.value = [...events.value, ...data] as (Event & {
        profiles: Profile
      })[]
    }

    hasMore.value = data.length === perPage
  }
  catch (error) {
    console.error('Error fetching events:', error)
  }
  finally {
    loading.value = false
  }
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
    <h1 class="mb-4 text-3xl md:text-4xl">
      Events
    </h1>

    <div class="flex flex-wrap items-center justify-end gap-3 mb-8">
      <select
        v-model="timeFilter"
        class="px-3 py-2 text-sm uppercase bg-black border-2 border-white"
        @change="
          page = 1;
          fetchEvents();
        "
      >
        <option
          v-for="option in timeFilterOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>

      <select
        v-model="selectedCategory"
        class="px-3 py-2 text-sm uppercase bg-black border-2 border-white"
        @change="
          page = 1;
          fetchEvents();
        "
      >
        <option value="">
          All Categories
        </option>
        <option
          v-for="category in categories"
          :key="category"
          :value="category"
        >
          {{ category }}
        </option>
      </select>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div v-else class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div v-if="events.length === 0" class="py-8 text-center col-span-full">
        <p class="text-gray-400">
          No events available at the moment.
        </p>
      </div>

      <div v-for="event in events" :key="event.id" class="card-event">
        <figure v-if="event.images?.[0]" class="relative h-48">
          <img
            :src="event.images[0]"
            :alt="event.title"
            class="object-cover w-full h-full"
          >
          <div class="absolute top-2 right-2">
            <span class="px-2 py-1 text-xs rounded-full badge-category">{{ event.category }}</span>
          </div>
        </figure>

        <div class="p-4">
          <h2 class="mb-4 text-lg md:text-xl">
            {{ event.title }}
          </h2>

          <div class="flex items-center gap-2 mb-2 text-xs md:text-sm text-white/60">
            <span class="text-base material-icons">schedule</span>
            {{ format(new Date(event.date), "PPP") }}
          </div>

          <div class="flex items-center gap-2 mb-4 text-xs md:text-sm text-white/60">
            <span class="text-base material-icons">location_on</span>
            {{ event.location }}
          </div>

          <div
            class="mb-4 prose-xs md:prose-sm prose prose-invert"
            v-html="md.render(event.description || '')"
          />

          <div class="flex flex-wrap items-center gap-2 text-xs md:text-sm text-white/60">
            <div class="flex items-center gap-2">
              <span class="text-base material-icons">person</span>
              <span>By {{ event.profiles?.full_name }}</span>
            </div>
            <div class="flex items-center gap-2 ml-0 md:ml-4">
              <span class="text-base material-icons">group</span>
              <span>{{
                event.max_attendees
                  ? `${event.max_attendees} spots`
                  : "Unlimited"
              }}</span>
            </div>
          </div>

          <div class="flex justify-end mt-4">
            <router-link
              :to="`/app/events/${event.id}`"
              class="px-4 py-1 text-sm md:px-6 md:py-2 md:text-base btn-primary"
            >
              View Details
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <div v-if="hasMore" class="flex justify-center mt-8">
      <button
        class="px-6 py-2 text-sm md:px-8 md:text-base btn-primary"
        :disabled="loading"
        @click="loadMore"
      >
        <span v-if="loading" class="loading loading-spinner" />
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
