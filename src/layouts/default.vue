<script setup lang="ts">
import { IonIcon, IonLabel, IonPage, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/vue'
import { calendarOutline, gridOutline, personOutline } from 'ionicons/icons'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { computed } from 'vue'

const router = useRouter()
const { t } = useI18n()
const isTab = computed(() => {
  return router.currentRoute.value.meta.option && router.currentRoute.value.meta.option === 'tabs'
})
</script>

<template>
  <IonPage>
    <IonTabs>
      <IonRouterOutlet />
      <IonTabBar v-if="isTab" slot="bottom" class="ion-padding">
        <IonTabButton tab="tab1" href="/app/articles">
          <IonIcon :icon="gridOutline" />
          <IonLabel>{{ t('news.heading') }}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="tab2" href="/app/calendar">
          <IonIcon :icon="calendarOutline" />
          <IonLabel>{{ t('calendar.heading') }}</IonLabel>
        </IonTabButton>

        <!-- <IonTabButton tab="tab3" href="/app/chats">
          <IonIcon :icon="chatbubbleOutline" />
          <IonLabel>{{ t('chats.heading') }}</IonLabel>
        </IonTabButton> -->

        <IonTabButton tab="tab4" href="/app/account">
          <IonIcon :icon="personOutline" />
          <IonLabel>{{ t('account.heading') }}</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  </IonPage>
</template>
