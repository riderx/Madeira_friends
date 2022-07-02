<script setup lang="ts">
import { IonContent, IonPage, IonToggle } from '@ionic/vue'
import { reactive, ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import TitleHead from '~/components/TitleHead.vue'
import { useSupabase } from '~/services/supabase'
import { useMainStore } from '~/stores/main'
import type { definitions } from '~/types/supabase'

const { t } = useI18n()
const main = useMainStore()
const supabase = useSupabase()
const isLoading = ref(false)
const form = reactive({
  enableNotifications: false,
  optForNewsletters: false,
})

const submitNotif = async () => {
  isLoading.value = true
  const { data, error } = await supabase
    .from<definitions['users']>('users')
    .update({
      enableNotifications: form.enableNotifications,
    })
    .match({ id: main.user?.id })
  if (!error && data?.length)
    main.user = data[0]
  isLoading.value = false
}
const submitDoi = async () => {
  isLoading.value = true
  const { data, error } = await supabase
    .from<definitions['users']>('users')
    .update({
      optForNewsletters: form.optForNewsletters,
    })
    .match({ id: main.user?.id })
  if (!error && data?.length)
    main.user = data[0]
  isLoading.value = false
}
watchEffect(async () => {
  if (main.path === '/app/notification_settings') {
    form.enableNotifications = !!main.user?.enableNotifications
    form.optForNewsletters = !!main.user?.optForNewsletters
  }
})
</script>

<template>
  <ion-page>
    <IonContent :fullscreen="true">
      <div class="mx-auto w-full lg:w-1/2">
        <div class="py-16 px-6">
          <TitleHead :big="true" :title="t('notificationSettings.heading')" />
          <div class="flex justify-between items-center my-2">
            <label for="notification" class="justify-self-start text-xl">{{ t('activation.notification') }}</label>
            <IonToggle v-model="form.enableNotifications" color="success" @ion-change="submitNotif()" />
          </div>
          <p class="col-span-2 text-left">
            {{ t('activation.notification-desc') }}
          </p>
          <div class="flex justify-between items-center mb-2 mt-4">
            <label for="notification" class="justify-self-start text-xl w-64">{{ t('activation.newsletter') }}</label>
            <IonToggle v-model="form.optForNewsletters" color="success" @ion-change="submitDoi()" />
          </div>
          <p class="col-span-2 text-left">
            {{ t('activation.doi-desc') }}
          </p>
        </div>
      </div>
      <!-- <IonToast
        :is-open="errorMessage? true: false"
        :message="errorMessage"
        :duration="2000"
        @did-dismiss="errorMessage = ''"
      >
      </IonToast> -->
    </IonContent>
  </ion-page>
</template>

<route lang="yaml">
meta:
  option: tabs
</route>
