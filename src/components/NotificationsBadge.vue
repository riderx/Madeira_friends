<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const count = ref(0)
const loading = ref(true)

// Get unread notifications count
async function fetchUnreadCount() {
  if (!authStore.user?.id)
    return

  try {
    loading.value = true

    const { count: unreadCount, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', authStore.user.id)
      .eq('read', false) // Only count unread notifications

    if (error)
      throw error

    count.value = unreadCount || 0
  }
  catch (error) {
    console.error('Error fetching notifications count:', error)
  }
  finally {
    loading.value = false
  }
}

// Setup realtime subscription to listen for new notifications
const subscription = ref<any>(null)

function setupRealtimeSubscription() {
  if (!authStore.user?.id)
    return

  // Remove any existing subscription
  if (subscription.value) {
    subscription.value.unsubscribe()
  }

  // Subscribe to notifications table changes
  subscription.value = supabase
    .channel('notifications-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${authStore.user.id}`,
      },
      () => {
        fetchUnreadCount()
      },
    )
    .subscribe()
}

// Clean up subscription when component unmounts
onUnmounted(() => {
  if (subscription.value) {
    subscription.value.unsubscribe()
  }
})

onMounted(() => {
  fetchUnreadCount()
  setupRealtimeSubscription()
})
</script>

<template>
  <div v-if="count > 0" class="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs text-black bg-red-500 rounded-full">
    {{ count > 9 ? '9+' : count }}
  </div>
</template>
