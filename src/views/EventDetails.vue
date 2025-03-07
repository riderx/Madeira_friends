<script setup lang="ts">
import type { Database } from '../types/supabase'
import { format } from 'date-fns'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import { createMarkdownRenderer } from '../utils/markdown'

type Event = Database['public']['Tables']['events']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']
type Booking = Database['public']['Tables']['bookings']['Row']

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const event = ref<(Event & { profiles: Profile }) | null>(null)
const attendees = ref<(Booking & { profiles: Profile })[]>([])
const loading = ref(true)
const bookingStatus = ref<string | null>(null)
const isSubmitting = ref(false)
const showBookingForm = ref(false)
const bookingMessage = ref('')
const bookingSuccess = ref(false)
const bookingError = ref('')
const numberOfAttendees = ref(1)

// Check if the event is in draft mode
const isDraft = computed(() => {
  return event.value?.status === 'draft'
})

// Enhanced markdown configuration
const md = createMarkdownRenderer()

// Check if user has already booked
const hasUserBooked = computed(() => {
  return bookingStatus.value !== null
})

// Check if spots are available
const spotsAvailable = computed(() => {
  if (!event.value || !event.value.max_attendees)
    return true
  return attendees.value.length < event.value.max_attendees
})

function formatDescription(description: string | null) {
  if (!description)
    return ''

  // Replace multiple consecutive newlines with double breaks
  const formattedText = description
    .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines to at most 2
    .replace(/\n/g, '\n\n') // Ensure single newlines are treated as paragraphs

  return md.render(formattedText)
}

async function fetchEvent() {
  if (!route.params.id) {
    router.push('/app/events')
    return
  }
  try {
    const { data, error } = await supabase
      .from('events')
      .select(
        `
        *,
        profiles!events_creator_id_fkey(
          id,
          full_name,
          avatar_url,
          telegram_username
        )
      `,
      )
      .eq('id', route.params.id as string)
      .single()

    if (error)
      throw error
    event.value = data as Event & { profiles: Profile }
  }
  catch (error) {
    console.error('Error fetching event:', error)
    router.push('/app/events')
  }
}

async function fetchAttendees() {
  if (!route.params.id) {
    router.push('/app/events')
    return
  }
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(
        `
        *,
        profiles:user_id(
          id,
          full_name,
          avatar_url,
          telegram_username
        )
      `,
      )
      .eq('event_id', route.params.id as string)
      .eq('status', 'approved')

    if (error)
      throw error
    attendees.value = data as any
  }
  catch (error) {
    console.error('Error fetching attendees:', error)
  }
  finally {
    loading.value = false
  }
}

async function checkUserBooking() {
  if (!authStore.user)
    return
  if (!route.params.id) {
    router.push('/app/events')
    return
  }
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, status')
      .eq('event_id', route.params.id as string)
      .eq('user_id', authStore.user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is the error code for "No rows returned" which is expected if no booking exists
      throw error
    }

    bookingStatus.value = data?.status || null
  }
  catch (error) {
    console.error('Error checking user booking:', error)
  }
}

async function submitBooking() {
  if (!authStore.user) {
    bookingError.value = 'You must be logged in to book this event'
    return
  }

  if (!event.value) {
    bookingError.value = 'Event details not available'
    return
  }

  isSubmitting.value = true
  bookingError.value = ''

  try {
    // First, check if profile exists for this user
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authStore.user.id)
      .maybeSingle()

    // If profile doesn't exist, ask user to complete their profile first
    if (profileError || !profileData) {
      bookingError.value = 'Please complete your profile before booking. Go to your profile page first.'
      router.push({ path: '/app/account', query: { booking: 'required' } })
      return
    }

    // Create the booking
    const { error } = await supabase
      .from('bookings')
      .insert({
        user_id: authStore.user.id,
        booking_type: 'event',
        event_id: event.value.id,
        start_date: event.value.date,
        num_attendees: numberOfAttendees.value,
        message: bookingMessage.value,
        status: 'pending',
      })
      .select()

    if (error)
      throw error

    bookingSuccess.value = true
    bookingStatus.value = 'pending'
    showBookingForm.value = false
  }
  catch (error) {
    console.error('Error submitting booking:', error)
    bookingError.value
      = (error as Error).message || 'Failed to submit booking. Please try again.'
  }
  finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchEvent()
  fetchAttendees()
  checkUserBooking()
})
</script>

<template>
  <div class="container px-4 py-8 mx-auto">
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div v-else-if="event" class="max-w-4xl mx-auto">
      <!-- Image Gallery -->
      <div v-if="event.images?.length" class="relative mb-8 h-96">
        <img
          :src="event.images[0]"
          :alt="event.title"
          class="object-cover w-full h-full"
        >
        <div class="absolute top-4 right-4">
          <span class="badge-category">{{ event.category }}</span>
        </div>
      </div>

      <!-- Event Details -->
      <div class="p-8 bg-black border-2 border-white">
        <h1 class="mb-6 text-4xl">
          {{ event.title }}
          <span v-if="isDraft" class="px-2 py-1 ml-2 text-sm text-black bg-yellow-500">DRAFT</span>
        </h1>

        <div class="grid gap-8 mb-8 md:grid-cols-2">
          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <span class="material-icons">schedule</span>
              <span>{{ format(new Date(event.date), "PPP p") }}</span>
            </div>

            <div class="flex items-center gap-2">
              <span class="material-icons">location_on</span>
              <span>{{ event.location }}</span>
            </div>

            <div class="flex items-center gap-2">
              <span class="material-icons">group</span>
              <span>
                {{ attendees.length }} attending
                {{
                  event.max_attendees
                    ? `(${event.max_attendees - attendees.length} spots left)`
                    : ""
                }}
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
              <span class="material-icons">WhatsApp</span>
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

        <!-- Description - Enhanced with better markdown rendering -->
        <div>
          <h2 class="mb-4 text-2xl">
            Description
          </h2>
          <div
            class="mb-8 prose prose-invert prose-p:my-4 prose-headings:mt-6 prose-headings:mb-4 prose-ul:my-4 prose-li:my-1 max-w-none"
            v-html="formatDescription(event.description)"
          />
        </div>

        <!-- Attendees -->
        <div class="space-y-4">
          <h2 class="text-2xl">
            Attendees
          </h2>

          <div v-if="attendees.length === 0" class="text-white/60">
            No attendees yet. Be the first to join!
          </div>

          <div
            v-else
            class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
          >
            <router-link
              v-for="booking in attendees"
              :key="booking.id"
              :to="`/profile/${booking.profiles.id}`"
              class="flex flex-col items-center p-4 transition-colors border-2 border-white hover:bg-white hover:text-black"
            >
              <img
                :src="
                  booking.profiles.avatar_url
                    || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
                "
                :alt="booking.profiles.full_name"
                class="object-cover w-16 h-16 mb-2 rounded-full"
              >
              <span class="text-sm text-center">{{
                booking.profiles.full_name
              }}</span>
            </router-link>
          </div>
        </div>

        <!-- Booking Form -->
        <div v-if="showBookingForm" class="p-4 mt-8 border-2 border-white">
          <h2 class="mb-4 text-2xl">
            Book This Event
          </h2>

          <form class="space-y-4" @submit.prevent="submitBooking">
            <div>
              <label for="attendees" class="block text-sm font-bold uppercase">Number of attendees</label>
              <input
                id="attendees"
                v-model="numberOfAttendees"
                type="number"
                min="1"
                :max="
                  event.max_attendees
                    ? event.max_attendees - attendees.length
                    : 10
                "
                required
                class="block w-full px-3 py-2 mt-1 text-white bg-black border-2 border-white"
              >
            </div>

            <div>
              <label for="message" class="block text-sm font-bold uppercase">Message to organizer (optional)</label>
              <textarea
                id="message"
                v-model="bookingMessage"
                rows="3"
                class="block w-full px-3 py-2 mt-1 text-white bg-black border-2 border-white"
              />
            </div>

            <div v-if="bookingError" class="text-red-500">
              {{ bookingError }}
            </div>

            <div class="flex justify-end gap-4">
              <button
                type="button"
                class="px-6 py-2 btn-secondary"
                @click="showBookingForm = false"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-6 py-2 btn-primary"
                :disabled="isSubmitting"
              >
                <span
                  v-if="isSubmitting"
                  class="loading loading-spinner loading-sm"
                />
                <span v-else>Submit Booking</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Booking Status -->
        <div v-else-if="bookingStatus" class="p-4 mt-8 border-2 border-white">
          <div
            v-if="bookingStatus === 'pending'"
            class="flex items-center gap-2 text-yellow-400"
          >
            <span class="material-icons">pending</span>
            <span>Your booking request is pending approval from the
              organizer.</span>
          </div>
          <div
            v-else-if="bookingStatus === 'approved'"
            class="flex items-center gap-2 text-green-400"
          >
            <span class="material-icons">check_circle</span>
            <span>Your booking has been approved! See you at the event.</span>
          </div>
          <div
            v-else-if="bookingStatus === 'rejected'"
            class="flex items-center gap-2 text-red-400"
          >
            <span class="material-icons">cancel</span>
            <span>Your booking request was not approved.</span>
          </div>
          <div
            v-else-if="bookingStatus === 'expired'"
            class="flex items-center gap-2 text-gray-400"
          >
            <span class="material-icons">schedule</span>
            <span>Your booking request has expired.</span>
          </div>
        </div>

        <!-- Booking Success Message -->
        <div
          v-else-if="bookingSuccess"
          class="p-4 mt-8 text-green-400 border-2 border-green-500"
        >
          <div class="flex items-center gap-2">
            <span class="material-icons">check_circle</span>
            <span>Your booking request has been submitted successfully! The
              organizer will review your request.</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end mt-8">
          <div v-if="isDraft" class="mr-4 text-right text-yellow-400">
            <span class="mr-1 align-middle material-icons">warning</span>
            <span>This event is currently in draft mode and not available for booking.</span>
          </div>
          <div v-else-if="!authStore.user">
            <router-link to="/auth" class="px-8 py-3 btn-primary">
              Login to Book
            </router-link>
          </div>
          <div
            v-else-if="!hasUserBooked && !bookingSuccess && !showBookingForm"
          >
            <button
              class="px-8 py-3 btn-primary"
              :disabled="!spotsAvailable || isDraft"
              :title="!spotsAvailable ? 'No spots available' : (isDraft ? 'Event is in draft mode' : '')"
              @click="showBookingForm = true"
            >
              Book Now
            </button>
            <div v-if="!spotsAvailable" class="mt-2 text-sm text-red-400">
              Sorry, this event is full.
            </div>
          </div>
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
