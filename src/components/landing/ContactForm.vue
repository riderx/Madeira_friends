<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits(['submit'])
const submitting = ref(false)
const error = ref('')
const success = ref('')

const form = ref({
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
})

async function handleSubmit() {
  try {
    submitting.value = true
    error.value = ''
    success.value = ''

    await emit('submit', form.value)

    success.value = 'Message sent successfully! We will get back to you soon.'
    form.value = {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    }
  }
  catch (e) {
    error.value = 'Failed to send message. Please try again.'
    console.error(e)
  }
  finally {
    submitting.value = false
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
        >
      </div>

      <div>
        <input
          v-model="form.email"
          type="email"
          placeholder="Your Email"
          required
          class="w-full px-4 py-3 text-white bg-black border-2 border-white"
        >
      </div>

      <div>
        <input
          v-model="form.phone"
          type="tel"
          placeholder="Your Phone (Optional)"
          class="w-full px-4 py-3 text-white bg-black border-2 border-white"
        >
      </div>

      <div>
        <input
          v-model="form.subject"
          type="text"
          placeholder="Subject"
          required
          class="w-full px-4 py-3 text-white bg-black border-2 border-white"
        >
      </div>

      <div>
        <textarea
          v-model="form.message"
          placeholder="Your Message"
          required
          rows="4"
          class="w-full px-4 py-3 text-white bg-black border-2 border-white"
        />
      </div>

      <button
        type="submit"
        class="w-full py-4 btn-primary"
        :disabled="submitting"
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
