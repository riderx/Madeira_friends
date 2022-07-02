<script setup lang="ts">
import { IonContent, IonPage } from '@ionic/vue'
import { ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import TitleHead from '~/components/TitleHead.vue'
import { useSupabase } from '~/services/supabase'
import Spinner from '~/components/Spinner.vue'
import type { definitions } from '~/types/supabase'
import { getYO } from '~/composables/utils'

const route = useRoute()
const supabase = useSupabase()
const { t } = useI18n()
const isLoading = ref(true)
const user = ref<definitions['users']>()
const userId = ref(String(route.params.profile))

const getProfile = async () => {
  user.value = undefined
  const { data } = await supabase
    .from<definitions['users']>('users')
    .select('*')
    .eq('id', userId.value)
  if (data)
    user.value = data[0]
}

watchEffect(async () => {
  if (route.path.startsWith('/profile/')) {
    isLoading.value = true
    await Promise.all([getProfile()])
    isLoading.value = false
  }
})
</script>

<template>
  <!-- component -->
  <IonPage>
    <IonContent :fullscreen="true">
      <div v-if="!isLoading" id="container" class="text-left bg-transparentw-full h-full min-h-screen p-8">
        <TitleHead :big="false" :title="t('profile.info')" />

        <div v-if="!isLoading">
          <div v-if="user" class="flex flex-col justify-start items-center">
            <img class="h-38 w-38 rounded-3xl my-3 object-cover" :src="user.image_url || 'https://www.kindpng.com/picc/m/163-1636340_user-avatar-icon-avatar-transparent-user-icon-png.png'" :alt="t('profile.picture')">
            <h1>{{ `${user.first_name} ${user.last_name}` }}</h1>
            <h2 v-if="user.dob" class="text-sweet-pink-500">
              {{ getYO(user.dob || '') }}
            </h2>
            <h3 class="text-bright-cerulean-500">
              <span class="uppercase">{{ user.country }}</span> - {{ user.city }}
            </h3>
          </div>
        </div>
        <div v-else class="flex justify-center">
          <Spinner />
        </div>
      </div>
    </IonContent>
  </IonPage>
</template>
