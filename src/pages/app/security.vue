<script setup lang="ts">
import { IonContent, IonPage, IonToggle, isPlatform } from '@ionic/vue'
import { NativeBiometric } from 'capacitor-native-biometric'
import { computed, reactive, ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import PhoneCode from '~/components/PhoneCode.vue'
import TitleHead from '~/components/TitleHead.vue'
import { useSupabase } from '~/services/supabase'
import { useMainStore } from '~/stores/main'

const supabase = useSupabase()

const form = reactive({
  biometric: !!supabase.auth.user()?.user_metadata?.security?.biometric,
})
const bioType = ref(0)
const isTouch = computed(() => bioType.value === 1 || bioType.value === 3)
const isFace = computed(() => bioType.value === 2 || bioType.value === 4 || bioType.value === 5)

const isLoading = ref(false)
const showCode = ref(true)
const errorMessage = ref('')
const isBiometricAvailable = ref(false)
const phoneCode = ref(false)

const router = useRouter()

if (isPlatform('capacitor')) {
  NativeBiometric.isAvailable()
    .then((res) => {
      bioType.value = res.biometryType
      isBiometricAvailable.value = res.isAvailable
    }).catch((err) => {
      console.log(err)
    })
}
else {
  phoneCode.value = true
}

const { t } = useI18n()
const main = useMainStore()

const submitCode = async (code: string) => {
  isLoading.value = true
  if (code !== main.pin) { errorMessage.value = t('accountCode.invalidCode') }
  else {
    showCode.value = false
    isLoading.value = false
  }
}
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
    router.push('/app/account')
  }
  isLoading.value = false
}
watchEffect(async () => {
  if (main.path === '/app/security')
    showCode.value = true
})
</script>

<template>
  <IonPage>
    <IonContent :fullscreen="true">
      <div v-if="isBiometricAvailable || phoneCode" class="mx-auto w-full lg:w-1/2 py-16 px-6">
        <TitleHead :big="false" :title="t('security.heading')" />
        <div v-if="!showCode" class="w-84 mt-8 mb-8 mx-auto">
          <div class="flex justify-between items-center mb-2 mt-6">
            <label v-if="isFace" for="legal" class="justify-self-start text-xl text-black-light">
              {{ t('security.faceId') }}
            </label>
            <label v-else-if="!isFace && isTouch" for="legal" class="justify-self-start text-xl text-black-light">
              {{ t('security.touchId') }}
            </label>
            <IonToggle v-model="form.biometric" :disabled="isLoading" color="success" @ion-change="submit" />
          </div>
          <p class="col-span-2 text-left mb-4 text-black-light">
            {{ t('security.biometric-desc') }}
          </p>
        </div>
        <div v-else>
          <div class="px-8">
            <h2 class=" mt-16 text-sweet-pink-500">
              {{ t('security.phone-code') }}
            </h2>
          </div>
          <div class="grid place-content-center w-full px-8">
            <PhoneCode :error-message="errorMessage" :is-loading="isLoading" @submit-code="submitCode" />
          </div>
        </div>
      </div>
    </IonContent>
  </IonPage>
</template>
