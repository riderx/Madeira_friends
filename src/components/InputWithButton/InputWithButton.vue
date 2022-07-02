<script setup lang="ts">
import { ref } from 'vue'
import {
  IonButton, IonButtons, IonIcon, IonTextarea, IonToolbar, isPlatform,
} from '@ionic/vue'
import {
  addOutline,
  cameraOutline,
} from 'ionicons/icons'
import './InputWithButton.scss'
import { pickFile, pickImage } from '~/services/images'

defineProps({
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['change', 'photo', 'file'])
const textInput = ref<string>('')
const setTextInput = (state: string) => textInput.value = state

const inputRef = ref<any | null>(null)

const takeFile = async () => {
  try {
    const filePicked = await pickFile()
    emit('file', filePicked)
  }
  catch (error) {
    console.error(error)
  }
}

const handleSendText = () => {
  emit('change', {
    type: 'text',
    message: textInput.value,
  })

  setTextInput('')
  if (inputRef.value)
    inputRef.value.$el.setFocus()
}

const takePhoto = async () => {
  try {
    const cameraPhoto = await pickImage()

    emit('photo', {
      ...cameraPhoto,
    })
  }
  catch (error) {
    console.error(error)
  }
}
</script>

<template>
  <div class="input-with-giphy py-2">
    <IonToolbar class="toolbar-no-border">
      <!-- <div class="input-block"> -->
      <IonButtons slot="start">
        <IonButton
          type="submit"
          fill="clear"
          size="small"
          :disabled="disabled"
          color="primary"
          @click="takeFile()"
        >
          <IonIcon slot="icon-only" :icon="addOutline" class="text-grey-dark" />
        </IonButton>
        <IonButton
          v-if="!isPlatform('android')"
          type="submit"
          fill="clear"
          size="small"
          color="primary"
          :disabled="disabled"
          @click="takePhoto()"
        >
          <IonIcon slot="icon-only" :icon="cameraOutline" class="text-grey-dark" />
        </IonButton>
      </IonButtons>
      <IonTextarea
        ref="inputRef"
        class="has-auto-grow text-left py-1"
        auto-grow
        :disabled="disabled"
        :value="textInput"
        rows="1"
        placeholder="Type a message"
        @ion-change="setTextInput($event.detail.value)"
      />
      <IonButtons slot="end">
        <IonButton
          type="submit"
          :disabled="textInput.length === 0 || disabled"
          fill="clear"
          size="small"
          color="primary"
          @click="handleSendText"
        >
          <div class="bg-grey-dark rounded-full p-2">
            <img width="15" height="15" src="data:image/png;base64,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">
          </div>
        </IonButton>
      </IonButtons>
      <!-- </div> -->
    </IonToolbar>
  </div>
</template>
