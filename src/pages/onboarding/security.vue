<script setup lang="ts">
import { IonButton, IonContent, IonPage, IonSpinner, IonToggle, isPlatform } from '@ionic/vue'
import { NativeBiometric } from 'capacitor-native-biometric'
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import Success from '~/components/Success.vue'
import { useSupabase } from '~/services/supabase'
import { useMainStore } from '~/stores/main'

const supabase = useSupabase()
const main = useMainStore()
const form = reactive({
  biometric: false,
})

const isLoading = ref(false)
const bioType = ref(0)
const isTouch = computed(() => bioType.value === 1 || bioType.value === 3)
const isFace = computed(() => bioType.value === 2 || bioType.value === 4 || bioType.value === 5)
const errorMessage = ref('')
const successful = ref(false)
const isBiometricAvailable = ref(false)

const router = useRouter()

if (isPlatform('capacitor')) {
  NativeBiometric.isAvailable()
    .then((res) => {
      bioType.value = res.biometryType
      isBiometricAvailable.value = res.isAvailable
      if (!isBiometricAvailable.value) {
        successful.value = true
        setTimeout(() => {
          router.push('/app')
        }, 1500)
      }
    })
}
else {
  successful.value = true
  setTimeout(() => {
    router.push('/app')
  }, 1500)
}

const { t } = useI18n()

const submit = async () => {
  isLoading.value = true

  const { data, error } = await supabase.auth.update({
    data: {
      security: {
        formFilled: true,
        biometric: form.biometric,
      },
    },
  })
  if (error) { errorMessage.value = error.message }
  else {
    main.auth = data
    successful.value = true
    setTimeout(() => {
      router.push('/app')
    }, 1500)
  }
  isLoading.value = false
}
</script>

<template>
  <IonPage>
    <IonContent :fullscreen="true">
      <div class="grid place-content-center w-full p-8 h-screen">
        <div v-if="successful" class="flex flex-col items-center">
          <Success />
          <h1 class="text-3xl font-bold text-center">
            {{ t('security.success') }}
          </h1>
        </div>
        <form v-if="!successful" class="py-1 w-84" @submit.prevent="submit">
          <h1 class="text-3xl font-bold text-left text-black-light">
            {{ t('security.heading') }}
          </h1>
          <p class="mt-2 mb-8 text-sweet-pink-500 text-left text-sweet-pink-500">
            {{ t('security.desc') }}
          </p>
          <div v-if="isBiometricAvailable" class="w-84 mt-8 mb-8 mx-auto">
            <div class="flex justify-between items-center mb-2 mt-6">
              <label v-if="isFace" for="legal" class="justify-self-start text-xl text-black-light">{{ t('security.faceId') }}</label>
              <label v-else-if="!isFace && isTouch" for="legal" class="justify-self-start text-xl text-black-light">{{ t('security.touchId') }}</label>
              <IonToggle v-model="form.biometric" :disabled="isLoading" color="success" />
            </div>
            <p class="col-span-2 text-left mb-4 text-black-light">
              {{ t('security.biometric-desc') }}
            </p>
          </div>
          <IonButton :disabled="isLoading" type="submit" color="secondary" class="w-full mt-8 text-white text-center">
            <span v-if="!isLoading">
              {{ t('security.validate') }}
            </span>
            <IonSpinner v-else name="crescent" color="light" />
          </IonButton>
        </form>
      </div>
    </IonContent>
  </IonPage>
</template>
