<script setup lang="ts">
import type { Database } from '../../types/supabase'
import { format } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'
import { onMounted, ref } from 'vue'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../stores/auth'

const INITIAL_EVENT = {
  cancellation_policy: null,
  category: '',
  created_at: null,
  creator_id: null,
  date: '',
  deleted_at: null,
  description: '',
  id: '',
  images: [],
  is_paid: false,
  location: '',
  max_attendees: null,
  moderation_note: null,
  moderator_id: null,
  payment_link: null,
  rsvp_deadline: null,
  status: null,
  telegram_contact: '',
  title: '',
  updated_at: null,
}

const authStore = useAuthStore()
const loading = ref(false)
const events = ref<Database['public']['Tables']['events']['Row'][]>([])
const rentals = ref<Database['public']['Tables']['rentals']['Row'][]>([])
const activeFilter = ref('owned') // 'owned' or 'managed'
const activeTab = ref('events')
const showCreateModal = ref(false)
const newEvent = ref<Database['public']['Tables']['events']['Row']>({
  ...INITIAL_EVENT,
})
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

      if (uploadError)
        throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('images').getPublicUrl(filePath)

      return publicUrl
    })

    const uploadedUrls = await Promise.all(uploadPromises)
    newEvent.value.images = [...(newEvent.value.images || []), ...uploadedUrls]
  }
  catch (e) {
    error.value = (e as Error).message
  }
  finally {
    uploading.value = false
  }
}

function removeImage(index: number) {
  newEvent.value.images
    = newEvent.value.images?.filter((_, i) => i !== index) ?? []
}

async function createEvent() {
  try {
    saving.value = true
    error.value = ''

    const { error: createError } = await supabase
      .from('events')
      .insert([
        {
          ...newEvent.value,
          creator_id: authStore.user?.id,
        },
      ])
      .select()
      .single()

    if (createError)
      throw createError

    // Reset form and close modal
    newEvent.value = { ...INITIAL_EVENT }
    showCreateModal.value = false

    // Refresh listings
    await fetchListings()
  }
  catch (e) {
    error.value = (e as Error).message
  }
  finally {
    saving.value = false
  }
}

async function fetchListings() {
  if (!authStore.user)
    return
  try {
    loading.value = true
    const [eventsResponse, rentalsResponse] = await Promise.all([
      supabase
        .from('events')
        .select(`*, profiles!events_creator_id_fkey(*)`)
        .eq(
          activeFilter.value === 'owned' ? 'creator_id' : 'moderator_id',
          authStore.user?.id,
        )
        .order('created_at', { ascending: false }),
      supabase
        .from('rentals')
        .select(`*, profiles!rentals_creator_id_fkey(*)`)
        .eq(
          activeFilter.value === 'owned' ? 'creator_id' : 'moderator_id',
          authStore.user?.id,
        )
        .order('created_at', { ascending: false }),
    ])

    if (eventsResponse.error)
      throw eventsResponse.error
    if (rentalsResponse.error)
      throw rentalsResponse.error

    events.value = eventsResponse.data
    rentals.value = rentalsResponse.data
  }
  catch (error) {
    console.error('Error fetching listings:', error)
  }
  finally {
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

    if (error)
      throw error
    await fetchListings()
  }
  catch (error) {
    console.error('Error deleting listing:', error)
  }
}

async function stopManaging(type: 'event' | 'rental', id: string) {
  try {
    const { error } = await supabase
      .from(type === 'event' ? 'events' : 'rentals')
      .update({ moderator_id: null })
      .eq('id', id)

    if (error)
      throw error
    await fetchListings()
  }
  catch (error) {
    console.error('Error removing moderator:', error)
  }
}
</script>

<template>
  <div class="container px-4 py-8 mx-auto">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-4xl">
        My Listings
      </h1>

      <div class="flex gap-4">
        <div class="flex border-2 border-white">
          <button
            v-for="filter in ['owned', 'managed']"
            :key="filter"
            class="px-4 py-2"
            :class="activeFilter === filter ? 'bg-white text-black' : ''"
            @click="
              activeFilter = filter;
              fetchListings();
            "
          >
            {{ filter.charAt(0).toUpperCase() + filter.slice(1) }}
          </button>
        </div>

        <button
          v-if="activeFilter === 'owned'"
          class="px-6 py-2 btn-primary"
          @click="showCreateModal = true"
        >
          Create {{ activeTab === "events" ? "Event" : "Rental" }}
        </button>
      </div>
    </div>

    <div class="flex gap-4 mb-8">
      <button
        class="flex-1 py-2 border-2"
        :class="
          activeTab === 'events'
            ? 'bg-white text-black'
            : 'border-white text-white'
        "
        @click="activeTab = 'events'"
      >
        Events
      </button>
      <button
        class="flex-1 py-2 border-2"
        :class="
          activeTab === 'rentals'
            ? 'bg-white text-black'
            : 'border-white text-white'
        "
        @click="activeTab = 'rentals'"
      >
        Rentals
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div v-else-if="activeTab === 'events'" class="space-y-6">
      <div v-if="events.length === 0" class="py-8 text-center">
        <p class="text-white/60">
          No events created yet.
        </p>
      </div>
      <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="event in events"
          :key="event.id"
          class="p-6 border-2 border-white"
        >
          <div class="flex items-start justify-between mb-4">
            <h3 class="text-xl">
              {{ event.title }}
            </h3>
            <span class="badge-category">{{ event.status }}</span>
          </div>

          <div class="mb-4 space-y-2">
            <p>{{ format(new Date(event.date), "PPP p") }}</p>
            <p>{{ event.location }}</p>
          </div>

          <div class="flex gap-4">
            <router-link
              :to="`/events/${event.id}`"
              class="px-4 py-2 btn-primary"
            >
              View
            </router-link>

            <button
              v-if="activeFilter === 'owned'"
              class="px-4 py-2 btn-secondary"
              @click="deleteListing('event', event.id)"
            >
              Delete
            </button>

            <button
              v-if="activeFilter === 'managed'"
              class="px-4 py-2 btn-secondary"
              @click="stopManaging('event', event.id)"
            >
              Stop Managing
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="space-y-6">
      <div v-if="rentals.length === 0" class="py-8 text-center">
        <p class="text-white/60">
          No rentals created yet.
        </p>
      </div>
      <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="rental in rentals"
          :key="rental.id"
          class="p-6 border-2 border-white"
        >
          <div class="flex items-start justify-between mb-4">
            <h3 class="text-xl">
              {{ rental.title }}
            </h3>
            <span class="badge-category">{{ rental.status }}</span>
          </div>

          <div class="mb-4 space-y-2">
            <p>{{ rental.price_per_day }}€ per day</p>
            <p>{{ rental.location }}</p>
          </div>

          <div class="flex gap-4">
            <router-link
              :to="`/rentals/${rental.id}`"
              class="px-4 py-2 btn-primary"
            >
              View
            </router-link>

            <button
              v-if="activeFilter === 'owned'"
              class="px-4 py-2 btn-secondary"
              @click="deleteListing('rental', rental.id)"
            >
              Delete
            </button>

            <button
              v-if="activeFilter === 'managed'"
              class="px-4 py-2 btn-secondary"
              @click="stopManaging('rental', rental.id)"
            >
              Stop Managing
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Event Modal -->
    <dialog :open="showCreateModal" class="modal modal-bottom sm:modal-middle">
      <div class="w-full max-w-2xl p-8 mx-auto bg-black border-2 border-white">
        <h2 class="mb-6 text-2xl">
          Create New Event
        </h2>

        <form class="space-y-6" @submit.prevent="createEvent">
          <div>
            <label class="block mb-2 text-sm font-bold uppercase">Title</label>
            <input
              v-model="newEvent.title"
              type="text"
              required
              class="w-full px-3 py-2 input-primary"
            >
          </div>

          <div>
            <label class="block mb-2 text-sm font-bold uppercase">Category</label>
            <select
              v-model="newEvent.category"
              required
              class="w-full px-3 py-2 input-primary"
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
            <label class="block mb-2 text-sm font-bold uppercase">Date & Time</label>
            <input
              v-model="newEvent.date"
              type="datetime-local"
              required
              class="w-full px-3 py-2 input-primary"
            >
          </div>

          <div>
            <label class="block mb-2 text-sm font-bold uppercase">Location</label>
            <input
              v-model="newEvent.location"
              type="text"
              required
              class="w-full px-3 py-2 input-primary"
            >
          </div>

          <div>
            <label class="block mb-2 text-sm font-bold uppercase">Max Attendees</label>
            <input
              v-model="newEvent.max_attendees"
              type="number"
              min="1"
              class="w-full px-3 py-2 input-primary"
            >
          </div>

          <div>
            <label class="block mb-2 text-sm font-bold uppercase">Telegram Contact</label>
            <input
              v-model="newEvent.telegram_contact"
              type="text"
              required
              placeholder="@username"
              class="w-full px-3 py-2 input-primary"
            >
          </div>

          <div>
            <label class="block mb-2 text-sm font-bold uppercase">Description</label>
            <textarea
              v-model="newEvent.description"
              rows="4"
              class="w-full px-3 py-2 input-primary"
            />
          </div>

          <!-- Image Upload -->
          <div>
            <label class="block mb-2 text-sm font-bold uppercase">Images</label>
            <div class="space-y-4">
              <!-- Image Preview -->
              <div
                v-if="newEvent.images?.length"
                class="grid grid-cols-2 gap-4 md:grid-cols-3"
              >
                <div
                  v-for="(image, index) in newEvent.images"
                  :key="index"
                  class="relative aspect-video"
                >
                  <img :src="image" class="object-cover w-full h-full">
                  <button
                    class="absolute p-1 rounded-full top-2 right-2 bg-black/50 hover:bg-black"
                    @click="removeImage(index)"
                  >
                    <i class="fas fa-times" />
                  </button>
                </div>
              </div>

              <!-- Upload Button -->
              <label
                class="block w-full p-4 text-center transition-colors border-2 border-white border-dashed cursor-pointer hover:bg-white hover:text-black"
                :class="{ 'opacity-50 cursor-not-allowed': uploading }"
              >
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  class="hidden"
                  :disabled="uploading"
                  @change="
                    (e) =>
                      uploadImages(
                        (e.target as HTMLInputElement).files as FileList,
                      )
                  "
                >
                <div class="space-y-2">
                  <i class="text-2xl fas fa-cloud-upload-alt" />
                  <p>
                    {{ uploading ? "Uploading..." : "Click to upload images" }}
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div v-if="error" class="text-sm font-bold text-red-500">
            {{ error }}
          </div>

          <div class="flex gap-4">
            <button
              type="button"
              class="flex-1 py-3 btn-secondary"
              @click="showCreateModal = false"
            >
              Cancel
            </button>

            <button
              type="submit"
              class="flex-1 py-3 btn-primary"
              :disabled="saving"
            >
              <span v-if="saving" class="loading loading-spinner" />
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
