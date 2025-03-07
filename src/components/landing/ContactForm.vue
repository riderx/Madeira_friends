<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import DOMPurify from 'dompurify'
import { computed, ref } from 'vue'

const emit = defineEmits(['submit'])
const submitting = ref(false)
const error = ref('')
const success = ref('')
const lastSubmitTime = ref(0)
const honeypotField = ref('')

// Form validation states
const validationErrors = ref({
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
})

const form = ref({
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
})

// Validation rules
const EMAIL_REGEX = /^[\w.%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i
const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/

// Computed property to check if form is valid
const isFormValid = computed(() => {
  return !validationErrors.value.name
    && !validationErrors.value.email
    && !validationErrors.value.phone
    && !validationErrors.value.subject
    && !validationErrors.value.message
})

// Validate form fields
function validateForm() {
  // Reset validation errors
  validationErrors.value = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  }

  // Name validation
  if (!form.value.name) {
    validationErrors.value.name = 'Name is required'
  }
  else if (form.value.name.length < 2) {
    validationErrors.value.name = 'Name must be at least 2 characters'
  }
  else if (form.value.name.length > 100) {
    validationErrors.value.name = 'Name must be less than 100 characters'
  }

  // Email validation
  if (!form.value.email) {
    validationErrors.value.email = 'Email is required'
  }
  else if (!EMAIL_REGEX.test(form.value.email)) {
    validationErrors.value.email = 'Please enter a valid email address'
  }
  else if (form.value.email.length > 100) {
    validationErrors.value.email = 'Email must be less than 100 characters'
  }

  // Phone validation (optional)
  if (form.value.phone && !PHONE_REGEX.test(form.value.phone)) {
    validationErrors.value.phone = 'Please enter a valid phone number'
  }
  else if (form.value.phone && form.value.phone.length > 20) {
    validationErrors.value.phone = 'Phone number must be less than 20 characters'
  }

  // Subject validation
  if (!form.value.subject) {
    validationErrors.value.subject = 'Subject is required'
  }
  else if (form.value.subject.length < 3) {
    validationErrors.value.subject = 'Subject must be at least 3 characters'
  }
  else if (form.value.subject.length > 200) {
    validationErrors.value.subject = 'Subject must be less than 200 characters'
  }

  // Message validation
  if (!form.value.message) {
    validationErrors.value.message = 'Message is required'
  }
  else if (form.value.message.length < 10) {
    validationErrors.value.message = 'Message must be at least 10 characters'
  }
  else if (form.value.message.length > 1000) {
    validationErrors.value.message = 'Message must be less than 1000 characters'
  }

  return isFormValid.value
}

// Sanitize form data
function sanitizeFormData() {
  return {
    name: DOMPurify.sanitize(form.value.name.trim()),
    email: DOMPurify.sanitize(form.value.email.trim()),
    phone: form.value.phone ? DOMPurify.sanitize(form.value.phone.trim()) : null,
    subject: DOMPurify.sanitize(form.value.subject.trim()),
    message: DOMPurify.sanitize(form.value.message.trim()),
  }
}

// Debounced submit function to prevent multiple rapid submissions
const debouncedSubmit = useDebounceFn(async () => {
  try {
    // Check for honeypot (bot protection)
    if (honeypotField.value) {
      console.log('Bot submission detected')
      // Fake success to confuse bots
      success.value = 'Message sent successfully! We will get back to you soon.'
      return
    }

    // Rate limiting (prevent submissions more than once every 30 seconds)
    const now = Date.now()
    if (now - lastSubmitTime.value < 30000) {
      error.value = 'Please wait a moment before submitting again'
      return
    }

    // Validate form
    if (!validateForm()) {
      error.value = 'Please fix the errors in the form'
      return
    }

    submitting.value = true
    error.value = ''
    success.value = ''

    // Sanitize data before submission
    const sanitizedData = sanitizeFormData()

    // Submit the form
    await emit('submit', sanitizedData)

    // Update last submit time for rate limiting
    lastSubmitTime.value = Date.now()

    // Show success message and reset form
    success.value = 'Message sent successfully! We will get back to you soon.'
    form.value = {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    }
  }
  catch (e: any) {
    // Improved error handling with more specific messages
    if (e.code === '23505') {
      error.value = 'You have already submitted this message'
    }
    else if (e.code === '23514') {
      error.value = 'Invalid data provided. Please check your inputs'
    }
    else if (e.code === '23502') {
      error.value = 'Please fill in all required fields'
    }
    else if (e.message && typeof e.message === 'string') {
      error.value = `Error: ${e.message}`
    }
    else {
      error.value = 'Failed to send message. Please try again later'
    }
    console.error('Form submission error:', e)
  }
  finally {
    submitting.value = false
  }
}, 500) // 500ms debounce

// Handle form submission
async function handleSubmit() {
  await debouncedSubmit()
}
</script>

<template>
  <form class="max-w-xl mx-auto mb-12" @submit.prevent="handleSubmit">
    <div class="space-y-6">
      <!-- Name field -->
      <div>
        <input
          v-model="form.name"
          type="text"
          placeholder="Your Name"
          required
          maxlength="100"
          class="w-full px-4 py-3 text-white bg-black border-2"
          :class="validationErrors.name ? 'border-red-500' : 'border-white'"
          @blur="validateForm"
        >
        <div v-if="validationErrors.name" class="mt-1 text-sm font-bold text-red-500">
          {{ validationErrors.name }}
        </div>
      </div>

      <!-- Email field -->
      <div>
        <input
          v-model="form.email"
          type="email"
          placeholder="Your Email"
          required
          maxlength="100"
          class="w-full px-4 py-3 text-white bg-black border-2"
          :class="validationErrors.email ? 'border-red-500' : 'border-white'"
          @blur="validateForm"
        >
        <div v-if="validationErrors.email" class="mt-1 text-sm font-bold text-red-500">
          {{ validationErrors.email }}
        </div>
      </div>

      <!-- Phone field (optional) -->
      <div>
        <input
          v-model="form.phone"
          type="tel"
          placeholder="Your Phone (Optional)"
          maxlength="20"
          class="w-full px-4 py-3 text-white bg-black border-2"
          :class="validationErrors.phone ? 'border-red-500' : 'border-white'"
          @blur="validateForm"
        >
        <div v-if="validationErrors.phone" class="mt-1 text-sm font-bold text-red-500">
          {{ validationErrors.phone }}
        </div>
      </div>

      <!-- Subject field -->
      <div>
        <input
          v-model="form.subject"
          type="text"
          placeholder="Subject"
          required
          maxlength="200"
          class="w-full px-4 py-3 text-white bg-black border-2"
          :class="validationErrors.subject ? 'border-red-500' : 'border-white'"
          @blur="validateForm"
        >
        <div v-if="validationErrors.subject" class="mt-1 text-sm font-bold text-red-500">
          {{ validationErrors.subject }}
        </div>
      </div>

      <!-- Message field -->
      <div>
        <textarea
          v-model="form.message"
          placeholder="Your Message"
          required
          rows="4"
          maxlength="1000"
          class="w-full px-4 py-3 text-white bg-black border-2"
          :class="validationErrors.message ? 'border-red-500' : 'border-white'"
          @blur="validateForm"
        />
        <div v-if="validationErrors.message" class="mt-1 text-sm font-bold text-red-500">
          {{ validationErrors.message }}
        </div>
      </div>

      <!-- Honeypot field (hidden from users, visible to bots) -->
      <div class="hidden" aria-hidden="true">
        <input
          v-model="honeypotField"
          type="text"
          name="website"
          autocomplete="off"
          tabindex="-1"
        >
      </div>

      <!-- Submit button with loading state -->
      <button
        type="submit"
        class="w-full py-4 btn-primary"
        :disabled="submitting"
      >
        <span v-if="submitting" class="loading loading-spinner" />
        <span v-else>SEND MESSAGE</span>
      </button>

      <!-- Error message -->
      <div v-if="error" class="p-3 text-sm font-bold text-red-500 bg-red-100 border border-red-500 rounded">
        {{ error }}
      </div>

      <!-- Success message -->
      <div v-if="success" class="p-3 text-sm font-bold text-green-500 bg-green-100 border border-green-500 rounded">
        {{ success }}
      </div>
    </div>
  </form>
</template>
