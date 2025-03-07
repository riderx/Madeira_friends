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
  description: null,
  id: '',
  images: [],
  is_paid: false,
  location: '',
  max_attendees: null,
  moderation_note: null,
  moderators: [] as string[] | null,
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
const ownershipFilter = ref('all') // 'all', 'owned' or 'managed'
const activeTab = ref('events') // 'events' or 'rentals'
const showCreateModal = ref(false)
const isEditing = ref(false)
const editId = ref('')
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

async function editEvent(event: Database['public']['Tables']['events']['Row']) {
  isEditing.value = true
  editId.value = event.id
  newEvent.value = { ...event }
  showCreateModal.value = true
}

async function createEvent() {
  try {
    saving.value = true
    error.value = ''

    const { id, ...itemData } = newEvent.value
    const tableName = activeTab.value === 'events' ? 'events' : 'rentals'

    if (isEditing.value) {
      // Update existing item
      const { error: updateError } = await supabase
        .from(tableName)
        .update(itemData)
        .eq('id', editId.value)

      if (updateError)
        throw updateError
    }
    else {
      // Create new item
      const { error: createError } = await supabase
        .from(tableName)
        .insert([
          {
            ...itemData,
            creator_id: authStore.user?.id,
            status: 'draft',
          },
        ])
        .select()
        .single()

      if (createError)
        throw createError
    }

    // Reset form and close modal
    newEvent.value = { ...INITIAL_EVENT }
    showCreateModal.value = false
    isEditing.value = false
    editId.value = ''

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

    // Prepare queries based on activeTab
    let query

    if (activeTab.value === 'events') {
      query = supabase
        .from('events')
        .select(`*, profiles!events_creator_id_fkey(*)`)
        .order('created_at', { ascending: false })

      // Apply ownership filter
      if (ownershipFilter.value === 'owned') {
        query = query.eq('creator_id', authStore.user?.id)
      }
      else if (ownershipFilter.value === 'managed') {
        query = query.contains('moderators', [authStore.user?.id])
      }
      else {
        // For 'all', get both owned and managed
        query = query.or(`creator_id.eq.${authStore.user?.id},moderators.cs.{${authStore.user?.id}}`)
      }

      const { data, error } = await query

      if (error)
        throw error

      events.value = data as Database['public']['Tables']['events']['Row'][]
    }
    else if (activeTab.value === 'rentals') {
      query = supabase
        .from('rentals')
        .select(`*, profiles!rentals_creator_id_fkey(*)`)
        .order('created_at', { ascending: false })

      // Apply ownership filter
      if (ownershipFilter.value === 'owned') {
        query = query.eq('creator_id', authStore.user?.id)
      }
      else if (ownershipFilter.value === 'managed') {
        query = query.contains('moderators', [authStore.user?.id])
      }
      else {
        // For 'all', get both owned and managed
        query = query.or(`creator_id.eq.${authStore.user?.id},moderators.cs.{${authStore.user?.id}}`)
      }

      const { data, error } = await query

      if (error)
        throw error

      rentals.value = data as Database['public']['Tables']['rentals']['Row'][]
    }
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
  if (!authStore.user?.id)
    return

  try {
    // First get the current moderators array
    const { data, error: fetchError } = await supabase
      .from(type === 'event' ? 'events' : 'rentals')
      .select('moderators')
      .eq('id', id)
      .single()

    if (fetchError)
      throw fetchError

    // Remove current user from moderators array
    const moderators = (data.moderators || []).filter(
      (modId: string) => modId !== authStore.user?.id,
    )

    // Update with new moderators array
    const { error } = await supabase
      .from(type === 'event' ? 'events' : 'rentals')
      .update({ moderators })
      .eq('id', id)

    if (error)
      throw error
    await fetchListings()
  }
  catch (error) {
    console.error('Error removing moderator:', error)
  }
}

// Add editRental function
async function editRental(rental: Database['public']['Tables']['rentals']['Row']) {
  isEditing.value = true
  editId.value = rental.id
  // Type assertion to avoid type errors - we're only using this to populate the form
  newEvent.value = rental as any
  activeTab.value = 'rentals'
  showCreateModal.value = true
}
</script>

<template>
  <div class="container px-4 py-8 mx-auto">
    <h1 class="mb-4 text-3xl md:text-4xl">
      My Listings
    </h1>

    <div class="flex flex-wrap items-center justify-end gap-3 mb-8">
      <select
        v-model="ownershipFilter"
        class="px-3 py-2 text-sm uppercase bg-black border-2 border-white"
        @change="fetchListings()"
      >
        <option value="all">
          All Ownership
        </option>
        <option value="owned">
          Owned
        </option>
        <option value="managed">
          Managed
        </option>
      </select>

      <div class="flex border-2 border-white">
        <button
          v-for="tab in ['events', 'rentals']"
          :key="tab"
          class="px-3 py-2 text-sm"
          :class="activeTab === tab ? 'bg-white text-black' : ''"
          @click="
            activeTab = tab;
            fetchListings();
          "
        >
          {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
        </button>
      </div>

      <button
        class="px-4 py-2 text-sm btn-primary"
        @click="showCreateModal = true"
      >
        Create
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div v-else>
      <!-- Events section -->
      <div v-if="activeTab === 'events'" class="space-y-6">
        <div v-if="events.length === 0" class="py-8 text-center">
          <p class="text-white/60">
            No events created yet.
          </p>
        </div>
        <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="event in events"
            :key="event.id"
            class="p-4 border-2 border-white md:p-6"
          >
            <div class="flex items-start justify-between mb-4">
              <h3 class="text-lg md:text-xl">
                {{ event.title }}
              </h3>
              <span class="px-2 py-1 ml-2 text-xs badge-category">{{ event.status }}</span>
            </div>

            <div class="mb-4 space-y-2">
              <p class="text-sm md:text-base">
                {{ format(new Date(event.date), "PPP p") }}
              </p>
              <p class="text-sm md:text-base">
                {{ event.location }}
              </p>
            </div>

            <div class="flex flex-wrap gap-2">
              <router-link
                :to="`/app/events/${event.id}`"
                class="px-3 py-1 text-sm md:px-4 md:py-2 md:text-base btn-primary"
              >
                View
              </router-link>

              <button
                v-if="event.status === 'draft' && event.creator_id === authStore.user?.id"
                class="px-3 py-1 text-sm md:px-4 md:py-2 md:text-base btn-secondary"
                @click="editEvent(event)"
              >
                Edit
              </button>

              <button
                v-if="event.creator_id === authStore.user?.id"
                class="px-3 py-1 text-sm md:px-4 md:py-2 md:text-base btn-secondary"
                @click="deleteListing('event', event.id)"
              >
                Delete
              </button>

              <button
                v-if="event.creator_id !== authStore.user?.id && event.moderators && event.moderators.includes(authStore.user?.id || '')"
                class="px-3 py-1 text-sm md:px-4 md:py-2 md:text-base btn-secondary"
                @click="stopManaging('event', event.id)"
              >
                Stop Managing
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Rentals section -->
      <div v-else-if="activeTab === 'rentals'" class="space-y-6">
        <div v-if="rentals.length === 0" class="py-8 text-center">
          <p class="text-white/60">
            No rentals created yet.
          </p>
        </div>
        <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="rental in rentals"
            :key="rental.id"
            class="p-4 border-2 border-white md:p-6"
          >
            <div class="flex items-start justify-between mb-4">
              <h3 class="text-lg md:text-xl">
                {{ rental.title }}
              </h3>
              <span class="px-2 py-1 ml-2 text-xs rounded-full badge-category">{{ rental.status }}</span>
            </div>

            <div class="mb-4 space-y-2">
              <p class="text-sm md:text-base">
                {{ rental.price_per_day }}€ per day
              </p>
              <p class="text-sm md:text-base">
                {{ rental.location }}
              </p>
            </div>

            <div class="flex flex-wrap gap-2">
              <router-link
                :to="`/app/rentals/${rental.id}`"
                class="px-3 py-1 text-sm md:px-4 md:py-2 md:text-base btn-primary"
              >
                View
              </router-link>

              <button
                v-if="rental.status === 'draft' && rental.creator_id === authStore.user?.id"
                class="px-3 py-1 text-sm md:px-4 md:py-2 md:text-base btn-secondary"
                @click="editRental(rental)"
              >
                Edit
              </button>

              <button
                v-if="rental.creator_id === authStore.user?.id"
                class="px-3 py-1 text-sm md:px-4 md:py-2 md:text-base btn-secondary"
                @click="deleteListing('rental', rental.id)"
              >
                Delete
              </button>

              <button
                v-if="rental.creator_id !== authStore.user?.id && rental.moderators && rental.moderators.includes(authStore.user?.id || '')"
                class="px-3 py-1 text-sm md:px-4 md:py-2 md:text-base btn-secondary"
                @click="stopManaging('rental', rental.id)"
              >
                Stop Managing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Event Modal -->
    <dialog :open="showCreateModal" class="modal modal-bottom sm:modal-middle">
      <div class="w-full max-w-2xl p-8 mx-auto overflow-y-auto max-h-[90vh] bg-black border-2 border-white">
        <h2 class="mb-6 text-2xl">
          {{ isEditing ? 'Edit' : 'Create New' }} {{ activeTab === "rentals" ? "Rental" : "Event" }}
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
              <span v-else>{{ isEditing ? 'Save Changes' : 'Create' }} {{ activeTab === "rentals" ? "Rental" : "Event" }}</span>
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

.modal {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

@media (max-height: 700px) {
  .modal > div {
    margin: 1rem 0;
    max-height: calc(100vh - 2rem);
  }
}
</style>
