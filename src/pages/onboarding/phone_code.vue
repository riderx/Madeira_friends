<script setup lang="ts">
import { IonContent, IonInput, IonPage, isPlatform } from '@ionic/vue'
import type { User } from '@supabase/gotrue-js'
import { reactive, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Keyboard } from '@capacitor/keyboard'
import { useSupabase } from '~/services/supabase'
import Button from '~/components/Button.vue'
import type { definitions } from '~/types/supabase'

const supabase = useSupabase()
const router = useRouter()
const route = useRoute()

const form = reactive({
  codes: [
    { id: 1, code: '' },
    { id: 1, code: '' },
    { id: 1, code: '' },
    { id: 1, code: '' },
    { id: 1, code: '' },
    { id: 1, code: '' },
  ],
})

const sentAgain = ref(false)
const isLoading = ref(true)
const errorMessage = ref('')

const { t } = useI18n()
const user = ref<User | null>(null)
const inputs = ref<typeof IonInput[]>([])

const submit = async () => {
  const code = form.codes.reduce((prev, current) => prev + current.code, '')
  isLoading.value = true
  try {
    const resp = await supabase.functions.invoke('receive-code', {
      body: JSON.stringify({
        phone: user.value?.user_metadata.phone,
        code,
      }),
    })
    if (resp.error) {
      isLoading.value = false
      errorMessage.value = 'Something went wrong, please try again!'
      return
    }
    const verificationResult = resp.data
    console.log('verificationResult', verificationResult)
    if (verificationResult && verificationResult.status === 'approved') {
      const { error } = await supabase.auth.update({
        data: {
          isPhoneVerified: true,
        },
      })
      isLoading.value = false

      if (error) {
        errorMessage.value = error.message
        return
      }
      setTimeout(() => {
        if (isPlatform('capacitor'))
          Keyboard.hide()
        router.push('/onboarding/activation')
      }, 1000)
    }
    else {
      isLoading.value = false
      errorMessage.value = 'Could not verify code. Please try again.'
    }
  }
  catch (error: any) {
    isLoading.value = false
    errorMessage.value = error.message
  }
}

const sendSMS = async () => {
  const { error } = await supabase.functions.invoke('send-sms', {
    body: JSON.stringify({
      phone: user.value?.user_metadata.phone,
    }),
  })
  if (error)
    errorMessage.value = error.message
}

const resend = async () => {
  form.codes.forEach(input => input.code = '')
  await sendSMS()
  sentAgain.value = true
}

const backSpace = async (index: number, event: any) => {
  if (index > 0 && !event.target?.value)
    inputs.value[index - 1].$el.setFocus()
}
const inputCode = async (index: number, event: any) => {
  // if there was an input
  const input = event.target?.value as string
  if (input) {
    if (input.length > 1) {
      let all = false
      input.split('').forEach((char, i) => {
        if (form.codes.length > index + i)
          form.codes[index + i].code = char
        if (i === form.codes.length - 1)
          all = true
      })
      if (all)
        return submit()
    }
    else {
      form.codes[index].code = input
    }
    if (index !== 5)
      await inputs.value[index + 1].$el.setFocus()
    else
      return submit()
  }
  // if backspace
  else if (index !== 0) {
    form.codes[index].code = ''
    await inputs.value[index - 1].$el.setFocus()
  }
}

const updateDb = async () => {
  user.value = supabase.auth.user()

  const { error } = await supabase
    .from<definitions['users']>('users')
    .insert(
      {
        id: user.value?.id,
        first_name: user.value?.user_metadata.first_name || '',
        last_name: user.value?.user_metadata.last_name || '',
        email: user.value?.email,
        image_url: '',
      },
    )
  await supabase
    .from('public_details')
    .insert({
      id: user.value?.id,
      first_name: user.value?.user_metadata.first_name || '',
      last_name: user.value?.user_metadata.last_name || '',
      image_url: '',
    })
  if (error)
    console.log('updateDb', error)
  else
    await sendSMS()

  isLoading.value = false
}

watchEffect(() => {
  if (route.path === '/onboarding/phone_code') {
    setTimeout(async () => {
      await updateDb()
    }, 500)
  }
})
</script>

<template>
  <IonPage>
    <IonContent :fullscreen="true">
      <div class="grid place-content-center w-full h-full min-h-screen p-8">
        <div class="py-1">
          <h1 ref="heading" class="text-3xl font-medium">
            <span v-if="user">
              {{ `${user?.user_metadata.first_name} ${user?.user_metadata.last_name}` }}
            </span>
            <span v-else>
              {{ t('phone-code.checkPhone') }}
            </span>
          </h1>
          <p class="mt-2 mb-8 text-sweet-pink-500">
            {{ t('phone-code.enterCode') }}
          </p>
          <p v-if="errorMessage" class="text-brink-pink-500 text-xs italic mt-2 mb-4">
            {{ errorMessage }}
          </p>
          <div class="grid grid-cols-6 gap-1 px-4">
            <IonInput
              v-for="(code, index) in form.codes"
              :key="code.id"
              :ref="(el: typeof IonInput) => { inputs[index] = el }"
              :autofocus="index === 0"
              required
              :value="code.code"
              inputmode="numeric"
              :disabled="isLoading"
              class="
                ion-text-center
                border-2
                rounded-xl
                border-bright-cerulean-500
                ion-no-padding
                ion-padding-top
                ion-padding-bottom
              "
              placeholder="-"
              type="text"
              @keyup.delete="backSpace(index, $event)"
              @input="inputCode(index, $event)"
            />
          </div>
          <button v-if="!sentAgain" type="button" class="absolute left-1/2 bottom-0 transform -translate-x-2/4 -translate-y-8 text-brink-pink-500 underline" @click="resend">
            {{ t('phone-code.resend') }}
          </button>
        </div>
      </div>
    </IonContent>
  </IonPage>
</template>
