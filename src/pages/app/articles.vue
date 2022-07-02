<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonPage, IonTitle, IonToolbar, modalController } from '@ionic/vue'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import ModalVideoVue from '~/components/ModalVideo.vue'
import { useSupabase } from '~/services/supabase'
import type { definitions } from '~/types/supabase'

const news = ref<definitions['news'][]>([] as definitions['news'][])
const { t } = useI18n()
const router = useRouter()
const isLoading = ref(false)
const supabase = useSupabase()

const showVideo = async () => {
  const modal = await modalController.create({
    component: ModalVideoVue,
    backdropDismiss: false,
    showBackdrop: false,
    swipeToClose: false,
  })
  return modal.present()
}
onMounted(async () => {
  isLoading.value = true
  const { data } = await supabase
    .from<definitions['news']>('news')
    .select(`id,
      created_at,
      category,
      author_name,
      title,
      description,
      img`,
    )
    .order('created_at', { ascending: false })
  if (data)
    news.value = data
  isLoading.value = false
})
</script>

<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>{{ t('news.heading') }}</IonTitle>
      </IonToolbar>
      <IonButtons slot="end" class="pr-4" @click="showVideo()">
        <h4 class="underline">
          {{ t('news.video') }}
        </h4>
      </IonButtons>
    </IonHeader>
    <IonContent :fullscreen="true">
      <IonHeader collapse="condense">
        <IonToolbar>
          <IonTitle size="large">
            {{ t('news.heading') }}
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <div v-for="(n, index) in news" :key="index" class="flex flex-col items-center p-5" @click="router.push(`/articles/${n.id}`)">
        <p class="text-sm w-full text-bright-cerulean-500">
          {{ n.category }}
        </p>
        <img :src="n.img" alt="bebe" class="rounded-xl h-48 w-full object-cover">
        <div class="flex flex-col w-full flex-wrap px-2 py-4">
          <p class="">
            {{ dayjs(n.created_at).format('DD/MM/YYYY') }} {{ t('news.by') }} {{ n.author_name }}
          </p>
          <h1 class="text-xl font-medium">
            {{ n.title }}
          </h1>
        </div>
      </div>
    </IonContent>
  </IonPage>
</template>

<style scoped>
  IonHeader {
    --min-height: 200px;
  }
</style>

<route lang="yaml">
meta:
  option: tabs
</route>
