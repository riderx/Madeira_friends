<script setup lang="ts">
import { ref, computed } from 'vue'
import { uploadAvatar, deleteAvatar } from '../lib/avatars'
import { useAuthStore } from '../stores/auth'

const props = defineProps<{
  currentAvatarUrl?: string
  onAvatarChange?: (url: string) => void
}>()

const authStore = useAuthStore()
const fileInput = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)
const avatarUrl = ref(props.currentAvatarUrl || '')
const uploadError = ref('')

const userId = computed(() => {
  return authStore.user?.id || ''
})

function triggerFileInput() {
  if (fileInput.value) {
    fileInput.value.click()
  }
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return
  
  const file = target.files[0]
  const fileSize = file.size / 1024 / 1024 // size in MB
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    uploadError.value = 'Please select an image file'
    return
  }
  
  // Validate file size (max 2MB)
  if (fileSize > 2) {
    uploadError.value = 'Image size should be less than 2MB'
    return
  }
  
  uploadError.value = ''
  isUploading.value = true
  
  try {
    const url = await uploadAvatar(userId.value, file)
    if (url) {
      avatarUrl.value = url
      if (props.onAvatarChange) {
        props.onAvatarChange(url)
      }
    } else {
      uploadError.value = 'Failed to upload image'
    }
  } catch (error) {
    console.error('Error uploading avatar:', error)
    uploadError.value = 'An error occurred while uploading'
  } finally {
    isUploading.value = false
    // Reset file input
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}
</script>

<template>
  <div class="flex flex-col items-center">
    <div 
      class="relative w-24 h-24 overflow-hidden bg-gray-800 border-2 border-white rounded-full cursor-pointer"
      @click="triggerFileInput"
    >
      <img 
        v-if="avatarUrl" 
        :src="avatarUrl" 
        alt="User avatar" 
        class="object-cover w-full h-full"
      />
      <div v-else class="flex items-center justify-center w-full h-full">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white lucide lucide-user">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
      
      <!-- Upload overlay -->
      <div 
        class="absolute inset-0 flex items-center justify-center transition-opacity bg-black bg-opacity-50 opacity-0 hover:opacity-100"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white lucide lucide-upload">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" x2="12" y1="3" y2="15" />
        </svg>
      </div>
      
      <!-- Loading overlay -->
      <div 
        v-if="isUploading" 
        class="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70"
      >
        <svg class="w-8 h-8 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    </div>
    
    <p class="mt-2 text-sm text-gray-400">Click to upload avatar</p>
    
    <p v-if="uploadError" class="mt-1 text-sm text-red-500">{{ uploadError }}</p>
    
    <input 
      ref="fileInput"
      type="file" 
      accept="image/*" 
      class="hidden" 
      @change="handleFileChange"
    />
  </div>
</template> 
