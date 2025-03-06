import type { User } from '@supabase/supabase-js'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(true)
  const initialized = ref(false)

  async function initUser() {
    // If already initialized, return early
    if (initialized.value && !loading.value)
      return

    loading.value = true
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      user.value = currentUser

      if (currentUser) {
        console.log('User authenticated:', currentUser.email)
      }
      else {
        console.log('No authenticated user found')
      }
    }
    catch (error) {
      console.error('Error loading user:', error)
    }
    finally {
      loading.value = false
      initialized.value = true
    }
  }

  async function refreshSession() {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) {
      console.error('Error refreshing session:', error)
      return false
    }

    user.value = data.user
    return !!data.user
  }

  // Listen for auth changes
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event)
    user.value = session?.user ?? null

    if (event === 'SIGNED_IN') {
      initialized.value = true
    }
    else if (event === 'SIGNED_OUT') {
      initialized.value = true
    }
  })

  return {
    user,
    loading,
    initialized,
    initUser,
    refreshSession,
  }
})
