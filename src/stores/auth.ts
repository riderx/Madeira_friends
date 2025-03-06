import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(true)

  async function initUser() {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      user.value = currentUser
    } catch (error) {
      console.error('Error loading user:', error)
    } finally {
      loading.value = false
    }
  }

  // Listen for auth changes
  supabase.auth.onAuthStateChange((event, session) => {
    user.value = session?.user ?? null
  })

  return {
    user,
    loading,
    initUser
  }
})
