<script setup lang="ts">
import type { Database } from '../types/supabase'
import { format } from 'date-fns'
import { BellOff } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

type Notification = Database['public']['Tables']['notifications']['Row']

const authStore = useAuthStore()
const notifications = ref<Notification[]>([])
const loading = ref(true)
const errorMessage = ref('')

async function fetchNotifications() {
  try {
    loading.value = true
    errorMessage.value = ''

    if (!authStore.user?.id) {
      throw new Error('User not authenticated')
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', authStore.user.id)
      .order('created_at', { ascending: false })

    if (error)
      throw error

    notifications.value = data || []
  }
  catch (error: any) {
    console.error('Error fetching notifications:', error)
    errorMessage.value = error.message || 'Failed to load notifications'
  }
  finally {
    loading.value = false
  }
}

async function markAsRead(notificationId: string) {
  try {
    if (!authStore.user?.id)
      return

    // Update in database
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', authStore.user.id)

    if (error)
      throw error

    // Update local state
    const index = notifications.value.findIndex(n => n.id === notificationId)
    if (index !== -1) {
      notifications.value[index].read = true
    }
  }
  catch (error) {
    console.error('Error marking notification as read:', error)
  }
}

async function markAllAsRead() {
  try {
    if (!authStore.user?.id)
      return

    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', authStore.user.id)
      .eq('read', false)
      .select('*')

    if (error)
      throw error

    // Update local state
    notifications.value = data || []
  }
  catch (error) {
    console.error('Error marking all notifications as read:', error)
  }
}

async function clearAllNotifications() {
  try {
    if (!authStore.user?.id)
      return

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', authStore.user.id)

    if (error)
      throw error

    notifications.value = []
  }
  catch (error) {
    console.error('Error clearing notifications:', error)
  }
}

onMounted(() => {
  fetchNotifications()
})
</script>

<template>
  <div class="container px-4 py-8 mx-auto">
    <div class="mb-6">
      <h1 class="text-3xl md:text-4xl mb-4">
        Notifications
      </h1>

      <div class="flex justify-end gap-3">
        <button
          v-if="notifications.some(n => !n.read)"
          class="px-4 py-2 text-sm border-2 border-white hover:bg-white/10"
          @click="markAllAsRead"
        >
          Mark All Read
        </button>

        <button
          v-if="notifications.length > 0"
          class="px-4 py-2 text-sm btn-secondary"
          @click="clearAllNotifications"
        >
          Clear All
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <!-- Error state -->
    <div v-else-if="errorMessage" class="p-4 border-2 border-red-500">
      <p class="text-red-400">
        {{ errorMessage }}
      </p>
      <button class="mt-2 btn-primary" @click="fetchNotifications">
        Try Again
      </button>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="notifications.length === 0"
      class="flex flex-col items-center justify-center py-12"
    >
      <BellOff class="w-16 h-16 mb-4 text-white/40" />
      <p class="text-white/60">
        No notifications to display
      </p>
    </div>

    <!-- Notifications list -->
    <div v-else class="grid gap-4">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="p-5 border-2 border-white"
        :class="{ 'bg-white/5': !notification.read }"
      >
        <div class="flex items-start justify-between">
          <div>
            <h3 class="mb-1 text-lg font-medium">
              {{ notification.title }}
            </h3>
            <p class="mb-3">
              {{ notification.message }}
            </p>
            <p class="text-sm text-white/60">
              {{ notification.created_at ? format(new Date(notification.created_at), 'PPpp') : '' }}
            </p>
          </div>

          <!-- Unread indicator -->
          <div
            v-if="!notification.read"
            class="w-3 h-3 bg-blue-500"
            title="Unread notification"
          />
        </div>

        <!-- Dynamic action buttons based on notification type -->
        <div class="flex justify-end mt-4 space-x-3">
          <button
            v-if="!notification.read"
            class="px-3 py-1 text-sm border border-white/60 hover:bg-white/10"
            @click="markAsRead(notification.id)"
          >
            Mark as read
          </button>

          <!-- Booking-related actions -->
          <router-link
            v-if="notification.data?.booking_id"
            :to="`/app/rentals/${notification.data.booking_id}`"
            class="px-3 py-1 text-sm btn-primary"
          >
            View Booking
          </router-link>

          <!-- Event-related actions -->
          <router-link
            v-if="notification.data?.listing_type === 'event' && notification.data?.listing_id"
            :to="`/app/events/${notification.data.listing_id}`"
            class="px-3 py-1 text-sm btn-primary"
          >
            View Event
          </router-link>

          <!-- Rental-related actions -->
          <router-link
            v-if="notification.data?.listing_type === 'rental' && notification.data?.listing_id"
            :to="`/app/rentals/${notification.data.listing_id}`"
            class="px-3 py-1 text-sm btn-primary"
          >
            View Rental
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
