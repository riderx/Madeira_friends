<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import dayjs from 'dayjs'
import {
  IonButton, IonButtons, IonContent, IonFooter, IonHeader,
  IonIcon, IonInfiniteScroll, IonInfiniteScrollContent,
  IonModal, IonPage, IonTitle, IonToast,
  IonToolbar, isPlatform,
} from '@ionic/vue'
import { checkmarkCircle, chevronBack, newspaper, refreshCircle } from 'ionicons/icons'
import { useRoute, useRouter } from 'vue-router'
import type { SupabaseRealtimePayload } from '@supabase/supabase-js'
import type { File as UploadFile } from '@robingenz/capacitor-file-picker'
import { Badge } from '@robingenz/capacitor-badge'
import { useI18n } from 'vue-i18n'
import { useMainStore } from '~/stores/main'
import { useSupabase } from '~/services/supabase'
import InputWithButton from '~/components/InputWithButton/InputWithButton.vue'
import './chat.scss'
import type { definitions } from '~/types/supabase'
import { b64ToBlob } from '~/services/images'

interface RoomMessage {
  created_by: definitions['users']
}

interface InfiniteScrollCustomEvent extends CustomEvent {
  target: HTMLIonInfiniteScrollElement
}

interface Room {
  messages: (definitions['room_messages'] & RoomMessage)[]
  joined_by: definitions['users']
  created_by: definitions['users']
  room_subject_id: definitions['room_subjects']
}

interface Contact {
  id: string
  name: string
  role: string
  image_url: string
}
const supabase = useSupabase()
const contactInfo = ref<Contact>({} as Contact)
const room = ref<(definitions['rooms'] & Room)>({} as any)
const messages = ref<(definitions['room_messages'] & RoomMessage)[]>([] as any)
const userDetails = ref<Record<string, definitions['users']>>({})
const main = useMainStore()

const fetchLimit = 10
const subject = ref('')
const archived = ref(false)

const contentRef = ref<any | null>(null)
const subscription = ref()

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const userId = ref<string>()
const openPreview = ref(false)
const openImageViewer = ref(false)
const previewFileType = ref('')
const showPreviewUpload = ref(true)
const src = ref('')
const fileData = ref<UploadFile>()

const isLoading = ref(true)
const isLoadingMessages = ref(false)
const isLoadingImage = ref(false)
const isLoadingProfil = ref(true)
const errorMessage = ref('')

let fetchOffset = 0
const isDisabled = ref(false)

const scrollToBottom = (duration = 500, isFirstLoad = false) => {
  if (isFirstLoad) {
    setTimeout(async () => {
      if (contentRef.value)
        await contentRef.value.$el.scrollToBottom(duration)
    }, 500)
  }
  else {
    if (contentRef.value) {
      setTimeout(async () => {
        await contentRef.value.$el.scrollToBottom(duration)
      }, 50)
    }
  }
}

const markAsRead = async () => {
  if (!userId.value || !messages.value.length)
    return
  try {
    const { error } = await supabase
      .from('room_messages')
      .update({ read_at: new Date().toISOString() })
      .match({ room_id: route.params.chat })
      .is('read_at', null)
      .neq('created_by', userId.value)
    const { data: totalUnread, error: erroUnread } = await supabase.rpc<number>('get_total_unread', { userid: userId.value })
    if (error || erroUnread)
      console.error('cannot markAsRead', error || erroUnread)
    if (isPlatform('capacitor'))
      await Badge.set({ count: Number(totalUnread) })
  }
  catch (err) {
    console.error('markAsRead', err)
  }
}

const storeUserDetails = () => {
  const details: any = {}
  isLoadingProfil.value = true
  if (room.value.joined_by)
    details[room.value.joined_by.id] = room.value.joined_by
  messages.value.forEach((message) => {
    details[message.created_by.id] = message.created_by
  })
  userDetails.value = details
  isLoadingProfil.value = false
}

const handleChatUpdate = async (payload: SupabaseRealtimePayload<definitions['room_messages'] & RoomMessage>) => {
  if (userDetails.value && userDetails.value[payload.new.created_by]) {
    payload.new.created_by = userDetails.value[payload.new.created_by] as any
  }
  else {
    const { data, error } = await supabase
      .from<definitions['users']>('users')
      .select(`
        id,
        first_name,
        last_name,
        image_url,
        role
        `)
      .match({ id: payload.new.created_by })

    if (error) {
      console.error(error)
      return
    }
    if (!data || !data.length) {
      console.error('User not found')
      return
    }
    userDetails.value[data[0].id] = data[0]
    payload.new.created_by = data[0] as any

    if (!main.professional && (data[0].role === 'doctor' || data[0].role === 'default') && contactInfo.value.id !== data[0].id) {
      contactInfo.value = {
        id: data[0].id,
        name: `${data[0].first_name} ${data[0].last_name}`,
        role: data[0].role,
        image_url: data[0].image_url || '/avatar.svg',
      }
    }
  }
  messages.value.push(payload.new)
  try {
    await markAsRead()
  }
  catch (err) {
    console.error('markAsRead', err)
  }
  storeUserDetails()
  scrollToBottom(50, false)
}

const handleSubmitMessage = async (data: any) => {
  if (!userId.value)
    return
  await supabase
    .from('room_messages')
    .insert([
      {
        created_by: userId.value,
        message_type: data.type,
        message: data.message,
        room_id: route.params.chat,
      },
    ])
  if (!room.value.active) {
    await supabase
      .from('rooms')
      .update({
        active: true,
      })
      .match({ id: route.params.chat })
    room.value.active = true
  }
}

const handleImage = async (file: UploadFile) => {
  if (!file.data || !file.mimeType || !userId.value)
    return
  isLoadingImage.value = true
  try {
    const blob = await b64ToBlob(file.data, file.mimeType)
    await supabase
      .storage
      .from('images')
      .upload(`${userId.value}/${file.name}`, blob, {
        contentType: file.mimeType,
      })

    const { publicURL } = supabase
      .storage
      .from('images')
      .getPublicUrl(`${userId.value}/${file.name}`)

    await supabase
      .from('room_messages')
      .insert([
        {
          created_by: userId.value,
          message_type: 'image',
          file_url: publicURL,
          room_id: route.params.chat,
        },
      ])
    if (!room.value.active) {
      await supabase
        .from('rooms')
        .update({
          active: true,
        })
        .match({ id: route.params.chat })
      room.value.active = true
    }
  }
  catch (e) {
    console.error(e)
  }
  isLoadingImage.value = false
}

const handleFile = async () => {
  if (!userId.value)
    return
  openPreview.value = false
  isLoadingImage.value = true
  const file = fileData.value!
  if (!file.data)
    return
  const fileEnding = file.name.split('.').pop()
  try {
    const blob = await b64ToBlob(file.data, file.mimeType)
    // console.log('handleFile', data)
    await supabase
      .storage
      .from('images')
      .upload(`${userId.value}/${file.name}`, blob, {
        contentType: file.mimeType,
      })

    const { publicURL } = supabase
      .storage
      .from('images')
      .getPublicUrl(`${userId.value}/${file.name}`)
    // check if fileEnding is image or other to define message type
    const message_type = fileEnding === 'pdf' ? 'file' : 'image'
    await supabase
      .from('room_messages')
      .insert([
        {
          created_by: userId.value,
          message_type,
          file_url: publicURL,
          room_id: route.params.chat,
        },
      ])

    if (!room.value.active) {
      await supabase
        .from('rooms')
        .update({
          active: true,
        })
        .match({ id: route.params.chat })
      room.value.active = true
    }
  }
  catch (e) {
    console.error(e)
  }
  isLoadingImage.value = false
}

const previewFile = async (data: UploadFile) => {
  if (!data.data)
    return
  fileData.value = data
  openPreview.value = true
  src.value = data.data
}

const imagePreview = (fileSrc: string | undefined, fileType: string) => {
  if (!fileSrc)
    return
  openImageViewer.value = true
  src.value = fileSrc
  previewFileType.value = fileType
}

const nl2br = (text: string) => {
  if (!text)
    return text
  return text.replace(/\n/ig, '<br>')
}

const back = () => {
  router.go(-1)
}

const getMoreMessages = async (event?: InfiniteScrollCustomEvent) => {
  if (!userId.value || isLoadingMessages.value)
    return
  isLoadingMessages.value = true
  let data: definitions['room_messages'][]
  try {
    const { data: dataTmp, error } = await supabase
      .from<definitions['room_messages']>('room_messages')
      .select(`
          id,
          created_by (
            id,
            first_name,
            last_name,
            image_url,
            role
          ),
          message,
          message_type,
          created_at,
          read_at,
          file_url
        `)
      .match({ room_id: route.params.chat })
      .order('created_at', { ascending: false })
      .range(fetchOffset, fetchOffset + fetchLimit - 1)
    if (error) {
      console.error(error)
      isDisabled.value = true
      return
    }
    data = dataTmp.reverse()
  }
  catch (err) {
    console.error(err)
    isDisabled.value = true
    return
  }
  if (!data || !data.length) {
    console.error('No messages found')
    isDisabled.value = true
    return
  }
  if (data.length) {
    messages.value.unshift(...(data as (definitions['room_messages'] & RoomMessage)[]))
    if (data.length === fetchLimit)
      fetchOffset += fetchLimit
    else
      isDisabled.value = true
  }
  else {
    isDisabled.value = true
  }
  storeUserDetails()
  isLoadingMessages.value = false
  // console.log('isDisabled', isDisabled.value, data.length, 'isLoadingMessages', isLoadingMessages.value)
  if (event)
    event.target.complete()
}

const getRoom = async () => {
  console.log('Get message')
  isLoading.value = true
  const { data, error } = await supabase
    .from<(definitions['rooms'] & Room)>('rooms')
    .select(`
      id,
      archived,
      archived_at,
      created_by (
        id,
        first_name,
        last_name,
        image_url,
        role
      ),
      joined_by ( 
        id,
        first_name,
        last_name,
        image_url,
        role
      ),
      room_subject_id (
        subject
      ),
      active
    `)
    .match({ id: route.params.chat })

  let notArchivedInLast24Hrs = false
  if (data && data[0].archived_at)
    notArchivedInLast24Hrs = new Date().getUTCMilliseconds() - new Date(data[0].archived_at).getUTCMilliseconds() > 24 * 60 * 60 * 1000

  if (!data?.length || error || (data[0].archived && notArchivedInLast24Hrs && !main.professional)) {
    console.error('get room fail, already archived', error, data)
    router.go(-1)
    return
  }
  room.value = data[0]

  let secondUser: definitions['users']
  if (main.professional && data[0].created_by) {
    secondUser = data[0].created_by
  }
  else if (data[0].joined_by) {
    secondUser = data[0].joined_by
  }
  else {
    console.error('get room fail, no joined_by')
    router.go(-1)
    return
  }
  contactInfo.value = {
    id: secondUser.id,
    name: `${secondUser.first_name} ${secondUser.last_name}`,
    role: secondUser.role,
    image_url: secondUser.image_url || '/avatar.svg',
  }

  if (data && !error) {
    archived.value = data[0].archived
    subject.value = data[0].room_subject_id.subject
  }
  storeUserDetails()
  isLoading.value = false
}

const initChat = async () => {
  console.log('initChat')
  if (subscription.value)
    subscription.value.unsubscribe()
  fetchOffset = 0
  isDisabled.value = false
  subscription.value = supabase
    .from<definitions['room_messages'] & RoomMessage>(`room_messages:room_id=eq.${route.params.chat}`)
    .on('INSERT', handleChatUpdate)
    .subscribe()
  await getRoom()
  await getMoreMessages()
  await markAsRead()
  scrollToBottom(0, true)
}

const openProfile = () => {
  const path = !main.professional ? 'prof_profile' : 'profile'
  if (contactInfo.value.id)
    router.push(`/${path}/${contactInfo.value.id}`)
}

watchEffect(async () => {
  userId.value = main?.user?.id
  if (main.path === `/chat/${route.params.chat}`) {
    console.log('Chat page did enter')
    try {
      await initChat()
    }
    catch (e) {
      console.error('initChat fail', e)
    }
  }
  else if (subscription.value) {
    console.log('Chat page will leave')
    subscription.value.unsubscribe()
    subscription.value = undefined
    messages.value.length = 0
  }
})
</script>

<template>
  <ion-page class="ion-page chat-page">
    <IonHeader class="header-custom">
      <IonToolbar class="toolbar-no-border">
        <IonButtons slot="start" class="mx-3">
          <IonButton @click="back">
            <IonIcon :icon="chevronBack" class="text-grey-dark" />
          </IonButton>
        </IonButtons>
        <div class="flex justify-between items-center " @click="openProfile()">
          <div class="flex">
            <div v-if="!isLoadingProfil" class="relative">
              <img :src="contactInfo.image_url || 'https://www.kindpng.com/picc/m/163-1636340_user-avatar-icon-avatar-transparent-user-icon-png.png'" class="h-15 w-15 object-cover bg-grey rounded-xl mr-4">
              <div class="bg-green h-3 w-3 rounded-full absolute top-0 right-3 border border-white" />
              <div class="bg-bright-cerulean-500 h-4 w-4 rounded-tr-lg rounded-bl-xl absolute bottom-0 left-0 text-center text-white text-xs">
                i
              </div>
            </div>
            <div v-else class="relative">
              <div class="h-15 w-15 object-cover bg-grey rounded-xl mr-4">
                <p>Loading...</p>
              </div>
            </div>
            <div v-if="!isLoadingProfil" class="flex flex-col">
              <p class="text-left text-bright-cerulean-500 text-sm font-bold">
                {{ subject }}
              </p>
              <p class="text-left font-bold">
                {{ contactInfo.name }}
              </p>
            </div>
            <div v-else class="flex flex-col justify-center">
              <p>Loading...</p>
            </div>
          </div>
          <IonIcon v-if="!isLoadingProfil && main.professional" :icon="newspaper" class="text-brink-pink-600 text-3xl pr-2" @click.stop="$router.push(`/profile/${contactInfo.id}#notes`)" />
        </div>
      </IonToolbar>
    </IonHeader>
    <IonToast
      :is-open="errorMessage ? true : false"
      :message="errorMessage"
      :duration="2000"
      @did-dismiss="errorMessage = ''"
    />
    <IonContent ref="contentRef" class="ion-padding">
      <IonInfiniteScroll
        :disabled="isDisabled || isLoadingMessages"
        position="top"
        threshold="100px"
        @ion-infinite="getMoreMessages($event)"
      >
        <IonInfiniteScrollContent
          loading-spinner="bubbles"
          :loading-text="t('chat.loading')"
        />
      </IonInfiniteScroll>
      <div v-if="userId" class="chat-list">
        <div
          v-for="message in messages" :key="message.id"
          class="chat-item"
          :class="{ 'chat-item-outgoing': message.created_by.id === userId }"
        >
          <div class="chat-item-inner">
            <div
              v-if="message.created_by.id !== userId"
              class="chat-avatar"
            >
              <img :src="message.created_by.image_url || 'https://www.kindpng.com/picc/m/163-1636340_user-avatar-icon-avatar-transparent-user-icon-png.png'" class="h-10 w-10 object-cover" alt="">
            </div>
            <div class="chat-body">
              <div class="chat-item-bubble" :class="{ 'bubble-image': message.message_type === 'image' }">
                <div v-if="message.message_type === 'text' && message.message" class="chat-text" v-html="nl2br(message.message)" />
                <img v-else-if="message.message_type === 'image' && message.file_url" :src="message.file_url" class="chat-text-img object-cover" alt="" loading="lazy" @click="() => imagePreview(message.file_url, message.message_type)">
                <p v-if="message.message_type === 'file' && message.file_url" class="cursor-pointer chat-text italic font-bold" @click="() => imagePreview(message.file_url, message.message_type)">
                  PDF File
                </p>
              </div>
              <div v-if="message.created_by.id === userId" class="flex justify-between text-xs text-grey items-center">
                {{ dayjs(message.created_at).format('MMM D, ddd hh:mm a') }}
                <div class="flex items-center pl-2">
                  <IonIcon color="success" :icon="checkmarkCircle" />
                  {{ t('chat.sent') }}
                </div>
              </div>
              <div v-else class="flex justify-between text-xs text-grey items-center">
                {{ dayjs(message.created_at).format('MMM D, ddd hh:mm a') }}
              </div>
            </div>
          </div>
        </div>
        <div v-if="isLoadingImage" class="chat-item chat-item-outgoing">
          <div class="chat-item-inner">
            <div class="chat-body">
              <div class="chat-item-bubble bubble-image">
                <img class="chat-text-img object-cover">
              </div>
              <div class="flex justify-between text-xs text-grey items-center">
                {{ dayjs().format('MMM D, ddd hh:mm a') }}
                <div class="flex items-center pl-2">
                  <IonIcon color="warning" :icon="refreshCircle" />
                  {{ t('chat.sending') }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </IonContent>
    <ion-modal :is-open="openPreview">
      <ion-page>
        <ion-header>
          <ion-toolbar>
            <ion-title>File Preview</ion-title>
          </ion-toolbar>
        </ion-header>
        <IonContent class="ion-padding">
          <iframe
            v-if="fileData?.mimeType === 'application/pdf'"
            :src="`/pdfViewer/web/viewer.html?file=${src}`"
            width="100%"
            height="100%"
            style="border: none;"
          />
          <img v-else :src="src" width="100%" height="100%" style="object-fit: cover;width: 100%;height: 100%;">
        </IonContent>
        <ion-footer>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-button :disabled="isLoading" @click="() => openPreview = false">
                {{ t('chat.close') }}
              </ion-button>
            </ion-buttons>
            <ion-buttons v-if="showPreviewUpload" slot="end">
              <ion-button :disabled="isLoading" @click="handleFile">
                {{ t('chat.upload') }}
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-footer>
      </ion-page>
    </ion-modal>
    <ion-modal :is-open="openImageViewer">
      <ion-page>
        <ion-header>
          <ion-toolbar>
            <ion-title>Image</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="() => openImageViewer = false">
                {{ t('chat.close') }}
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <IonContent class="ion-padding">
          <iframe
            v-if="previewFileType === 'file'"
            :src="`/pdfViewer/web/viewer.html?file=${src}`"
            width="100%"
            height="100%"
            style="border: none;"
          />
          <img v-else :src="src" width="100%" height="100%" style="object-fit: contain;width: 100%;height: 100%;">
        </IonContent>
      </ion-page>
    </ion-modal>
    <IonFooter>
      <IonToolbar class="toolbar-no-border">
        <InputWithButton
          :disabled="archived"
          @change="handleSubmitMessage"
          @photo="handleImage"
          @file="previewFile"
        />
      </IonToolbar>
    </IonFooter>
  </ion-page>
</template>

<route lang="yaml">
meta:
  layout: default
</route>
