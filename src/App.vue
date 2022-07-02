<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import { useHead } from '@vueuse/head'
import { watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { initNotif, listenNotif } from './services/notifications'
import { useMainStore } from '~/stores/main'

const router = useRouter()
// https://github.com/vueuse/head
// you can use this to manipulate the document head in any components,
useHead({
  title: 'Madeira Friends',
  meta: [
    { name: 'description', content: 'App for the community of Madeira friends' },
  ],
})

const main = useMainStore()
let notifListener: any = null
watchEffect(() => {
  if (main.enableNotifications) {
    initNotif()
    if (notifListener)
      notifListener()
    notifListener = listenNotif(router)
  }
  else {
    if (notifListener)
      notifListener()
  }
})
</script>

<template>
  <ion-app>
    <IonRouterOutlet />
  </ion-app>
</template>
