<script setup lang="ts">
import { v4 as uuidv4 } from 'uuid'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import { Bell } from 'lucide-vue-next'
import NotificationsBadge from '../components/NotificationsBadge.vue'

const authStore = useAuthStore()
const router = useRouter()
const loading = ref(false)
const saving = ref(false)
const uploading = ref(false)
const error = ref('')
const success = ref('')
const route = useRoute()

const profile = ref({
  full_name: '',
  telegram_username: '',
  phone: '',
  bio: '',
  location_madeira: '',
  avatar_url: '',
})

async function loadProfile() {
  try {
    loading.value = true
    error.value = ''
    if (!authStore.user?.id) {
      throw new Error('User not authenticated')
    }

    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authStore.user?.id)
      .maybeSingle()

    if (fetchError) {
      throw fetchError
    }

    if (data) {
      profile.value = {
        ...profile.value,
        full_name: data.full_name || '',
        telegram_username: data.telegram_username || '',
        phone: data.phone || '',
        bio: data.bio || '',
        location_madeira: data.location_madeira || '',
        avatar_url: data.avatar_url || '',
      }

      // Check for query parameter indicating redirect from booking
      if (route.query.booking === 'required') {
        success.value = 'Please complete your profile to continue with your booking.'
      }
    }
    else {
      // Create profile if it doesn't exist
      const { error: createError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authStore.user?.id,
            full_name: authStore.user?.email?.split('@')[0] || 'New User',
          },
        ])
        .select('*')
        .single()

      if (createError)
        throw createError

      // Reload profile after creation
      const { data: newProfile, error: reloadError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authStore.user?.id)
        .single()

      if (reloadError)
        throw reloadError

      if (newProfile) {
        profile.value = {
          ...profile.value,
          full_name: newProfile.full_name || '',
          telegram_username: newProfile.telegram_username || '',
          phone: newProfile.phone || '',
          bio: newProfile.bio || '',
          location_madeira: newProfile.location_madeira || '',
          avatar_url: newProfile.avatar_url || '',
        }

        // Show notification for new users
        success.value = 'Profile created! Please complete your details before making bookings.'
      }
    }
  }
  catch (e) {
    error.value = (e as Error).message
  }
  finally {
    loading.value = false
  }
}

async function updateProfile() {
  try {
    if (!authStore.user?.id) {
      throw new Error('User not authenticated')
    }
    saving.value = true
    error.value = ''
    success.value = ''

    const { error: updateError } = await supabase
      .from('profiles')
      .update(profile.value)
      .eq('id', authStore.user?.id)

    if (updateError)
      throw updateError
    success.value = 'Profile updated successfully!'
  }
  catch (e) {
    error.value = (e as Error).message
  }
  finally {
    saving.value = false
  }
}

async function uploadAvatar(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file)
    return

  try {
    uploading.value = true
    error.value = ''

    // Upload image
    const fileExt = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExt}`
    // Use the required path pattern: user_id/visibility/filename
    const filePath = `${authStore.user?.id}/public/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file)

    if (uploadError)
      throw uploadError

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(filePath)

    // Update profile
    profile.value.avatar_url = publicUrl
    await updateProfile()
  }
  catch (e) {
    error.value = (e as Error).message
  }
  finally {
    uploading.value = false
  }
}

async function signOut() {
  await supabase.auth.signOut()
}

function goToNotifications() {
  router.push('/app/notifications')
}

onMounted(() => {
  if (authStore.user) {
    loadProfile()
  }
})
</script>

<template>
  <div class="container px-4 py-8 mx-auto">
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-4xl">
        Account
      </h1>
      
      <button 
        class="relative p-2 border-2 border-white hover:bg-white/10"
        @click="goToNotifications"
      >
        <Bell class="w-6 h-6" />
        <NotificationsBadge />
      </button>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div v-else class="max-w-2xl mx-auto">
      <div class="p-8 bg-black border-2 border-white">
        <form class="space-y-6" @submit.prevent="updateProfile">
          <div class="flex flex-col items-center mb-8">
            <div class="relative w-32 h-32 mb-4">
              <img
                :src="
                  profile.avatar_url
                    || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
                "
                alt="Profile"
                class="object-cover w-full h-full border-2 border-white rounded-full"
              >
              <label
                class="absolute bottom-0 right-0 p-2 text-black bg-white rounded-full cursor-pointer"
                :class="{ 'opacity-50 cursor-not-allowed': uploading }"
              >
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  :disabled="uploading"
                  @change="uploadAvatar"
                >
                <i class="fas fa-camera" />
              </label>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block mb-2 text-sm font-bold uppercase">Full Name</label>
              <input
                v-model="profile.full_name"
                type="text"
                required
                class="w-full px-3 py-2 input-primary"
              >
            </div>

            <div>
              <label class="block mb-2 text-sm font-bold uppercase">WhatsApp Username</label>
              <input
                v-model="profile.telegram_username"
                type="text"
                class="w-full px-3 py-2 input-primary"
              >
            </div>

            <div>
              <label class="block mb-2 text-sm font-bold uppercase">Phone</label>
              <input
                v-model="profile.phone"
                type="tel"
                class="w-full px-3 py-2 input-primary"
              >
            </div>

            <div>
              <label class="block mb-2 text-sm font-bold uppercase">Location in Madeira</label>
              <input
                v-model="profile.location_madeira"
                type="text"
                class="w-full px-3 py-2 input-primary"
              >
            </div>

            <div>
              <label class="block mb-2 text-sm font-bold uppercase">Bio</label>
              <textarea
                v-model="profile.bio"
                rows="4"
                class="w-full px-3 py-2 input-primary"
              />
            </div>
          </div>

          <div v-if="error" class="text-sm font-bold text-red-500">
            {{ error }}
          </div>

          <div v-if="success" class="text-sm font-bold text-green-500">
            {{ success }}
          </div>

          <div class="flex gap-4">
            <button
              type="submit"
              class="flex-1 py-3 btn-primary"
              :disabled="saving"
            >
              <span v-if="saving" class="loading loading-spinner" />
              <span v-else>Save Changes</span>
            </button>

            <button
              type="button"
              class="flex-1 py-3 btn-secondary"
              @click="signOut"
            >
              Sign Out
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
