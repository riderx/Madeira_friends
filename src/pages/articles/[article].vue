<script setup lang="ts">
import VueMarkdown from 'vue-markdown-render'
import { IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from '@ionic/vue'
import { ref, watchEffect } from 'vue'
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { chevronBack, openOutline } from 'ionicons/icons'
import { useSupabase } from '~/services/supabase'
import type { definitions } from '~/types/supabase'
import Spinner from '~/components/Spinner.vue'

const { t } = useI18n()
const supabase = useSupabase()
const route = useRoute()
const isLoading = ref(false)
const id = ref('')
const article = ref<definitions['news']>()

const getArticle = async () => {
  isLoading.value = true

  const { data, error } = await supabase
    .from<definitions['news']>('news')
    .select(`id,
      created_at,
      category,
      link,
      author_name,
      title,
      description,
      img`,
    )
    .match({ id: id.value })

  if (error) {
    console.error(error)
    return
  }
  if (!data)
    return
  article.value = data[0]
  isLoading.value = false
}

const openExt = (link: string | undefined) => {
  if (link)
    window.open(link, '_system')
}

watchEffect(async () => {
  if (route.path.startsWith('/articles')) {
    id.value = route.params.article as string
    getArticle()
  }
})
</script>

<template>
  <IonPage>
    <IonHeader class="header-custom">
      <IonToolbar class="toolbar-no-border">
        <IonButtons slot="start">
          <IonButton @click="$router.push('/app/articles')">
            <IonIcon :icon="chevronBack" class="text-grey-dark" />
          </IonButton>
        </IonButtons>
        <IonTitle>{{ t('article.heading') }}</IonTitle>
        <IonButtons slot="end">
          <IonButton @click="openExt(article?.link)">
            <IonIcon :icon="openOutline" class="text-grey-dark" />
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
    <IonContent :fullscreen="true">
      <IonHeader collapse="condense">
        <IonToolbar>
          <IonTitle size="large">
            {{ t('article.heading') }}
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <div class="py-16 px-6">
        <div v-if="!isLoading && article">
          <p class="text-sm w-full text-bright-cerulean-500">
            {{ t(`category.${article.category}`) }}
          </p>
          <img :src="article.img" alt="bebe" class="rounded-xl h-48 w-full object-cover">
          <div class="flex flex-col px-2 py-4">
            <p class="pb-3">
              {{ dayjs(article.created_at).format('DD/MM/YYYY') }} {{ t('news.by') }} {{ article.author_name }}
            </p>
            <h1 class="text-xl font-medium">
              {{ article.title }}
            </h1>
            <p class="">
              <vue-markdown :source="article.description" class="test" />
            </p>
            <p class="pt-3">
              {{ t(`category.source`) }} : <a class="text-bright-cerulean-500 trucate" :href="article.link" target="_blank">{{ article.link }}</a>
            </p>
          </div>
        </div>
        <div v-else class="grid justify-center">
          <Spinner />
        </div>
      </div>
    </IonContent>
  </IonPage>
</template>

<style>
  ion-toolbar {
    --border-color: transparent;
  }
  .test>p {
    margin-top: 15px;
  }
</style>
