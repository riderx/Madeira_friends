<script setup lang="ts">
import type { Credentials } from 'capacitor-native-biometric'
import { NativeBiometric } from 'capacitor-native-biometric'
import { isPlatform } from '@ionic/vue'
import { computed, ref, toRefs } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMainStore } from '~/stores/main'

const props = defineProps({
  biometric: {
    type: Boolean,
    default: false,
  },
  message: String,
  errorMessage: String,
  isLoading: {
    type: Boolean,
    default: false,
  },
})

const emits = defineEmits([
  'submitCode',
])

const { t } = useI18n()
const main = useMainStore()
const code = ref<number[]>([])

const bioTry = ref(0)
const bioType = ref(0)
const { errorMessage, isLoading } = toRefs(props)

const erase = async () => {
  code.value.pop()
}

const bioAllowed = computed(() => bioTry.value < 4)
const isTouch = computed(() => bioType.value === 1 || bioType.value === 3)
const isFace = computed(() => bioType.value === 2 || bioType.value === 4 || bioType.value === 5)

const click = (index: number) => {
  if (code.value.length < 4) {
    code.value.push(index)
    if (code.value.length === 4) {
      emits('submitCode', code.value.join(''))
      code.value = []
      bioTry.value = 0
    }
  }
}

const biometricClick = async () => {
  if (isPlatform('capacitor') && props.biometric && bioAllowed.value && !main.biometricRunning) {
    main.biometricRunning = true
    try {
      const credentials: Credentials = await NativeBiometric.getCredentials({
        server: 'com.neufmoispourtoi.app.code',
      })
      await NativeBiometric.verifyIdentity({
        reason: t('biometric.reason'),
        title: t('biometric.title'),
      })
      bioTry.value = 0
      emits('submitCode', credentials.password)
    }
    catch (err) {
      bioTry.value++
    }
    setTimeout(() => {
      main.biometricRunning = false
    }, 500)
  }
}
// onMounted(biometricClick) // check biometric when open code in priority TODO: to fix

const selectFunctByIndex = (index: number) => {
  if (index === 10)
    biometricClick()
  else if (index === 12)
    erase()
  else
    click(index)
}
if (isPlatform('capacitor')) {
  NativeBiometric.isAvailable()
    .then((res) => {
      bioType.value = res.biometryType
    })
    .catch(() => {
      console.log('Biometric not available')
    })
}
</script>

<template>
  <form class="py-1">
    <h1 ref="heading" class="text-3xl font-medium pb-5">
      <span v-if="main.user">
        {{ `${main.user?.first_name} ${main.user?.last_name}` }}
      </span>
    </h1>
    <p v-if="errorMessage" class="text-brink-pink-500 mb-4">
      {{ errorMessage }}
    </p>
    <div v-if="!isLoading" class="grid grid-cols-4 gap-1 mb-10 px-20">
      <div v-for="index in 4" :key="index" class="rounded-full h-6 w-6 mx-auto" :class="{ 'bg-brink-pink-500': code[index - 1], 'border border-brink-pink-500': !code[index - 1] }" />
    </div>
    <div v-else class="flex justify-center mb-10">
      <svg v-if="isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block align-middle" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
    <div class="grid grid-cols-3 gap-3">
      <div v-for="index in 12" :key="index" class="text-3xl px-auto py-2 text-center" @click="selectFunctByIndex(index)">
        <p v-if="index === 12">
          <img src="/4.png" alt="faceid" class="mx-auto w-1/3">
        </p>
        <p v-else-if="index === 11">
          0
        </p>
        <p v-else-if="index === 10">
          <img v-if="isTouch && biometric && bioAllowed" src="/8.png" alt="touchid" class="mx-auto w-1/3">
          <img v-else-if="isFace && biometric && bioAllowed" src="/3.png" alt="touchid" class="mx-auto w-1/3">
        </p>
        <p v-else>
          {{ index }}
        </p>
      </div>
    </div>
  </form>
</template>
