<script setup lang="ts">
import type { Database } from '../types/supabase'
import MarkdownIt from 'markdown-it'
import { onMounted, ref } from 'vue'
import { supabase } from '../lib/supabase'

type Rental = Database['public']['Tables']['rentals']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']
const md = new MarkdownIt({
  breaks: true,
  linkify: true,
  typographer: true,
})
const rentals = ref<(Rental & { profiles: Profile })[]>([])
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
      query = query.eq(
        'type',
        selectedType.value as NonNullable<Rental['type']>,
      )
    }

    const { data, error } = await query

    if (error)
      throw error

    if (page.value === 1) {
      rentals.value = data as (Rental & { profiles: Profile })[]
    }
    else {
      rentals.value = [...rentals.value, ...data] as (Rental & {
        profiles: Profile
      })[]
    }

    hasMore.value = data.length === perPage
  }
  catch (error) {
    console.error('Error fetching rentals:', error)
  }
  finally {
    loading.value = false
  }
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
  <div class="container px-4 py-8 mx-auto">
    <h1 class="mb-4 text-3xl md:text-4xl">
      Rentals
    </h1>

    <div class="flex flex-wrap items-center justify-end gap-3 mb-8">
      <select
        v-model="selectedType"
        class="px-3 py-2 text-sm uppercase bg-black border-2 border-white"
        @change="
          page = 1;
          fetchRentals();
        "
      >
        <option value="">
          All Types
        </option>
        <option v-for="type in rentalTypes" :key="type" :value="type">
          {{ type }}
        </option>
      </select>
    </div>

    <div v-if="loading && page === 1" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div v-if="rentals.length === 0" class="py-8 text-center col-span-full">
        <p class="text-gray-400">
          No rentals available at the moment.
        </p>
      </div>

      <div v-for="rental in rentals" :key="rental.id" class="card-event">
        <figure v-if="rental.images?.[0]" class="relative h-48">
          <img
            :src="rental.images[0]"
            :alt="rental.title"
            class="object-cover w-full h-full"
          >
          <div class="absolute top-2 right-2">
            <span class="px-2 py-1 text-xs badge-category">{{ rental.type }}</span>
          </div>
        </figure>

        <div class="p-4">
          <h2 class="mb-4 text-lg md:text-xl">
            {{ rental.title }}
          </h2>

          <div class="flex items-center gap-2 mb-2 text-xs md:text-sm text-white/60">
            <span class="text-base material-icons">euro</span>
            {{ rental.price_per_day }} € per day
          </div>

          <div class="flex items-center gap-2 mb-4 text-xs md:text-sm text-white/60">
            <span class="text-base material-icons">location_on</span>
            {{ rental.location }}
          </div>

          <div
            class="mb-4 prose-xs md:prose-sm prose prose-invert"
            v-html="md.render(rental.description || '')"
          />

          <div class="flex flex-wrap items-center gap-2 text-xs md:text-sm text-white/60">
            <div class="flex items-center gap-2">
              <span class="text-base material-icons">person</span>
              <span>By {{ rental.profiles?.full_name }}</span>
            </div>
            <div class="flex items-center gap-2 ml-0 md:ml-4">
              <span class="text-base material-icons">schedule</span>
              <span>Min {{ rental.min_duration }} days</span>
            </div>
          </div>

          <div class="flex justify-end mt-4">
            <router-link
              :to="`/app/rentals/${rental.id}`"
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
