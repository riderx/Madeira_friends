<script setup lang="ts">
import mime from 'mime'
import { IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToast, IonToolbar, isPlatform } from '@ionic/vue'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { cameraOutline, chevronForwardOutline } from 'ionicons/icons'
import { NativeBiometric } from 'capacitor-native-biometric'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useMainStore } from '~/stores/main'
import { useSupabase } from '~/services/supabase'
import { b64ToArrayBuffer, pickFileImage } from '~/services/images'
import type { definitions } from '~/types/supabase'

const { t } = useI18n()
const supabase = useSupabase()
const router = useRouter()
const main = useMainStore()
const isLoading = ref(false)
const errorMessage = ref('')
const isBiometricAvailable = ref(false)
const version = ref(import.meta.env.VITE_APP_VERSION)
const branch = ref(import.meta.env.VITE_BRANCH)

if (isPlatform('capacitor')) {
  NativeBiometric.isAvailable()
    .then((res) => {
      isBiometricAvailable.value = res.isAvailable
    })
    .catch((err) => {
      console.error(err)
    })
}
const updloadPhoto = async (compressed: string, fileName: string, contentType: string) => {
  try {
    const buff = await b64ToArrayBuffer(compressed, contentType)
    const { error } = await supabase
      .storage
      .from('images')
      .upload(`${main.auth?.id}/${fileName}`, buff, {
        contentType,
      })
    const { publicURL, error: urlError } = supabase
      .storage
      .from('images')
      .getPublicUrl(`${main.auth?.id}/${fileName}`)
    if (error || urlError || !publicURL) {
      errorMessage.value = t('account.error')
      console.error('upload or getPublicUrl error', error, urlError)
      return
    }
    const { data: usr, error: dbError } = await supabase
      .from<definitions['users']>('users')
      .update({ image_url: publicURL })
      .match({ id: main.auth?.id })
    await supabase
      .from('public_details')
      .upsert({
        id: main.auth?.id,
        image_url: publicURL,
      })
    if (dbError || !usr || !usr.length) {
      errorMessage.value = t('account.error')
      console.error('update error', dbError)
      return
    }
    main.user = usr[0]
  }
  catch (err) {
    console.error(err)
    errorMessage.value = t('account.error')
  }
  isLoading.value = false
}

const takeFile = async () => {
  try {
    isLoading.value = true
    const file = await pickFileImage()
    if (!file.data) {
      errorMessage.value = t('account.error')
      return
    }
    await updloadPhoto(file.data, file.name, file.mimeType)
  }
  catch (error) {
    errorMessage.value = t('account.error')
    console.error('error', error)
    isLoading.value = false
  }
}

const takePhoto = async (source: CameraSource = CameraSource.Camera) => {
  try {
    const cameraPhoto = await Camera.getPhoto({
      resultType: CameraResultType.DataUrl,
      source,
      quality: 100,
    })
    isLoading.value = true
    const fileName = `${new Date().getTime()}.${cameraPhoto.format}`

    if (!cameraPhoto.dataUrl)
      return

    const contentType = mime.getType(cameraPhoto.format)

    if (!contentType)
      return
    await updloadPhoto(cameraPhoto.dataUrl, fileName, contentType)
  }
  catch (e) {
    console.error(e)
    isLoading.value = false
  }
}

const presentSelector = async () => {
  return !isPlatform('android') ? takePhoto(CameraSource.Photos) : takeFile()
}
</script>

<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>{{ t('account.heading') }}</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent :fullscreen="true">
      <IonHeader collapse="condense">
        <IonToolbar>
          <IonTitle size="large">
            {{ t('account.heading') }}
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <div class="py-16 px-6">
        <div v-if="!main.user?.image_url || isLoading" class="mt-8 mx-auto w-40 h-40 bg-sweet-pink-500 rounded-5xl grid place-content-center" @click="presentSelector()">
          <svg v-if="isLoading" class="animate-spin h-5 w-5 text-white inline-block align-middle" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
          <IonIcon v-else :icon="cameraOutline" size="large" class="text-white" />
        </div>
        <img v-else class="mt-8 mx-auto w-40 h-40 object-cover rounded-5xl" :src="main.user?.image_url" @click="presentSelector()">

        <h2 class="text-center mt-4 text-2xl text-black-light">
          {{ `${main.user?.first_name} ${main.user?.last_name}` }}
        </h2>
        <p class="text-center text-bright-cerulean-500 font-bold">
          <span class="uppercase">{{ main.user?.country }}</span> - {{ main.user?.city }}
        </p>

        <ul class="grid grid-rows-4 gap-y-5 mt-12 mb-6">
          <li>
            <router-link class="flex justify-between items-center" to="/app/profile_details">
              <span class="font-bold">
                {{ t('account.personalInformation') }}
              </span>
              <IonIcon :icon="chevronForwardOutline" class="text-bright-cerulean-500" />
            </router-link>
          </li>
          <li>
            <router-link class="flex justify-between items-center" to="/app/change_password">
              <span class="font-bold">
                {{ t('account.changePassword') }}
              </span>
              <IonIcon :icon="chevronForwardOutline" class="text-bright-cerulean-500" />
            </router-link>
          </li>
          <li>
            <router-link class="flex justify-between items-center" to="/app/notification_settings">
              <span class="font-bold">
                {{ t('account.preferences') }}
              </span>
              <IonIcon :icon="chevronForwardOutline" class="text-bright-cerulean-500" />
            </router-link>
          </li>
        </ul>
        <a
          class="block text-center text-sm text-brink-pink-500 underline mt-4"
          href="https://9moispourtoi.com/mentions-legales/"
          target="_blank"
        >
          {{ t("notificationSettings.legal") }}
        </a>
        <a
          class="block text-center text-sm text-brink-pink-500 underline mt-4"
          href="https://9moispourtoi.com/mentions-legales/"
          target="_blank"
        >
          {{ t("notificationSettings.privacy") }}
        </a>
        <a
          class="block text-center text-sm text-brink-pink-500 underline mt-4"
          href="https://9moispourtoi.com/contrat-de-licence-utilisateur-final/"
          target="_blank"
        >
          {{ t("notificationSettings.eula") }}
        </a>
        <div class="mx-auto text-center mt-4">
          <button class="mx-auto font-bold text-sweet-pink-500" @click="main.logout().then(() => router.replace('/login'))">
            {{ t('account.logout') }}
          </button>
        </div>
        <div class="mx-auto text-center mt-4">
          <button class="mx-auto font-bold text-dusk-500">
            Version {{ version }}
          </button>
        </div>
        <div v-if="branch !== 'prod'" class="mx-auto text-center mt-4">
          <button class="mx-auto font-bold text-dusk-500">
            ENV {{ branch }}
          </button>
        </div>
      </div>
      <IonToast
        :is-open="errorMessage ? true : false"
        :message="errorMessage"
        :duration="2000"
        @did-dismiss="errorMessage = ''"
      />
    </IonContent>
  </IonPage>
</template>

<route lang="yaml">
meta:
  option: tabs
</route>
