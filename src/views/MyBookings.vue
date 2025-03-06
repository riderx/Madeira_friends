<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import { format } from 'date-fns'
import MarkdownIt from 'markdown-it'

const authStore = useAuthStore()
const bookings = ref([])
const loading = ref(true)
const viewMode = ref('guest') // 'guest' or 'host'
const statusFilter = ref('all') // 'pending', 'future', 'past', 'all'
const md = new MarkdownIt()

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
      query = query.eq('user_id', authStore.user?.id)
    } else {
      query = query.or(`events.creator_id.eq.${authStore.user?.id},rentals.creator_id.eq.${authStore.user?.id}`)
    }

    // Apply status/time filter
    if (statusFilter.value === 'pending') {
      query = query.eq('status', 'pending')
    } else if (statusFilter.value === 'future') {
      query = query.gte('start_date', now)
        .not('status', 'eq', 'rejected')
    } else if (statusFilter.value === 'past') {
      query = query.lt('start_date', now)
        .not('status', 'eq', 'rejected')
    }

    query = query.order('start_date', { ascending: true })

    const { data, error } = await query
    if (error) throw error
    bookings.value = data
  } catch (error) {
    console.error('Error fetching bookings:', error)
  } finally {
    loading.value = false
  }
}

async function updateBookingStatus(bookingId: string, status: string) {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId)

    if (error) throw error
    await fetchBookings()
  } catch (error) {
    console.error('Error updating booking:', error)
  }
}

onMounted(() => {
  fetchBookings()
})
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-4xl">Bookings</h1>
      
      <div class="flex gap-4 items-center">
        <!-- View Mode Toggle -->
        <div class="flex border-2 border-white">
          <button 
            v-for="mode in ['guest', 'host']"
            :key="mode"
            class="px-4 py-2"
            :class="viewMode === mode ? 'bg-white text-black' : ''"
            @click="viewMode = mode; statusFilter = 'all'; fetchBookings()"
          >
            {{ mode.charAt(0).toUpperCase() + mode.slice(1) }}
          </button>
        </div>
        
        <!-- Status Filter -->
        <select 
          v-model="statusFilter"
          class="bg-black border-2 border-white px-3 py-2 uppercase"
          @change="fetchBookings()"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="future">Future</option>
          <option value="past">Past</option>
        </select>
      </div>
    </div>
    
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>
    
    <div v-else class="space-y-6">
      <div v-if="bookings.length === 0" class="text-center py-8">
        <p class="text-white/60">No bookings found.</p>
      </div>
      
      <div v-else class="grid gap-6">
        <div 
          v-for="booking in bookings" 
          :key="booking.id"
          class="border-2 border-white p-6"
        >
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-xl mb-2">
                {{ booking.events?.title || booking.rentals?.title }}
              </h3>
              <p class="text-white/60">
                {{ format(new Date(booking.start_date), 'PPP') }}
                {{ booking.end_date ? ` - ${format(new Date(booking.end_date), 'PPP')}` : '' }}
              </p>
            </div>
            
            <span 
              class="px-3 py-1 border"
              :class="{
                'bg-yellow-500 text-black': booking.status === 'pending',
                'bg-green-500 text-black': booking.status === 'approved',
                'bg-red-500 text-black': booking.status === 'rejected'
              }"
            >
              {{ booking.status }}
            </span>
          </div>
          
          <div class="prose prose-sm prose-invert mb-4" v-if="booking.message">
            {{ booking.message }}
          </div>
          
          <!-- Management Actions -->
          <div 
            v-if="viewMode === 'host' && booking.status === 'pending'"
            class="flex gap-4 mt-4"
          >
            <button 
              @click="updateBookingStatus(booking.id, 'approved')"
              class="btn-primary px-4 py-2"
            >
              Approve
            </button>
            
            <button 
              @click="updateBookingStatus(booking.id, 'rejected')"
              class="btn-secondary px-4 py-2"
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>