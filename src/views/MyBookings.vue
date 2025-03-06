<script setup lang="ts">
import type { Database } from '../types/supabase'
import { format } from 'date-fns'
import { onMounted, ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

type Booking = Database['public']['Tables']['bookings']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']
type Event = Database['public']['Tables']['events']['Row']
type Rental = Database['public']['Tables']['rentals']['Row']

const authStore = useAuthStore()
const bookings = ref<
  (Booking & { profiles: Profile, events: Event, rentals: Rental })[]
>([])
const loading = ref(true)
const viewMode = ref('guest') // 'guest' or 'host'
const statusFilter = ref('all') // 'pending', 'future', 'past', 'all'

async function fetchBookings() {
  try {
    loading.value = true
    const now = new Date().toISOString()

    let query = supabase.from('bookings').select(`
      *,
      events (*),
      rentals (*),
      profiles!bookings_user_id_fkey (*)
    `)

    // Apply base filter based on view mode
    if (viewMode.value === 'guest') {
      if (!authStore.user?.id) {
        throw new Error('User not authenticated')
      }
      query = query.eq('user_id', authStore.user?.id)
    }
    else {
      query = query.or(
        `events.creator_id.eq.${authStore.user?.id},rentals.creator_id.eq.${authStore.user?.id}`,
      )
    }

    // Apply status/time filter
    if (statusFilter.value === 'pending') {
      query = query.eq('status', 'pending')
    }
    else if (statusFilter.value === 'future') {
      query = query.gte('start_date', now).not('status', 'eq', 'rejected')
    }
    else if (statusFilter.value === 'past') {
      query = query.lt('start_date', now).not('status', 'eq', 'rejected')
    }

    query = query.order('start_date', { ascending: true })

    const { data, error } = await query
    if (error)
      throw error
    bookings.value = data as (Booking & {
      profiles: Profile
      events: Event
      rentals: Rental
    })[]
  }
  catch (error) {
    console.error('Error fetching bookings:', error)
  }
  finally {
    loading.value = false
  }
}

async function updateBookingStatus(
  bookingId: string,
  status: Database['public']['Enums']['booking_status'],
) {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId)

    if (error)
      throw error
    await fetchBookings()
  }
  catch (error) {
    console.error('Error updating booking:', error)
  }
}

onMounted(() => {
  fetchBookings()
})
</script>

<template>
  <div class="container px-4 py-8 mx-auto">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-4xl">
        Bookings
      </h1>

      <div class="flex items-center gap-4">
        <!-- View Mode Toggle -->
        <div class="flex border-2 border-white">
          <button
            v-for="mode in ['guest', 'host']"
            :key="mode"
            class="px-4 py-2"
            :class="viewMode === mode ? 'bg-white text-black' : ''"
            @click="
              viewMode = mode;
              statusFilter = 'all';
              fetchBookings();
            "
          >
            {{ mode.charAt(0).toUpperCase() + mode.slice(1) }}
          </button>
        </div>

        <!-- Status Filter -->
        <select
          v-model="statusFilter"
          class="px-3 py-2 uppercase bg-black border-2 border-white"
          @change="fetchBookings()"
        >
          <option value="all">
            All
          </option>
          <option value="pending">
            Pending
          </option>
          <option value="future">
            Future
          </option>
          <option value="past">
            Past
          </option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div v-else class="space-y-6">
      <div v-if="bookings.length === 0" class="py-8 text-center">
        <p class="text-white/60">
          No bookings found.
        </p>
      </div>

      <div v-else class="grid gap-6">
        <div
          v-for="booking in bookings"
          :key="booking.id"
          class="p-6 border-2 border-white"
        >
          <div class="flex items-start justify-between mb-4">
            <div>
              <h3 class="mb-2 text-xl">
                {{ booking.events?.title || booking.rentals?.title }}
              </h3>
              <p class="text-white/60">
                {{ format(new Date(booking.start_date), "PPP") }}
                {{
                  booking.end_date
                    ? ` - ${format(new Date(booking.end_date), "PPP")}`
                    : ""
                }}
              </p>
            </div>

            <span
              class="px-3 py-1 border"
              :class="{
                'bg-yellow-500 text-black': booking.status === 'pending',
                'bg-green-500 text-black': booking.status === 'approved',
                'bg-red-500 text-black': booking.status === 'rejected',
              }"
            >
              {{ booking.status }}
            </span>
          </div>

          <div v-if="booking.message" class="mb-4 prose-sm prose prose-invert">
            {{ booking.message }}
          </div>

          <!-- Management Actions -->
          <div
            v-if="viewMode === 'host' && booking.status === 'pending'"
            class="flex gap-4 mt-4"
          >
            <button
              class="px-4 py-2 btn-primary"
              @click="updateBookingStatus(booking.id, 'approved')"
            >
              Approve
            </button>

            <button
              class="px-4 py-2 btn-secondary"
              @click="updateBookingStatus(booking.id, 'rejected')"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
