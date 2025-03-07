<script setup lang="ts">
import { debounce } from '@vueuse/core'
import { computed, ref } from 'vue'

const emit = defineEmits(['submit'])
const submitting = ref(false)
const error = ref('')
const success = ref('')
const lastSubmitTime = ref(0)
const submitCooldown = 10000 // 10 seconds cooldown between submissions

const form = ref({
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
  website: '', // Honeypot field
})

// Validate email format
const isEmailValid = computed(() => {
  if (!form.value.email)
    return true
  const emailRegex = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
  return emailRegex.test(form.value.email)
})

// Validate phone format (optional field)
const isPhoneValid = computed(() => {
  if (!form.value.phone)
    return true
  const phoneRegex = /^\+?\(?\d{3}\)?[-\s.]?\d{3}[-\s.]?\d{4,6}$/
  return phoneRegex.test(form.value.phone)
})

// Check if form is valid
const isFormValid = computed(() => {
  return (
    form.value.name.length > 0
    && form.value.name.length <= 100
    && form.value.email.length > 0
    && form.value.email.length <= 100
    && isEmailValid.value
    && isPhoneValid.value
    && form.value.subject.length > 0
    && form.value.subject.length <= 200
    && form.value.message.length > 0
    && form.value.message.length <= 1000
    && form.value.website === '' // Honeypot should be empty
  )
})

// Debounced submit function
const debouncedSubmit = debounce(async () => {
  try {
    submitting.value = true
    error.value = ''
    success.value = ''

    // Rate limiting check
    const now = Date.now()
    if (now - lastSubmitTime.value < submitCooldown) {
      error.value = 'Please wait a moment before submitting again.'
      submitting.value = false
      return
    }

    // Honeypot check
    if (form.value.website !== '') {
      // Silently fail for bot submissions
      console.log('Honeypot triggered, likely bot submission')
      success.value = 'Message sent successfully! We will get back to you soon.'
      resetForm()
      return
    }

    // Update last submit time
    lastSubmitTime.value = now

    await emit('submit', form.value)

    success.value = 'Message sent successfully! We will get back to you soon.'
    resetForm()
  }
  catch (e) {
    if (e instanceof Error) {
      error.value = `Failed to send message: ${e.message}`
    }
    else {
      error.value = 'Failed to send message. Please try again.'
    }
    console.error(e)
  }
  finally {
    submitting.value = false
  }
}, 500) // 500ms debounce

function resetForm() {
  form.value = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    website: '',
  }
}

function handleSubmit() {
  if (!isFormValid.value) {
    error.value = 'Please fill out all required fields correctly.'
    return
  }
  debouncedSubmit()
}
</script>

<template>
  <form class="max-w-xl mx-auto mb-12" @submit.prevent="handleSubmit">
    <div class="space-y-6">
      <div>
        <input
          v-model="form.name"
          type="text"
          placeholder="Your Name"
          required
          maxlength="100"
          class="w-full px-4 py-3 text-white bg-black border-2 border-white"
          :class="{ 'border-red-500': form.name && form.name.length > 100 }"
        >
        <div v-if="form.name && form.name.length > 100" class="text-sm text-red-500">
          Name must be 100 characters or less
        </div>
      </div>

      <div>
        <input
          v-model="form.email"
          type="email"
          placeholder="Your Email"
          required
          maxlength="100"
          class="w-full px-4 py-3 text-white bg-black border-2 border-white"
          :class="{ 'border-red-500': form.email && !isEmailValid }"
        >
        <div v-if="form.email && !isEmailValid" class="text-sm text-red-500">
          Please enter a valid email address
        </div>
      </div>

      <div>
        <input
          v-model="form.phone"
          type="tel"
          placeholder="Your Phone (Optional)"
          maxlength="20"
          class="w-full px-4 py-3 text-white bg-black border-2 border-white"
          :class="{ 'border-red-500': form.phone && !isPhoneValid }"
        >
        <div v-if="form.phone && !isPhoneValid" class="text-sm text-red-500">
          Please enter a valid phone number
        </div>
      </div>

      <div>
        <input
          v-model="form.subject"
          type="text"
          placeholder="Subject"
          required
          maxlength="200"
          class="w-full px-4 py-3 text-white bg-black border-2 border-white"
          :class="{ 'border-red-500': form.subject && form.subject.length > 200 }"
        >
        <div v-if="form.subject && form.subject.length > 200" class="text-sm text-red-500">
          Subject must be 200 characters or less
        </div>
      </div>

      <div>
        <textarea
          v-model="form.message"
          placeholder="Your Message"
          required
          maxlength="1000"
          rows="4"
          class="w-full px-4 py-3 text-white bg-black border-2 border-white"
          :class="{ 'border-red-500': form.message && form.message.length > 1000 }"
        />
        <div v-if="form.message && form.message.length > 1000" class="text-sm text-red-500">
          Message must be 1000 characters or less
        </div>
      </div>

      <!-- Honeypot field - hidden from users but visible to bots -->
      <div style="display: none;">
        <input
          v-model="form.website"
          type="text"
          name="website"
          autocomplete="off"
        >
      </div>

      <button
        type="submit"
        class="w-full py-4 btn-primary"
        :disabled="submitting || !isFormValid"
      >
        <span v-if="submitting" class="loading loading-spinner" />
        <span v-else>SEND MESSAGE</span>
      </button>

      <div v-if="error" class="text-sm font-bold text-red-500">
        {{ error }}
      </div>

      <div v-if="success" class="text-sm font-bold text-green-500">
        {{ success }}
      </div>
    </div>
  </form>
</template>
