<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

function validateForm() {
  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return false
  }
  return true
}

async function handleRegister() {
  try {
    if (!validateForm()) return

    loading.value = true
    error.value = ''

    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value
    })

    if (signUpError) {
      error.value = signUpError.message
      return
    }

    router.push('/app')
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen px-4">
    <div class="w-full max-w-md p-8 bg-black border-2 border-white">
      <div>
        <img src="/assets/logo.jpg" alt="Madeira Friends" class="w-24 h-24 mx-auto mb-4" />
        <h1 class="mb-8 text-4xl font-bold text-center uppercase">Register</h1>
      </div>
      
      <form @submit.prevent="handleRegister" class="space-y-6">
        <div>
          <label for="email" class="block text-sm font-bold uppercase">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            class="block w-full px-3 py-2 mt-1 text-white bg-black border-2 border-white"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-bold uppercase">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            class="block w-full px-3 py-2 mt-1 text-white bg-black border-2 border-white"
          />
        </div>

        <div v-if="error" class="mb-4 text-sm font-bold text-red-500">
          {{ error }}
        </div>

        <button type="submit" class="w-full py-3 font-bold text-black uppercase bg-white border-2 border-white hover:bg-black hover:text-white" :disabled="loading">
          <span v-if="loading" class="loading loading-spinner"></span>
          <span v-else>Register</span>
        </button>

        <div class="pt-4 text-center">
          <router-link to="/login" class="px-2 font-bold text-white uppercase hover:bg-white hover:text-black">
            Already have an account? Login
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>
