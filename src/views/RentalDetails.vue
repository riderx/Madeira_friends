<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import MarkdownIt from 'markdown-it'

const route = useRoute()
const router = useRouter()
const rental = ref(null)
const loading = ref(true)

// Enhanced markdown configuration
const md = new MarkdownIt({
  html: false, // Disable HTML for security
  breaks: true, // Convert \n to <br>
  linkify: true, // Auto-convert URLs to links
  typographer: true, // Enable smart quotes and other typographic replacements
})

function formatDescription(description) {
  if (!description) return ''
  
  // Replace multiple consecutive newlines with double breaks
  const formattedText = description
    .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines to at most 2
    .replace(/\n/g, '\n\n') // Ensure single newlines are treated as paragraphs
  
  return md.render(formattedText)
}

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
  <div class="container px-4 py-8 mx-auto">
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
    
    <div v-else-if="rental" class="max-w-4xl mx-auto">
      <!-- Image Gallery -->
      <div v-if="rental.images?.length" class="relative mb-8 h-96">
        <img 
          :src="rental.images[0]" 
          :alt="rental.title"
          class="object-cover w-full h-full"
        />
        <div class="absolute top-4 right-4">
          <span class="badge-category">{{ rental.type }}</span>
        </div>
      </div>
      
      <!-- Rental Details -->
      <div class="p-8 bg-black border-2 border-white">
        <h1 class="mb-6 text-4xl">{{ rental.title }}</h1>
        
        <div class="grid gap-8 mb-8 md:grid-cols-2">
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
        
        <!-- Description - Enhanced with better markdown rendering -->
        <div>
          <h2 class="text-2xl mb-4">Description</h2>
          <div 
            class="prose prose-invert prose-p:my-4 prose-headings:mt-6 prose-headings:mb-4 prose-ul:my-4 prose-li:my-1 max-w-none mb-8"
            v-html="formatDescription(rental.description)"
          ></div>
        </div>
        
        <!-- Cancellation Policy -->
        <div v-if="rental.cancellation_policy" class="mb-8">
          <h2 class="mb-4 text-2xl">Cancellation Policy</h2>
          <div 
            class="prose prose-invert prose-p:my-4 max-w-none" 
            v-html="formatDescription(rental.cancellation_policy)"
          ></div>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex justify-end mt-8">
          <button class="px-8 py-3 btn-primary">
            Book Now
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ensuring markdown lists display properly */
:deep(ul) {
  list-style-type: disc;
  padding-left: 1.5rem;
}

:deep(ol) {
  list-style-type: decimal;
  padding-left: 1.5rem;
}

:deep(p) {
  margin-bottom: 1rem;
}

:deep(blockquote) {
  border-left: 4px solid white;
  padding-left: 1rem;
  font-style: italic;
  margin: 1rem 0;
}

:deep(hr) {
  border: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  margin: 1.5rem 0;
}
</style>
