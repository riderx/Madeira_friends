<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import MarkdownIt from 'markdown-it'
import { useAuthStore } from '../stores/auth'
import { addDays, format, isAfter, isBefore, differenceInDays } from 'date-fns'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const rental = ref(null)
const loading = ref(true)
const bookingStatus = ref(null)
const isSubmitting = ref(false)
const showBookingForm = ref(false)
const bookingMessage = ref('')
const bookingSuccess = ref(false)
const bookingError = ref('')
const startDate = ref(new Date().toISOString().split('T')[0])
const endDate = ref('')
const existingBookings = ref([])
const loadingBookings = ref(false)

// Enhanced markdown configuration
const md = new MarkdownIt({
  html: false, // Disable HTML for security
  breaks: true, // Convert \n to <br>
  linkify: true, // Auto-convert URLs to links
  typographer: true, // Enable smart quotes and other typographic replacements
})

// Calculate minimum end date (startDate + minDuration)
const minEndDate = computed(() => {
  if (!startDate.value || !rental.value) return ''
  
  const start = new Date(startDate.value)
  const minDuration = rental.value.min_duration || 1
  const minEnd = addDays(start, minDuration - 1)
  
  return minEnd.toISOString().split('T')[0]
})

// Calculate maximum end date (startDate + maxDuration)
const maxEndDate = computed(() => {
  if (!startDate.value || !rental.value || !rental.value.max_duration) return ''
  
  const start = new Date(startDate.value)
  const maxEnd = addDays(start, rental.value.max_duration - 1)
  
  return maxEnd.toISOString().split('T')[0]
})

// Calculate booking duration
const bookingDuration = computed(() => {
  if (!startDate.value || !endDate.value) return 0
  
  const start = new Date(startDate.value)
  const end = new Date(endDate.value)
  
  return differenceInDays(end, start) + 1
})

// Calculate total price
const totalPrice = computed(() => {
  if (!rental.value || !bookingDuration.value) return 0
  return rental.value.price_per_day * bookingDuration.value
})

// Check if date range is available
const isDateRangeAvailable = computed(() => {
  if (!startDate.value || !endDate.value || existingBookings.value.length === 0) return true
  
  const start = new Date(startDate.value)
  const end = new Date(endDate.value)
  
  return !existingBookings.value.some(booking => {
    const bookingStart = new Date(booking.start_date)
    const bookingEnd = new Date(booking.end_date)
    
    // Check if there's an overlap
    return (
      (isAfter(start, bookingStart) && isBefore(start, bookingEnd)) ||
      (isAfter(end, bookingStart) && isBefore(end, bookingEnd)) ||
      (isBefore(start, bookingStart) && isAfter(end, bookingEnd)) ||
      (isBefore(start, bookingStart) && isAfter(end, bookingEnd))
    )
  })
})

// Check if user has already booked
const hasUserBooked = computed(() => {
  return bookingStatus.value !== null
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
    
    // Set default end date based on minimum duration
    if (data.min_duration) {
      const start = new Date(startDate.value)
      const minEnd = addDays(start, data.min_duration - 1)
      endDate.value = minEnd.toISOString().split('T')[0]
    }
  } catch (error) {
    console.error('Error fetching rental:', error)
    router.push('/rentals')
  } finally {
    loading.value = false
  }
}

async function fetchExistingBookings() {
  if (!rental.value) return
  
  loadingBookings.value = true
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('start_date, end_date')
      .eq('rental_id', rental.value.id)
      .eq('status', 'approved')
    
    if (error) throw error
    existingBookings.value = data || []
  } catch (error) {
    console.error('Error fetching bookings:', error)
  } finally {
    loadingBookings.value = false
  }
}

async function checkUserBooking() {
  if (!authStore.user) return
  
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, status')
      .eq('rental_id', route.params.id)
      .eq('user_id', authStore.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (error) throw error
    
    bookingStatus.value = data?.status || null
  } catch (error) {
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
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        user_id: authStore.user.id,
        booking_type: 'rental',
        rental_id: rental.value.id,
        start_date: startDate.value,
        end_date: endDate.value,
        message: bookingMessage.value,
        status: 'pending'
      })
      .select()
    
    if (error) throw error
    
    bookingSuccess.value = true
    bookingStatus.value = 'pending'
    showBookingForm.value = false
  } catch (error) {
    console.error('Error submitting booking:', error)
    bookingError.value = error.message || 'Failed to submit booking. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

function handleStartDateChange() {
  // Ensure end date is not before the start date
  const start = new Date(startDate.value)
  const end = new Date(endDate.value)
  
  if (isBefore(end, start)) {
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
        
        <!-- Booking Form -->
        <div v-if="showBookingForm" class="mt-8 border-2 border-white p-4">
          <h2 class="text-2xl mb-4">Book This Rental</h2>
          
          <form @submit.prevent="submitBooking" class="space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <label for="start-date" class="block text-sm font-bold uppercase">Check-in Date</label>
                <input
                  id="start-date"
                  v-model="startDate"
                  type="date"
                  required
                  :min="new Date().toISOString().split('T')[0]"
                  @change="handleStartDateChange"
                  class="block w-full px-3 py-2 mt-1 text-white bg-black border-2 border-white"
                />
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
                />
              </div>
            </div>
            
            <div>
              <label for="message" class="block text-sm font-bold uppercase">Message to owner (optional)</label>
              <textarea
                id="message"
                v-model="bookingMessage"
                rows="3"
                class="block w-full px-3 py-2 mt-1 text-white bg-black border-2 border-white"
              ></textarea>
            </div>
            
            <!-- Price Summary -->
            <div v-if="startDate && endDate" class="p-4 border-2 border-white">
              <h3 class="text-xl mb-2">Booking Summary</h3>
              <div class="grid gap-2 grid-cols-2">
                <div>Duration:</div>
                <div class="text-right">{{ bookingDuration }} days</div>
                
                <div>Price per day:</div>
                <div class="text-right">{{ rental.price_per_day }}€</div>
                
                <div class="font-bold">Total Price:</div>
                <div class="text-right font-bold">{{ totalPrice }}€</div>
                
                <div v-if="rental.security_deposit" class="text-sm mt-2 col-span-2">
                  *Plus {{ rental.security_deposit }}€ security deposit (refundable)
                </div>
              </div>
            </div>
            
            <div v-if="bookingError" class="text-red-500">
              {{ bookingError }}
            </div>
            
            <div v-if="!isDateRangeAvailable" class="text-yellow-400">
              ⚠️ Selected dates are not available. Please choose different dates.
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
                <span v-if="isSubmitting" class="loading loading-spinner loading-sm"></span>
                <span v-else>Submit Booking</span>
              </button>
            </div>
          </form>
        </div>
        
        <!-- Booking Status -->
        <div v-else-if="bookingStatus" class="mt-8 p-4 border-2 border-white">
          <div v-if="bookingStatus === 'pending'" class="text-yellow-400 flex items-center gap-2">
            <span class="material-icons">pending</span>
            <span>Your booking request is pending approval from the owner.</span>
          </div>
          <div v-else-if="bookingStatus === 'approved'" class="text-green-400 flex items-center gap-2">
            <span class="material-icons">check_circle</span>
            <span>Your booking has been approved!</span>
          </div>
          <div v-else-if="bookingStatus === 'rejected'" class="text-red-400 flex items-center gap-2">
            <span class="material-icons">cancel</span>
            <span>Your booking request was not approved.</span>
          </div>
          <div v-else-if="bookingStatus === 'expired'" class="text-gray-400 flex items-center gap-2">
            <span class="material-icons">schedule</span>
            <span>Your booking request has expired.</span>
          </div>
        </div>
        
        <!-- Booking Success Message -->
        <div v-else-if="bookingSuccess" class="mt-8 p-4 border-2 border-green-500 text-green-400">
          <div class="flex items-center gap-2">
            <span class="material-icons">check_circle</span>
            <span>Your booking request has been submitted successfully! The owner will review your request.</span>
          </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex justify-end mt-8">
          <div v-if="!authStore.user">
            <router-link to="/login" class="btn-primary px-8 py-3">
              Login to Book
            </router-link>
          </div>
          <div v-else-if="!hasUserBooked && !bookingSuccess && !showBookingForm">
            <button 
              @click="showBookingForm = true" 
              class="btn-primary px-8 py-3"
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
