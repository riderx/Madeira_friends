<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import MarkdownIt from 'markdown-it'

const route = useRoute()
const router = useRouter()
const rental = ref(null)
const loading = ref(true)
const md = new MarkdownIt({
  breaks: true,
  linkify: true,
  typographer: true
})

async function fetchRental() {
  try {
    const { data, error } = await supabase
      .from('rentals')
      .select(`
        *,
        profiles!rentals_creator_id_fkey(
          id,
          full_name,
          avatar_url,
          telegram_username
        )
      `)
      .eq('id', route.params.id)
      .single()

    if (error) throw error
    rental.value = data
  } catch (error) {
    console.error('Error fetching rental:', error)
    router.push('/rentals')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchRental()
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
    
    <div v-else-if="rental" class="max-w-4xl mx-auto">
      <!-- Image Gallery -->
      <div v-if="rental.images?.length" class="relative h-96 mb-8">
        <img 
          :src="rental.images[0]" 
          :alt="rental.title"
          class="w-full h-full object-cover"
        />
        <div class="absolute top-4 right-4">
          <span class="badge-category">{{ rental.type }}</span>
        </div>
      </div>
      
      <!-- Rental Details -->
      <div class="bg-black border-2 border-white p-8">
        <h1 class="text-4xl mb-6">{{ rental.title }}</h1>
        
        <div class="grid md:grid-cols-2 gap-8 mb-8">
          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <span class="material-icons">euro</span>
              <span>{{ rental.price_per_day }}€ per day</span>
            </div>
            
            <div class="flex items-center gap-2">
              <span class="material-icons">location_on</span>
              <span>{{ rental.location }}</span>
            </div>
            
            <div class="flex items-center gap-2">
              <span class="material-icons">schedule</span>
              <span>
                Min: {{ rental.min_duration }} days
                {{ rental.max_duration ? ` / Max: ${rental.max_duration} days` : '' }}
              </span>
            </div>
          </div>
          
          <div class="space-y-4">
            <div v-if="rental.security_deposit" class="flex items-center gap-2">
              <span class="material-icons">security</span>
              <span>{{ rental.security_deposit }}€ security deposit</span>
            </div>
            
            <div class="flex items-center gap-2">
              <span class="material-icons">person</span>
              <span>Listed by {{ rental.profiles.full_name }}</span>
            </div>
            
            <div class="flex items-center gap-2">
              <span class="material-icons">telegram</span>
              <a 
                :href="`https://t.me/${rental.telegram_contact.replace('@', '')}`"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-white/80"
              >
                {{ rental.telegram_contact }}
              </a>
            </div>
          </div>
        </div>
        
        <!-- Description -->
        <div class="prose prose-invert mb-8" v-html="md.render(rental.description || '')"></div>
        
        <!-- Cancellation Policy -->
        <div v-if="rental.cancellation_policy" class="mb-8">
          <h2 class="text-2xl mb-4">Cancellation Policy</h2>
          <div class="prose prose-invert" v-html="md.render(rental.cancellation_policy)"></div>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex justify-end mt-8">
          <button class="btn-primary px-8 py-3">
            Book Now
          </button>
        </div>
      </div>
    </div>
  </div>
</template>