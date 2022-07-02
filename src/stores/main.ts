import { isPlatform } from '@ionic/vue'
import type { User } from '@supabase/supabase-js'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { NativeBiometric } from 'capacitor-native-biometric'
import type { definitions } from '../types/supabase'
import { useSupabase } from '../services/supabase'
import { unregisterToken } from '../services/notifications'

export const useMainStore = defineStore('main', () => {
  const path = ref('')
  const chatFilter = ref('active')
  const auth = ref<User | null>(null)
  const user = ref<definitions['users'] | null>(null)
  const enableNotifications = computed<boolean>(() => {
    return !!(user.value && user.value?.enableNotifications)
  })

  const logout = async () => {
    return new Promise<void>((resolve) => {
      const supabase = useSupabase()
      unregisterToken()
      supabase.auth.onAuthStateChange(async (event) => {
        if (event === 'SIGNED_OUT') {
          auth.value = null
          user.value = null
          if (isPlatform('capacitor')) {
            try {
              await NativeBiometric.deleteCredentials({
                server: 'com.neufmoispourtoi.app.code',
              })
              await NativeBiometric.deleteCredentials({
                server: 'com.neufmoispourtoi.app',
              })
            }
            catch (err) {
              console.log('err delete credfentials', err)
            }
          }
          resolve()
        }
      })
      localStorage.removeItem('supabase.auth.token')
      setTimeout(() => {
        supabase.auth.signOut()
      }, 300)
    })
  }
  return {
    chatFilter,
    enableNotifications,
    auth,
    user,
    path,
    logout,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useMainStore, import.meta.hot))
