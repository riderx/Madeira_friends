<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { validateEmail, validateLength, validatePhone } from '../../services/contactService'

const emit = defineEmits(['submit'])
const formLoadTime = ref(Date.now())

// Record form load time when component is mounted
onMounted(() => {
  formLoadTime.value = Date.now()
})
const submitting = ref(false)
const error = ref('')
const success = ref('')
const lastSubmitTime = ref(0)
const DEBOUNCE_TIME = 2000 // 2 seconds in milliseconds
let debounceTimeout: number | null = null

const form = ref({
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
  honeypot: '', // Honeypot field to catch bots
})

// Client-side validation
const nameError = computed(() => {
  if (!form.value.name)
    return ''
  return validateLength(form.value.name, 2, 100) ? '' : 'Name must be between 2 and 100 characters'
})

const emailError = computed(() => {
  if (!form.value.email)
    return ''
  return validateEmail(form.value.email) ? '' : 'Please enter a valid email address'
})

const phoneError = computed(() => {
  if (!form.value.phone)
    return ''
  return validatePhone(form.value.phone) ? '' : 'Please enter a valid phone number or leave it empty'
})

const subjectError = computed(() => {
  if (!form.value.subject)
    return ''
  return validateLength(form.value.subject, 2, 200) ? '' : 'Subject must be between 2 and 200 characters'
})

const messageError = computed(() => {
  if (!form.value.message)
    return ''
  return validateLength(form.value.message, 10, 5000) ? '' : 'Message must be between 10 and 5000 characters'
})

const formIsValid = computed(() => {
  return !nameError.value && !emailError.value && !phoneError.value
    && !subjectError.value && !messageError.value
    && form.value.name && form.value.email && form.value.subject && form.value.message
})

// Debounce function to prevent multiple rapid submissions
function isDebounced(): boolean {
  const now = Date.now()
  if (now - lastSubmitTime.value < DEBOUNCE_TIME) {
    return true
  }
  lastSubmitTime.value = now
  return false
}

async function handleSubmit() {
  try {
    // Check if debounced
    if (isDebounced()) {
      error.value = 'Please wait before submitting again'
      return
    }

    // Clear any existing timeout
    if (debounceTimeout) {
      clearTimeout(debounceTimeout)
    }

    // Client-side validation
    if (!formIsValid.value) {
      error.value = 'Please fix the errors in the form'
      return
    }

    submitting.value = true
    error.value = ''
    success.value = ''

    // Add form load time and submission time to the form data
    const formDataWithTiming = {
      ...form.value,
      formLoadTime: formLoadTime.value,
      submissionTime: Date.now(),
    }

    await emit('submit', formDataWithTiming)

    success.value = 'Message sent successfully! We will get back to you soon.'
    form.value = {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
      honeypot: '',
    }

    // Reset form load time for potential future submissions
    formLoadTime.value = Date.now()
  }
  catch (e) {
    error.value = typeof e === 'string'
      ? e
      : (e instanceof Error ? e.message : 'Failed to send message. Please try again.')
    console.error(e)
  }
  finally {
    submitting.value = false

    // Set a timeout to prevent rapid re-submissions
    debounceTimeout = setTimeout(() => {
      debounceTimeout = null
    }, DEBOUNCE_TIME) as unknown as number
  }
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
          :class="{ 'border-red-500': nameError }"
        >
        <div v-if="nameError" class="mt-1 text-sm text-red-500">
          {{ nameError }}
        </div>
      </div>

      <div>
        <input
          v-model="form.email"
          type="email"
          placeholder="Your Email"
          required
          class="w-full px-4 py-3 text-white bg-black border-2 border-white"
          :class="{ 'border-red-500': emailError }"
        >
        <div v-if="emailError" class="mt-1 text-sm text-red-500">
          {{ emailError }}
        </div>
      </div>

      <div>
        <input
          v-model="form.phone"
          type="tel"
          placeholder="Your Phone (Optional)"
          class="w-full px-4 py-3 text-white bg-black border-2 border-white"
          :class="{ 'border-red-500': phoneError }"
        >
        <div v-if="phoneError" class="mt-1 text-sm text-red-500">
          {{ phoneError }}
        </div>
      </div>

      <div>
        <input
          v-model="form.subject"
          type="text"
          placeholder="Subject"
          required
          class="w-full px-4 py-3 text-white bg-black border-2 border-white"
          :class="{ 'border-red-500': subjectError }"
        >
        <div v-if="subjectError" class="mt-1 text-sm text-red-500">
          {{ subjectError }}
        </div>
      </div>

      <div>
        <textarea
          v-model="form.message"
          placeholder="Your Message"
          required
          rows="4"
          class="w-full px-4 py-3 text-white bg-black border-2 border-white"
          :class="{ 'border-red-500': messageError }"
        />
        <div v-if="messageError" class="mt-1 text-sm text-red-500">
          {{ messageError }}
        </div>
      </div>

      <!-- Honeypot field - hidden from users but bots will fill it out -->
      <div style="display: none;">
        <input
          v-model="form.honeypot"
          type="text"
          name="website"
          autocomplete="off"
        >
      </div>

      <button
        type="submit"
        class="w-full py-4 btn-primary"
        :disabled="submitting || !formIsValid"
      >
        <span v-if="submitting" class="loading loading-spinner" />
        <span v-else>SEND MESSAGE</span>
      </button>

      <div v-if="error" class="p-3 mt-4 text-sm font-bold text-red-700 bg-red-100 border border-red-400 rounded">
        <div class="flex items-center">
          <span class="mr-2">⚠️</span>
          <span>{{ error }}</span>
        </div>
      </div>

      <div v-if="success" class="p-3 mt-4 text-sm font-bold text-green-700 bg-green-100 border border-green-400 rounded">
        <div class="flex items-center">
          <span class="mr-2">✅</span>
          <span>{{ success }}</span>
        </div>
      </div>
    </div>
  </form>
</template>
