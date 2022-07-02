<script setup lang="ts">
import { IonContent, IonIcon, IonPage } from '@ionic/vue'
import { chevronForwardOutline } from 'ionicons/icons'
import dayjs from 'dayjs'
import { ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import TitleHead from '~/components/TitleHead.vue'
import { useSupabase } from '~/services/supabase'
import Spinner from '~/components/Spinner.vue'
import type { definitions } from '~/types/supabase'
import { getYO } from '~/composables/utils'
import Notes from '~/components/Notes.vue'

const route = useRoute()
const router = useRouter()
const supabase = useSupabase()
const { t } = useI18n()
const isLoading = ref(true)
const user = ref<definitions['users']>()
const userId = ref(String(route.params.profile))
const infants = ref()
const conversations = ref()

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
          <!-- user profil -->
          <section v-if="infants.length" class="my-8">
            <h4 class="font-medium mb-2">
              {{ t('profile.childrens') }}:
            </h4>
            <template v-if="!infants || !infants.length">
              <p>{{ t('profileInfo.noInfant') }}</p>
            </template>
            <div v-for="infant of infants" :key="infant.id">
              <div class="flex justify-between" @click="router.push(`/profile/infant/${infant.id}`)">
                <p>{{ infant.name }}</p>
                <p class="text-sweet-pink-500">
                  {{ getYO(infant.dob || '') }}
                </p>
              </div>
              <p class="text-xs text-grey line-clamp-3 mb-2">
                {{ infant.remarks ? infant.remarks : t('profile.no_remark') }}
              </p>
            </div>
            <hr class="w-screen text-grey">
          </section>
          <section v-else class="my-8">
            <h4 class="font-medium mb-2">
              {{ t('profile.no_child') }}
            </h4>
            <hr class="w-screen text-grey">
          </section>
          <section v-if="conversations.length" class="my-8">
            <h4 class="font-medium mb-2">
              {{ t('profile.archived_chat') }}
            </h4>
            <template v-if="!conversations || !conversations.length">
              <p>{{ t('profileInfo.nil') }}</p>
            </template>
            <div v-for="conversation of conversations" :key="conversation.id" class="flex justify-between my-4" @click="$router.push(`/chat/${conversation.id}`)">
              <p class="text-bright-cerulean-500">
                {{ conversation.room_subject_id.subject }}
              </p>
              <div class="flex items-center">
                <p class="text-grey text-xs mr-2">
                  {{ dayjs(conversation.created_at).format('DD/MM/YYYY') }}
                </p>
                <IonIcon :icon="chevronForwardOutline" class="text-bright-cerulean-500" />
              </div>
            </div>
            <hr class="w-screen text-grey">
          </section>
          <section v-else class="my-8">
            <h4 class="font-medium mb-2">
              {{ t('profile.no_archived_chat') }}
            </h4>
            <hr class="w-screen text-grey">
          </section>
          <Notes :user-id="userId" />
        </div>
        <div v-else class="flex justify-center">
          <Spinner />
        </div>
      </div>
    </IonContent>
  </IonPage>
</template>
