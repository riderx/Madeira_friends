<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import { computed, ref } from 'vue'
import { checkRateLimit, getTimeUntilNextSubmission } from '../../utils/rateLimiting'
import { sanitizeFormData } from '../../utils/sanitization'
import { getValidationError } from '../../utils/validation'

const emit = defineEmits(['submit'])
const submitting = ref(false)
const error = ref('')
const success = ref('')
const fieldErrors = ref<Record<string, string>>({})

const form = ref({
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
  honeypot: '', // Honeypot field to catch bots
})

// Format remaining time until next submission
function formatTimeRemaining(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}

// Computed property for rate limit message
const rateLimitMessage = computed(() => {
  const timeRemaining = getTimeUntilNextSubmission('contact')
  if (timeRemaining <= 0)
    return ''
  return `You've reached the maximum number of submissions. Please try again in ${formatTimeRemaining(timeRemaining)}.`
})

// Validate a single field
function validateField(field: string, value: string) {
  const errorMessage = getValidationError(field, value)
  if (errorMessage) {
    fieldErrors.value[field] = errorMessage
    return false
  }
  else {
    fieldErrors.value[field] = ''
    return true
  }
}

// Validate all fields
function validateForm(): boolean {
  let isValid = true

  // Validate each field
  for (const [field, value] of Object.entries(form.value)) {
    if (field === 'honeypot')
      continue // Skip honeypot field
    if (!validateField(field, value as string)) {
      isValid = false
    }
  }

  return isValid
}

// Debounced submit function to prevent multiple rapid submissions
const debouncedSubmit = useDebounceFn(async () => {
  try {
    // Reset errors
    error.value = ''
    success.value = ''
    fieldErrors.value = {}

    // Check if honeypot field is filled (bot detection)
    if (form.value.honeypot) {
      // Silently reject bot submissions but pretend it succeeded
      success.value = 'Message sent successfully! We will get back to you soon.'
      form.value = {
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        honeypot: '',
      }
      return
    }

    // Check rate limiting
    if (!checkRateLimit('contact')) {
      error.value = `You've reached the maximum number of submissions. Please try again later.`
      return
    }

    // Validate form
    if (!validateForm()) {
      error.value = 'Please correct the errors in the form.'
      return
    }

    // Sanitize form data
    const sanitizedData = sanitizeFormData(form.value)

    // Remove honeypot field before submission
    const { honeypot, ...submissionData } = sanitizedData

    // Submit form
    await emit('submit', submissionData)

    // Show success message and reset form
    success.value = 'Message sent successfully! We will get back to you soon.'
    form.value = {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
      honeypot: '',
    }
  }
  catch (e) {
    error.value = 'Failed to send message. Please try again.'
    console.error(e)
  }
  finally {
    submitting.value = false
  }
}, 500) // 500ms debounce

async function handleSubmit() {
  if (submitting.value)
    return // Prevent multiple submissions
  submitting.value = true
  await debouncedSubmit()
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
          class="w-full px-4 py-3 text-white bg-black border-2 border-white"
          :class="{ 'border-red-500': fieldErrors.name }"
          @blur="validateField('name', form.name)"
        >
        <div v-if="fieldErrors.name" class="mt-1 text-sm font-bold text-red-500">
          {{ fieldErrors.name }}
        </div>
      </div>

      <div>
        <input
          v-model="form.email"
          type="email"
          placeholder="Your Email"
          required
          class="w-full px-4 py-3 text-white bg-black border-2 border-white"
          :class="{ 'border-red-500': fieldErrors.email }"
          @blur="validateField('email', form.email)"
        >
        <div v-if="fieldErrors.email" class="mt-1 text-sm font-bold text-red-500">
          {{ fieldErrors.email }}
        </div>
      </div>

      <div>
        <input
          v-model="form.phone"
          type="tel"
          placeholder="Your Phone (Optional)"
          class="w-full px-4 py-3 text-white bg-black border-2 border-white"
          :class="{ 'border-red-500': fieldErrors.phone }"
          @blur="validateField('phone', form.phone)"
        >
        <div v-if="fieldErrors.phone" class="mt-1 text-sm font-bold text-red-500">
          {{ fieldErrors.phone }}
        </div>
      </div>

      <div>
        <input
          v-model="form.subject"
          type="text"
          placeholder="Subject"
          required
          class="w-full px-4 py-3 text-white bg-black border-2 border-white"
          :class="{ 'border-red-500': fieldErrors.subject }"
          @blur="validateField('subject', form.subject)"
        >
        <div v-if="fieldErrors.subject" class="mt-1 text-sm font-bold text-red-500">
          {{ fieldErrors.subject }}
        </div>
      </div>

      <div>
        <textarea
          v-model="form.message"
          placeholder="Your Message"
          required
          rows="4"
          class="w-full px-4 py-3 text-white bg-black border-2 border-white"
          :class="{ 'border-red-500': fieldErrors.message }"
          @blur="validateField('message', form.message)"
        />
        <div v-if="fieldErrors.message" class="mt-1 text-sm font-bold text-red-500">
          {{ fieldErrors.message }}
        </div>
      </div>

      <!-- Honeypot field - hidden from users but bots will fill it -->
      <div style="display: none;">
        <input v-model="form.honeypot" type="text" name="website" autocomplete="off">
      </div>

      <button
        type="submit"
        class="w-full py-4 btn-primary"
        :disabled="submitting || !!rateLimitMessage"
      >
        <span v-if="submitting" class="loading loading-spinner" />
        <span v-else>SEND MESSAGE</span>
      </button>

      <div v-if="rateLimitMessage" class="text-sm font-bold text-yellow-500">
        {{ rateLimitMessage }}
      </div>

      <div v-if="error" class="text-sm font-bold text-red-500">
        {{ error }}
      </div>

      <div v-if="success" class="text-sm font-bold text-green-500">
        {{ success }}
      </div>
    </div>
  </form>
</template>
