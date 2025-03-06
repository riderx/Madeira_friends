<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { v4 as uuidv4 } from 'uuid'

const INITIAL_EVENT = {
  title: '',
  description: '',
  category: 'Party',
  date: '',
  location: '',
  max_attendees: null,
  telegram_contact: '',
  status: 'draft',
  images: []
}

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const events = ref([])
const rentals = ref([])
const activeFilter = ref('owned') // 'owned' or 'managed'
const activeTab = ref('events')
const showCreateModal = ref(false)
const newEvent = ref({ ...INITIAL_EVENT })
const saving = ref(false)
const error = ref('')
const uploading = ref(false)

async function uploadImages(files: FileList) {
  try {
    uploading.value = true
    error.value = ''
    
    const uploadPromises = Array.from(files).map(async (file) => {
      const fileExt = file.name.split('.').pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `${authStore.user?.id}/events/${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file)
      
      if (uploadError) throw uploadError
      
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath)
      
      return publicUrl
    })
    
    const uploadedUrls = await Promise.all(uploadPromises)
    newEvent.value.images = [...(newEvent.value.images || []), ...uploadedUrls]
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    uploading.value = false
  }
}

function removeImage(index: number) {
  newEvent.value.images = newEvent.value.images.filter((_, i) => i !== index)
}

async function createEvent() {
  try {
    saving.value = true
    error.value = ''
    
    const { data, error: createError } = await supabase
      .from('events')
      .insert([{
        ...newEvent.value,
        creator_id: authStore.user?.id
      }])
      .select()
      .single()

    if (createError) throw createError

    // Reset form and close modal
    newEvent.value = { ...INITIAL_EVENT }
    showCreateModal.value = false
    
    // Refresh listings
    await fetchListings()
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    saving.value = false
  }
}

async function fetchListings() {
  try {
    loading.value = true
    const [eventsResponse, rentalsResponse] = await Promise.all([
      supabase
        .from('events')
        .select(`*, profiles!events_creator_id_fkey(*)`)
        .eq(activeFilter.value === 'owned' ? 'creator_id' : 'moderator_id', authStore.user?.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('rentals')
        .select(`*, profiles!rentals_creator_id_fkey(*)`)
        .eq(activeFilter.value === 'owned' ? 'creator_id' : 'moderator_id', authStore.user?.id)
        .order('created_at', { ascending: false })
    ])

    if (eventsResponse.error) throw eventsResponse.error
    if (rentalsResponse.error) throw rentalsResponse.error

    events.value = eventsResponse.data
    rentals.value = rentalsResponse.data
  } catch (error) {
    console.error('Error fetching listings:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchListings()
})

async function deleteListing(type: 'event' | 'rental', id: string) {
  try {
    const { error } = await supabase
      .from(type === 'event' ? 'events' : 'rentals')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    await fetchListings()
  } catch (error) {
    console.error('Error deleting listing:', error)
  }
}

async function stopManaging(type: 'event' | 'rental', id: string) {
  try {
    const { error } = await supabase
      .from(type === 'event' ? 'events' : 'rentals')
      .update({ moderator_id: null })
      .eq('id', id)

    if (error) throw error
    await fetchListings()
  } catch (error) {
    console.error('Error removing moderator:', error)
  }
}
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-4xl">My Listings</h1>
      
      <div class="flex gap-4">
        <div class="flex border-2 border-white">
          <button 
            v-for="filter in ['owned', 'managed']"
            :key="filter"
            class="px-4 py-2"
            :class="activeFilter === filter ? 'bg-white text-black' : ''"
            @click="activeFilter = filter; fetchListings()"
          >
            {{ filter.charAt(0).toUpperCase() + filter.slice(1) }}
          </button>
        </div>
        
        <button 
          v-if="activeFilter === 'owned'"
          @click="showCreateModal = true" 
          class="btn-primary px-6 py-2"
        >
          Create {{ activeTab === 'events' ? 'Event' : 'Rental' }}
        </button>
      </div>
    </div>
    
    <div class="flex gap-4 mb-8">
      <button 
        class="flex-1 py-2 border-2"
        :class="activeTab === 'events' ? 'bg-white text-black' : 'border-white text-white'"
        @click="activeTab = 'events'"
      >
        Events
      </button>
      <button 
        class="flex-1 py-2 border-2"
        :class="activeTab === 'rentals' ? 'bg-white text-black' : 'border-white text-white'"
        @click="activeTab = 'rentals'"
      >
        Rentals
      </button>
    </div>
    
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
    
    <div v-else-if="activeTab === 'events'" class="space-y-6">
      <div v-if="events.length === 0" class="text-center py-8">
        <p class="text-white/60">No events created yet.</p>
      </div>
      <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div 
          v-for="event in events" 
          :key="event.id"
          class="border-2 border-white p-6"
        >
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-xl">{{ event.title }}</h3>
            <span class="badge-category">{{ event.status }}</span>
          </div>
          
          <div class="space-y-2 mb-4">
            <p>{{ format(new Date(event.date), 'PPP p') }}</p>
            <p>{{ event.location }}</p>
          </div>
          
          <div class="flex gap-4">
            <router-link 
              :to="`/events/${event.id}`"
              class="btn-primary px-4 py-2"
            >
              View
            </router-link>
            
            <button 
              v-if="activeFilter === 'owned'"
              @click="deleteListing('event', event.id)"
              class="btn-secondary px-4 py-2"
            >
              Delete
            </button>
            
            <button 
              v-if="activeFilter === 'managed'"
              @click="stopManaging('event', event.id)"
              class="btn-secondary px-4 py-2"
            >
              Stop Managing
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="space-y-6">
      <div v-if="rentals.length === 0" class="text-center py-8">
        <p class="text-white/60">No rentals created yet.</p>
      </div>
      <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div 
          v-for="rental in rentals" 
          :key="rental.id"
          class="border-2 border-white p-6"
        >
          <div class="flex justify-between items-start mb-4">
            <h3 class="text-xl">{{ rental.title }}</h3>
            <span class="badge-category">{{ rental.status }}</span>
          </div>
          
          <div class="space-y-2 mb-4">
            <p>{{ rental.price_per_day }}€ per day</p>
            <p>{{ rental.location }}</p>
          </div>
          
          <div class="flex gap-4">
            <router-link 
              :to="`/rentals/${rental.id}`"
              class="btn-primary px-4 py-2"
            >
              View
            </router-link>
            
            <button 
              v-if="activeFilter === 'owned'"
              @click="deleteListing('rental', rental.id)"
              class="btn-secondary px-4 py-2"
            >
              Delete
            </button>
            
            <button 
              v-if="activeFilter === 'managed'"
              @click="stopManaging('rental', rental.id)"
              class="btn-secondary px-4 py-2"
            >
              Stop Managing
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Create Event Modal -->
    <dialog :open="showCreateModal" class="modal modal-bottom sm:modal-middle">
      <div class="bg-black border-2 border-white p-8 w-full max-w-2xl mx-auto">
        <h2 class="text-2xl mb-6">Create New Event</h2>
        
        <form @submit.prevent="createEvent" class="space-y-6">
          <div>
            <label class="block text-sm uppercase font-bold mb-2">Title</label>
            <input
              v-model="newEvent.title"
              type="text"
              required
              class="input-primary w-full px-3 py-2"
            />
          </div>
          
          <div>
            <label class="block text-sm uppercase font-bold mb-2">Category</label>
            <select
              v-model="newEvent.category"
              required
              class="input-primary w-full px-3 py-2"
            >
              <option>Party</option>
              <option>Sports</option>
              <option>Culture</option>
              <option>Food</option>
              <option>Hiking</option>
              <option>Other</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm uppercase font-bold mb-2">Date & Time</label>
            <input
              v-model="newEvent.date"
              type="datetime-local"
              required
              class="input-primary w-full px-3 py-2"
            />
          </div>
          
          <div>
            <label class="block text-sm uppercase font-bold mb-2">Location</label>
            <input
              v-model="newEvent.location"
              type="text"
              required
              class="input-primary w-full px-3 py-2"
            />
          </div>
          
          <div>
            <label class="block text-sm uppercase font-bold mb-2">Max Attendees</label>
            <input
              v-model="newEvent.max_attendees"
              type="number"
              min="1"
              class="input-primary w-full px-3 py-2"
            />
          </div>
          
          <div>
            <label class="block text-sm uppercase font-bold mb-2">Telegram Contact</label>
            <input
              v-model="newEvent.telegram_contact"
              type="text"
              required
              placeholder="@username"
              class="input-primary w-full px-3 py-2"
            />
          </div>
          
          <div>
            <label class="block text-sm uppercase font-bold mb-2">Description</label>
            <textarea
              v-model="newEvent.description"
              rows="4"
              class="input-primary w-full px-3 py-2"
            ></textarea>
          </div>
          
          <!-- Image Upload -->
          <div>
            <label class="block text-sm uppercase font-bold mb-2">Images</label>
            <div class="space-y-4">
              <!-- Image Preview -->
              <div v-if="newEvent.images?.length" class="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div 
                  v-for="(image, index) in newEvent.images" 
                  :key="index"
                  class="relative aspect-video"
                >
                  <img 
                    :src="image" 
                    class="w-full h-full object-cover"
                  />
                  <button
                    @click="removeImage(index)"
                    class="absolute top-2 right-2 bg-black/50 p-1 rounded-full hover:bg-black"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              </div>
              
              <!-- Upload Button -->
              <label 
                class="block w-full border-2 border-dashed border-white p-4 text-center cursor-pointer hover:bg-white hover:text-black transition-colors"
                :class="{ 'opacity-50 cursor-not-allowed': uploading }"
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  class="hidden"
                  @change="e => uploadImages(e.target.files)"
                  :disabled="uploading"
                />
                <div class="space-y-2">
                  <i class="fas fa-cloud-upload-alt text-2xl"></i>
                  <p>{{ uploading ? 'Uploading...' : 'Click to upload images' }}</p>
                </div>
              </label>
            </div>
          </div>
          
          <div v-if="error" class="text-red-500 text-sm font-bold">
            {{ error }}
          </div>
          
          <div class="flex gap-4">
            <button
              type="button"
              @click="showCreateModal = false"
              class="btn-secondary flex-1 py-3"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              class="btn-primary flex-1 py-3"
              :disabled="saving"
            >
              <span v-if="saving" class="loading loading-spinner"></span>
              <span v-else>Create Event</span>
            </button>
          </div>
        </form>
      </div>
    </dialog>
  </div>
</template>

<style scoped>
button {
  transition: all 0.2s;
}
</style>