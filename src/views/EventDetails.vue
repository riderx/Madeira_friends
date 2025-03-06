<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import MarkdownIt from 'markdown-it'

const route = useRoute()
const router = useRouter()
const event = ref(null)
const attendees = ref([])
const loading = ref(true)
const md = new MarkdownIt({
  breaks: true,
  linkify: true,
  typographer: true
})

async function fetchEvent() {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        profiles!events_creator_id_fkey(
          id,
          full_name,
          avatar_url,
          telegram_username
        )
      `)
      .eq('id', route.params.id)
      .single()

    if (error) throw error
    event.value = data
  } catch (error) {
    console.error('Error fetching event:', error)
    router.push('/')
  }
}

async function fetchAttendees() {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        profiles:user_id(
          id,
          full_name,
          avatar_url,
          telegram_username
        )
      `)
      .eq('event_id', route.params.id)
      .eq('status', 'approved')

    if (error) throw error
    attendees.value = data
  } catch (error) {
    console.error('Error fetching attendees:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchEvent()
  fetchAttendees()
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
    
    <div v-else-if="event" class="max-w-4xl mx-auto">
      <!-- Image Gallery -->
      <div v-if="event.images?.length" class="relative h-96 mb-8">
        <img 
          :src="event.images[0]" 
          :alt="event.title"
          class="w-full h-full object-cover"
        />
        <div class="absolute top-4 right-4">
          <span class="badge-category">{{ event.category }}</span>
        </div>
      </div>
      
      <!-- Event Details -->
      <div class="bg-black border-2 border-white p-8">
        <h1 class="text-4xl mb-6">{{ event.title }}</h1>
        
        <div class="grid md:grid-cols-2 gap-8 mb-8">
          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <span class="material-icons">schedule</span>
              <span>{{ format(new Date(event.date), 'PPP p') }}</span>
            </div>
            
            <div class="flex items-center gap-2">
              <span class="material-icons">location_on</span>
              <span>{{ event.location }}</span>
            </div>
            
            <div class="flex items-center gap-2">
              <span class="material-icons">group</span>
              <span>
                {{ attendees.length }} attending
                {{ event.max_attendees ? `(${event.max_attendees - attendees.length} spots left)` : '' }}
              </span>
            </div>
          </div>
          
          <div class="space-y-4">
            <div v-if="event.is_paid" class="flex items-center gap-2">
              <span class="material-icons">euro</span>
              <span>Paid Event</span>
            </div>
            
            <div class="flex items-center gap-2">
              <span class="material-icons">person</span>
              <span>Organized by {{ event.profiles.full_name }}</span>
            </div>
            
            <div class="flex items-center gap-2">
              <span class="material-icons">telegram</span>
              <a 
                :href="`https://t.me/${event.telegram_contact.replace('@', '')}`"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-white/80"
              >
                {{ event.telegram_contact }}
              </a>
            </div>
          </div>
        </div>
        
        <!-- Description -->
        <div class="prose prose-invert mb-8" v-html="md.render(event.description || '')"></div>
        
        <!-- Attendees -->
        <div class="space-y-4">
          <h2 class="text-2xl">Attendees</h2>
          
          <div v-if="attendees.length === 0" class="text-white/60">
            No attendees yet. Be the first to join!
          </div>
          
          <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <router-link
              v-for="booking in attendees"
              :key="booking.id"
              :to="'/profile/' + booking.profiles.id"
              class="flex flex-col items-center p-4 border-2 border-white hover:bg-white hover:text-black transition-colors"
            >
              <img
                :src="booking.profiles.avatar_url || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'"
                :alt="booking.profiles.full_name"
                class="w-16 h-16 rounded-full object-cover mb-2"
              />
              <span class="text-sm text-center">{{ booking.profiles.full_name }}</span>
            </router-link>
          </div>
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