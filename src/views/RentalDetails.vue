<script setup lang="ts">
import type { Database } from '../types/supabase'
import { addDays, differenceInDays, isAfter, isBefore } from 'date-fns'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import { createMarkdownRenderer } from '../utils/markdown'

// Define the types based on the generated schema
type Rental = Database['public']['Tables']['rentals']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']
type Booking = Database['public']['Tables']['bookings']['Row']

// Define a combined type for rental with its related profile
interface RentalWithProfile extends Rental {
  profiles: Profile
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const rental = ref<RentalWithProfile | null>(null)
const loading = ref(true)
const bookingStatus = ref<string | null>(null)
const isSubmitting = ref(false)
const showBookingForm = ref(false)
const bookingMessage = ref('')
const bookingSuccess = ref(false)
const bookingError = ref('')
const startDate = ref(new Date().toISOString().split('T')[0])
const endDate = ref('')
const existingBookings = ref<Pick<Booking, 'start_date' | 'end_date'>[]>([])
const loadingBookings = ref(false)

// Enhanced markdown configuration
const md = createMarkdownRenderer({
  html: false, // Disable HTML for security
})

// Calculate minimum end date (startDate + minDuration)
const minEndDate = computed(() => {
  if (!startDate.value || !rental.value)
    return ''

  const start = new Date(startDate.value)
  const minDuration = rental.value.min_duration || 1
  const minEnd = addDays(start, minDuration - 1)

  return minEnd.toISOString().split('T')[0]
})

// Calculate maximum end date (startDate + maxDuration)
const maxEndDate = computed(() => {
  if (!startDate.value || !rental.value || !rental.value.max_duration)
    return ''

  const start = new Date(startDate.value)
  const maxEnd = addDays(start, rental.value.max_duration - 1)

  return maxEnd.toISOString().split('T')[0]
})

// Calculate booking duration
const bookingDuration = computed(() => {
  if (!startDate.value || !endDate.value)
    return 0

  const start = new Date(startDate.value)
  const end = new Date(endDate.value)

  return differenceInDays(end, start) + 1
})

// Calculate total price
const totalPrice = computed(() => {
  if (!rental.value || !bookingDuration.value)
    return 0
  return rental.value.price_per_day * bookingDuration.value
})

// Check if date range is available
const isDateRangeAvailable = computed(() => {
  if (!startDate.value || !endDate.value || existingBookings.value.length === 0)
    return true

  const start = new Date(startDate.value)
  const end = new Date(endDate.value)

  return !existingBookings.value.some((booking) => {
    const bookingStart = new Date(booking.start_date)
    const bookingEnd = new Date(booking.end_date || booking.start_date)

    // Check if there's an overlap
    return (
      (isAfter(start, bookingStart) && isBefore(start, bookingEnd))
      || (isAfter(end, bookingStart) && isBefore(end, bookingEnd))
      || (isBefore(start, bookingStart) && isAfter(end, bookingEnd))
      || (isBefore(start, bookingStart) && isAfter(end, bookingEnd))
    )
  })
})

// Check if user has already booked
const hasUserBooked = computed(() => {
  return bookingStatus.value !== null
})

// Check if the rental is in draft mode
const isDraft = computed(() => {
  return rental.value?.status === 'draft'
})

function formatDescription(description: string | null): string {
  if (!description)
    return ''

  return md.render(description)
}

async function fetchRental() {
  try {
    const { data, error } = await supabase
      .from('rentals')
      .select(
        `
        *,
        profiles!rentals_creator_id_fkey(
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
    rental.value = data as RentalWithProfile

    // Set default end date based on minimum duration
    if (data.min_duration) {
      const start = new Date(startDate.value)
      const minEnd = addDays(start, data.min_duration - 1)
      endDate.value = minEnd.toISOString().split('T')[0]
    }
  }
  catch (error) {
    console.error('Error fetching rental:', error)
    router.push('/app/rentals')
  }
  finally {
    loading.value = false
  }
}

async function fetchExistingBookings() {
  if (!rental.value)
    return

  loadingBookings.value = true
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('start_date, end_date')
      .eq('rental_id', rental.value.id)
      .eq('status', 'approved')

    if (error)
      throw error
    existingBookings.value = data || []
  }
  catch (error) {
    console.error('Error fetching bookings:', error)
  }
  finally {
    loadingBookings.value = false
  }
}

async function checkUserBooking() {
  if (!authStore.user)
    return

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, status')
      .eq('rental_id', route.params.id as string)
      .eq('user_id', authStore.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error)
      throw error

    bookingStatus.value = data?.status || null
  }
  catch (error) {
    console.error('Error checking user booking:', error)
  }
}

async function submitBooking() {
  if (!authStore.user) {
    bookingError.value = 'You must be logged in to book this rental'
    return
  }

  if (!rental.value) {
    bookingError.value = 'Rental details not available'
    return
  }

  if (!startDate.value || !endDate.value) {
    bookingError.value = 'Please select valid dates'
    return
  }

  if (!isDateRangeAvailable.value) {
    bookingError.value = 'Selected dates are not available'
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
        booking_type: 'rental',
        rental_id: rental.value.id,
        start_date: startDate.value,
        end_date: endDate.value,
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
  catch (error: any) {
    console.error('Error submitting booking:', error)
    bookingError.value
      = error.message || 'Failed to submit booking. Please try again.'
  }
  finally {
    isSubmitting.value = false
  }
}

function handleStartDateChange() {
  // Ensure end date is not before the start date
  const start = new Date(startDate.value)
  const end = new Date(endDate.value)

  if (isBefore(end, start) && rental.value) {
    // Reset end date to minimum allowed
    const minDuration = rental.value.min_duration || 1
    const newEnd = addDays(start, minDuration - 1)
    endDate.value = newEnd.toISOString().split('T')[0]
  }
}

onMounted(() => {
  fetchRental().then(() => {
    fetchExistingBookings()
  })
  checkUserBooking()
})
</script>

<template>
  <div class="container px-4 py-8 mx-auto">
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div v-else-if="rental" class="max-w-4xl mx-auto">
      <!-- Image Gallery -->
      <div v-if="rental.images?.length" class="relative mb-8 h-96">
        <img
          :src="rental.images[0]"
          :alt="rental.title"
          class="object-cover w-full h-full"
        >
        <div class="absolute top-4 right-4">
          <span class="badge-category">{{ rental.type }}</span>
        </div>
      </div>

      <!-- Rental Details -->
      <div class="p-8 bg-black border-2 border-white">
        <h1 class="mb-6 text-4xl">
          {{ rental.title }}
          <span v-if="isDraft" class="px-2 py-1 ml-2 text-sm text-black bg-yellow-500">DRAFT</span>
        </h1>

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
                {{
                  rental.max_duration
                    ? ` / Max: ${rental.max_duration} days`
                    : ""
                }}
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
              <span class="material-icons">WhatsApp</span>
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
          <h2 class="mb-4 text-2xl">
            Description
          </h2>
          <div
            class="mb-8 prose prose-invert prose-p:my-4 prose-headings:mt-6 prose-headings:mb-4 prose-ul:my-4 prose-li:my-1 max-w-none"
            v-html="formatDescription(rental.description)"
          />
        </div>

        <!-- Cancellation Policy -->
        <div v-if="rental.cancellation_policy" class="mb-8">
          <h2 class="mb-4 text-2xl">
            Cancellation Policy
          </h2>
          <div
            class="prose prose-invert prose-p:my-4 max-w-none"
            v-html="formatDescription(rental.cancellation_policy)"
          />
        </div>

        <!-- Booking Form -->
        <div v-if="showBookingForm" class="p-4 mt-8 border-2 border-white">
          <h2 class="mb-4 text-2xl">
            Book This Rental
          </h2>

          <form class="space-y-4" @submit.prevent="submitBooking">
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  for="start-date"
                  class="block text-sm font-bold uppercase"
                >Check-in Date</label>
                <input
                  id="start-date"
                  v-model="startDate"
                  type="date"
                  required
                  :min="new Date().toISOString().split('T')[0]"
                  class="block w-full px-3 py-2 mt-1 text-white bg-black border-2 border-white"
                  @change="handleStartDateChange"
                >
              </div>

              <div>
                <label for="end-date" class="block text-sm font-bold uppercase">Check-out Date</label>
                <input
                  id="end-date"
                  v-model="endDate"
                  type="date"
                  required
                  :min="minEndDate"
                  :max="maxEndDate || undefined"
                  class="block w-full px-3 py-2 mt-1 text-white bg-black border-2 border-white"
                >
              </div>
            </div>

            <div>
              <label for="message" class="block text-sm font-bold uppercase">Message to owner (optional)</label>
              <textarea
                id="message"
                v-model="bookingMessage"
                rows="3"
                class="block w-full px-3 py-2 mt-1 text-white bg-black border-2 border-white"
              />
            </div>

            <!-- Price Summary -->
            <div v-if="startDate && endDate" class="p-4 border-2 border-white">
              <h3 class="mb-2 text-xl">
                Booking Summary
              </h3>
              <div class="grid grid-cols-2 gap-2">
                <div>Duration:</div>
                <div class="text-right">
                  {{ bookingDuration }} days
                </div>

                <div>Price per day:</div>
                <div class="text-right">
                  {{ rental.price_per_day }}€
                </div>

                <div class="font-bold">
                  Total Price:
                </div>
                <div class="font-bold text-right">
                  {{ totalPrice }}€
                </div>

                <div
                  v-if="rental.security_deposit"
                  class="col-span-2 mt-2 text-sm"
                >
                  *Plus {{ rental.security_deposit }}€ security deposit
                  (refundable)
                </div>
              </div>
            </div>

            <div v-if="bookingError" class="text-red-500">
              {{ bookingError }}
            </div>

            <div v-if="!isDateRangeAvailable" class="text-yellow-400">
              ⚠️ Selected dates are not available. Please choose different
              dates.
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
                :disabled="isSubmitting || !isDateRangeAvailable"
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
            <span>Your booking request is pending approval from the owner.</span>
          </div>
          <div
            v-else-if="bookingStatus === 'approved'"
            class="flex items-center gap-2 text-green-400"
          >
            <span class="material-icons">check_circle</span>
            <span>Your booking has been approved!</span>
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
            <span>Your booking request has been submitted successfully! The owner
              will review your request.</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-end mt-8">
          <div v-if="isDraft" class="mr-4 text-right text-yellow-400">
            <span class="mr-1 align-middle material-icons">warning</span>
            <span>This rental is currently in draft mode and not available for booking.</span>
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
              :disabled="isDraft"
              :title="isDraft ? 'Rental is in draft mode' : ''"
              @click="showBookingForm = true"
            >
              Book Now
            </button>
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
