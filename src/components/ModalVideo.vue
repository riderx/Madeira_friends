<script setup lang="ts">
import { IonContent, IonFab, IonFabButton, IonIcon, IonPage, modalController } from '@ionic/vue'
import { closeOutline } from 'ionicons/icons'
import { ref } from 'vue'

const plyr = ref()
const hide = () => {
  modalController.dismiss()
}

const options = {
  clickToPlay: true,
  controls: ['play-large', 'progress'],
  settings: [],
  ratio: '9:16', // or 16:9
}
</script>

<template>
  <IonPage>
    <IonContent :fullscreen="true">
      <ion-fab slot="fixed" vertical="top" horizontal="end">
        <ion-fab-button color="warning" size="small" @click="hide">
          <IonIcon :icon="closeOutline" />
        </ion-fab-button>
      </ion-fab>
      <VuePlyr ref="plyr" :options="options">
        <div class="plyr__video-embed h-screen">
          <!-- <iframe
            src="https://www.youtube.com/embed/MMA0QF7U1RI?amp;iv_load_policy=3&amp;modestbranding=1&amp;playsinline=1&amp;showinfo=0&amp;rel=0&amp;enablejsapi=1"
            allowfullscreen
            allowtransparency
            height="100vh"
            width="100%"
            allow="autoplay"
          /> -->
          <video controls width="250">

            <source
              src="/resources/Video_20220609_30221 PM.MOV"
              type="video/mp4"
            >

            Sorry, your browser doesn't support embedded videos.
          </video>
        </div>
      </VuePlyr>
    </IonContent>
  </IonPage>
</template>
