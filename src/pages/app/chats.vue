<script setup lang="ts">
import {
  IonButton, IonButtons, IonContent, IonHeader, IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/vue'
import type { RealtimeSubscription, SupabaseRealtimePayload } from '@supabase/supabase-js'
import { ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import Spinner from '~/components/Spinner.vue'
import { useSupabase } from '~/services/supabase'
import { useMainStore } from '~/stores/main'
import type { definitions } from '~/types/supabase'

const supabase = useSupabase()
const { t } = useI18n()
const main = useMainStore()
const router = useRouter()
const isAlertOpen = ref(false)
const listRef = ref()

interface LastMessage {
  message: string | undefined
  type: string | undefined
  created_at: string | undefined
  created_by: string | undefined
}
interface ItemSlidingCustomEvent extends CustomEvent {
  target: HTMLIonItemSlidingElement
}
interface Chat {
  unread: number
  lastMessage: LastMessage
  messages: definitions['room_messages'][]
  joined_by: definitions['users']
  created_by: definitions['users']
  room_subject_id: definitions['room_subjects']
}
const chatSelector = `id,
      created_at,
      created_by (
        id,
        first_name,
        last_name,
        image_url
      ),
      joined_by (
        id,
        first_name,
        last_name,
        image_url
      ),
      room_subject_id (
        subject
      ),
      active,
      archived,
      archived_at,
      messages:room_messages(
        read_at,
        message,
        message_type,
        created_by,
        created_at
      )`

const chats = ref<(definitions['rooms'] & Chat)[]>([])
const chatUpdateSubsciptions = ref<RealtimeSubscription[]>([])
const chatNewSubsciptions = ref<RealtimeSubscription>()
const isActive = ref(true)
const isLoading = ref(false)

const unread = async (id: string, index: number, event: ItemSlidingCustomEvent) => {
  if (listRef.value)
    listRef.value.$el.closeSlidingItems()
  const { data } = await supabase
    .from<definitions['room_messages']>('room_messages')
    .select('id, read_at')
    .match({ room_id: id })
    .neq('created_by', supabase.auth.user()!.id)
    .order('read_at', { ascending: false })
    .limit(1)
  console.log('unread', data)

  if (data?.length) {
    const { error } = await supabase
      .from('room_messages')
      .update({ read_at: null })
      .match({ id: data[0].id })
    if (!error)
      chats.value[index].unread = 1
  }
}

const retalk = async (id: string, index: number, event: ItemSlidingCustomEvent) => {
  if (listRef.value)
    listRef.value.$el.closeSlidingItems()
  const { error } = await supabase
    .from<definitions['rooms']>('rooms')
    .update({ active: false })
    .match({ id })

  if (!error)
    chats.value[index].active = false
}

const active = async (id: string, index: number, event: ItemSlidingCustomEvent) => {
  if (listRef.value)
    listRef.value.$el.closeSlidingItems()
  const { error } = await supabase
    .from<definitions['rooms']>('rooms')
    .update({ active: true })
    .match({ id })

  if (!error)
    chats.value[index].active = true
}

const archive = async (id: string, index: number, event: ItemSlidingCustomEvent) => {
  if (listRef.value)
    listRef.value.$el.closeSlidingItems()
  const { error } = await supabase
    .from<definitions['rooms']>('rooms')
    .update({ archived: true, archived_at: new Date().toISOString(), active: true })
    .match({ id })

  if (!error)
  // remove chat at index
    chats.value.splice(index, 1)
}

const exitChat = async (id: string, index: number, event: ItemSlidingCustomEvent, exitDocId?: string) => {
  if (listRef.value)
    listRef.value.$el.closeSlidingItems()
  console.log('exitChat', id, exitDocId, index, event)
  if (!exitDocId)
    return
  const resp = await supabase.functions.invoke('assign-diff-doctor',
    {
      body: JSON.stringify({
        id,
        exitDocId,
      }),
      headers: {
        Authorization: supabase.auth.session()?.access_token,
      } as any,
    })
  isAlertOpen.value = false
  if (!resp.error)
    chats.value.splice(index, 1)
  else
    console.error(resp.error)
}

const findChatIndexFromId = (id: String) => {
  for (let i = 0; i < chats.value.length; i++) {
    if (chats.value[i].id === id)
      return i
  }

  return -1
}

const handleMessageUpdate = (newData: SupabaseRealtimePayload<definitions['room_messages']>) => {
  if (!newData?.new.room_id)
    return
  const index = findChatIndexFromId(newData.new.room_id.toString())
  chats.value[index].lastMessage = { message: newData.new.message, type: newData.new.message_type, created_at: newData.new.created_at, created_by: newData.new.created_by }
  chats.value[index].unread++

  // to reorder chats based -> new one should come on top
  const splicedChat = chats.value.splice(index, 1)
  chats.value = [...splicedChat, ...chats.value]
}

const handleRoomUpdate = (index: number, newData: SupabaseRealtimePayload<definitions['rooms']>) => {
  if ((newData.new.active || !newData.old.archived) && (!newData.new.active || newData.new.archived))
    chats.value.splice(index, 1)

  else if (newData.new.active && !newData.old.active)
    window.location.reload()
}

const subcribeOneChat = (id: string, index: number) => {
  chatUpdateSubsciptions.value.push(
    supabase
      .from(`room_messages:room_id=eq.${id}`)
      .on('INSERT', data => handleMessageUpdate(data))
      .subscribe(),
  )
}

const subscribeOneRoom = (id: string, index: number) => {
  chatUpdateSubsciptions.value.push(
    supabase
      .from(`rooms:id=eq.${id}`)
      .on('UPDATE', data => handleRoomUpdate(index, data))
      .subscribe(),
  )
}

const unsubscribeAllChats = () => {
  for (const subsciption of chatUpdateSubsciptions.value)
    subsciption.unsubscribe()
}

const subscribeAllChats = () => {
  for (let i = 0; i < chats.value.length; i++) {
    subcribeOneChat(chats.value[i].id, i)
    if (!main.professional)
      subscribeOneRoom(chats.value[i].id, i)
  }
}

const handleAddRoom = async (newData: SupabaseRealtimePayload<definitions['rooms']>) => {
  if (chats.value.find(chat => chat.id === newData.old.id))
    return
  if (newData.old.joined_by)
    return
  const { data, error } = await supabase
    .from<(definitions['rooms'] & Chat)>('rooms')
    .select(chatSelector)
    .match({ id: newData.new.id })
    .limit(1, { foreignTable: 'room_messages' })
  if (!error && data?.length)
    chats.value.unshift(data[0])
  await unsubscribeAllChats()
  await subscribeAllChats()
}

const subscribeNewChat = () => {
  chatNewSubsciptions.value = supabase
    .from(`rooms:joined_by=eq.${supabase.auth.user()!.id}`)
    .on('UPDATE', handleAddRoom)
    .subscribe()
}

const getUnactiveCount = () => {
  let total = 0
  for (const chat of chats.value)
    total += chat.active ? 0 : 1
  return total
}

const getUnreadCount = async () => {
  for (const chat of chats.value) {
    supabase
      .from('room_messages')
      .select(`
      read_at
    `, { count: 'exact', head: false })
      .match({ room_id: chat.id })
      .is('read_at', null)
      .neq('created_by', supabase.auth.user()!.id)
      .then(({ data, error, count }) => {
        if (data && !error)
          chat.unread = count || 0
      })
  }
}

const getLastMessage = (data: (definitions['rooms'] & Chat)[]) => {
  for (const room of data) {
    for (let i = 0; i < room.messages.length; i++) {
      if (i === 0)
        room.lastMessage = { message: room.messages[i].message, type: room.messages[i].message_type, created_at: room.messages[i].created_at, created_by: room.messages[i].created_by }
    }
  }
  data.sort((a, b) => {
    return new Date(b.lastMessage?.created_at || b.created_at).valueOf() - new Date(a.lastMessage?.created_at || a.created_at).valueOf()
  })
  return data
}

const getImage = (chat: (definitions['rooms'] & Chat)) => !main.professional && chat.joined_by?.image_url
  ? chat.joined_by.image_url
  : main.professional && chat.created_by.image_url
    ? chat.created_by.image_url
    : 'https://www.kindpng.com/picc/m/163-1636340_user-avatar-icon-avatar-transparent-user-icon-png.png'

watchEffect(async () => {
  if (main.path === '/app/chats' && main.user) {
    const twentyfourHoursAgo = new Date(new Date().getTime() - (24 * 60 * 60 * 1000)).toISOString()
    isLoading.value = true
    let req = `and(active.eq.true,created_by.eq.${main.user.id},or(archived.eq.false,and(archived.eq.true,archived_at.gte.${twentyfourHoursAgo})))`
    if (main.professional)
      req = `and(joined_by.eq.${main.user.id},archived.eq.false)`
    const { data, error } = await supabase
      .from<(definitions['rooms'] & Chat)>('rooms')
      .select(chatSelector)
      .or(req)
      .order('created_at', { ascending: false, foreignTable: 'room_messages' })
      .limit(1, { foreignTable: 'room_messages' })
    isLoading.value = false

    if (data && data.length > 0 && !error) {
      chats.value = getLastMessage(data)
      await getUnreadCount()
      subscribeAllChats()
      subscribeNewChat()
    }
    else {
      chats.value = []
      console.error(error)
    }
  }
  else {
    console.log('removing subs')
    for (const subsciption of chatUpdateSubsciptions.value)
      subsciption.unsubscribe()
    if (chatNewSubsciptions.value)
      chatNewSubsciptions.value.unsubscribe()
    chats.value = []
  }
})
// TODO to show modal only one time use localStorage to check if "onboardingVideo" is set
// if (!localStorage.getItem('onboardingVideo')) {
//  localStorage.setItem('onboardingVideo', 'true')
//  show ionic alert to let the user choose if he wants to see the onboarding video or not
// }
</script>

<template>
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle slot="start" size="large">
          {{ t('chats.heading') }}
        </IonTitle>
        <IonButtons v-if="!main.professional" slot="end" class="pr-4" @click="router.push('/newchat')">
          <img src="/new_chat.png" class="w-6 py-4">
        </IonButtons>
      </IonToolbar>
      <IonToolbar v-if="main.professional">
        <IonSegment :value="isActive" @ion-change="isActive = !isActive">
          <IonSegmentButton value="true">
            <IonLabel class="py-2">
              {{ t('chats.active') }}
            </IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="false">
            <IonLabel class="py-2 px-3 flex items-center">
              {{ t('chats.inactive') }}
              <div v-if="getUnactiveCount()" class="ml-1 flex items-center justify-center rounded-full h-3 w-3 text-white bg-brink-pink-500 py-auto text-center">
                <p class="!text-[0.5rem] p-1">
                  {{ getUnactiveCount() }}
                </p>
              </div>
            </IonLabel>
          </IonSegmentButton>
        </IonSegment>
      </IonToolbar>
    </IonHeader>
    <IonContent :fullscreen="true">
      <IonHeader collapse="condense">
        <IonToolbar>
          <IonTitle size="large">
            {{ t('chats.heading') }}
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <div v-if="isLoading" class="grid justify-center">
        <Spinner />
      </div>

      <ion-list v-else ref="listRef">
        <template v-for="(chat, index) in chats" :key="index">
          <IonItemSliding v-if="(chat.active === isActive && main.professional) || !main.professional">
            <IonItem :class="{ archived: chat.archived }" @click="$router.push(`/chat/${chat.id}`)">
              <div slot="start" class="col-span-2 relative py-4">
                <img :src="getImage(chat)" alt="user" class="rounded-xl h-15 w-15 object-cover">
                <div v-if="chat.active && !chat.archived" class="bg-vista-blue-500 absolute border border-white border-2 top-2 -right-1 rounded-full h-5 w-5 z-10" />
              </div>
              <IonLabel>
                <div class="col-span-6 flex flex-col">
                  <div class="flex justify-between items-center">
                    <h2 class="text-sm text-bright-cerulean-500">
                      {{ chat.room_subject_id.subject }}
                    </h2>
                    <!-- <p>{{ chat.date }}</p> -->
                  </div>
                  <div class="flex justify-between items-center">
                    <h3 class="text-true-gray-800 py-1 font-bold">
                      {{
                        !main.professional && chat.joined_by
                          ? `${chat.joined_by.first_name} ${chat.joined_by.last_name}`
                          : chat.created_by
                            ? `${chat.created_by.first_name} ${chat.created_by.last_name}`
                            : 'Unknown'
                      }}
                    </h3>
                    <div v-if="chat.unread > 0" class="flex items-center justify-center rounded-full h-5 w-5 text-white bg-brink-pink-500 py-auto text-center">
                      <p class="text-xs p-1">
                        {{ chat.unread }}
                      </p>
                    </div>
                  </div>
                  <p v-if="chat.lastMessage && chat.lastMessage.type === 'text'" class="text-xs text-true-gray-400 truncate font-black-light">
                    {{ chat.lastMessage.message }}
                  </p>
                  <p v-else-if="chat.lastMessage && chat.lastMessage.type === 'image'" class="text-xs text-true-gray-400 truncate font-black-light italic">
                    Picture
                  </p>
                  <p v-else-if="chat.lastMessage && chat.lastMessage.type === 'file'" class="text-xs text-true-gray-400 truncate font-black-light italic">
                    File
                  </p>
                  <p v-else class="text-xs truncate font-grey italic">
                    {{ t('chats.no_chat') }}
                  </p>
                </div>
              </IonLabel>
            </IonItem>
            <IonItemOptions side="end">
              <IonItemOption v-if="main.professional && chat.active" color="warning" @click="retalk(chat.id, index, $event as any)">
                {{ t('chats.inactive') }}
              </IonItemOption>
              <IonItemOption v-else-if="main.professional && !chat.active" @click="active(chat.id, index, $event as any)">
                {{ t('chats.active') }}
              </IonItemOption>
              <IonItemOption v-if="main.professional" color="danger" @click="archive(chat.id, index, $event as any)">
                {{ t('chats.archive') }}
              </IonItemOption>
              <IonItemOption v-if="!main.professional && chat.unread === 0 && chat.lastMessage?.created_by !== main.user?.id" color="warning" @click="unread(chat.id, index, $event as any)">
                {{ t('chats.unread') }}
              </IonItemOption>
              <IonItemOption v-if="main.professional" color="secondary" @click="exitChat(chat.id, index, $event as any, main.user?.id)">
                {{ t('chats.leave') }}
              </IonItemOption>
            </IonItemOptions>
          </IonItemSliding>
        </template>
        <IonItem v-if="!chats.length">
          <IonLabel class="ion-text-wrap">
            <div class="col-span-6 flex flex-col">
              <div class="flex justify-between items-center">
                <h2 class="text-sm text-bright-cerulean-500">
                  {{ t('chats.no_chat') }}
                </h2>
              </div>
              <IonButton
                v-if="!main.professional"
                color="pink"
                shape="round"
                size="default"
                class="ion-margin-top mx-auto font-semibold mt-8"
                @click="router.push('/newchat')"
              >
                <span v-if="!isLoading" class="rounded-4xl">
                  {{ t('chats.ask') }}
                </span>
                <IonSpinner v-else name="crescent" color="light" />
              </IonButton>
              <img src="../../../resources/naissance 1.png" alt="">
              <div v-if="!main.professional" class="mt-2">
                <h2 class="text-sm text-center dark:text-white text-black">
                  {{ t('chat.dont-doubt') }}
                </h2>
                <h2 class="text-sm text-center pt-4 dark:text-white text-black">
                  {{ t('chat.to_continue_chat') }} <a class="text-bright-cerulean-500" href="/payment">{{ t('chat.subs') }}</a>.
                </h2>
              </div>
            </div>
          </IonLabel>
        </IonItem>
      </ion-list>
    </IonContent>
  </IonPage>
</template>

<style scoped>
ion-item.archived {
  --ion-item-background: #ddd;
    @media (prefers-color-scheme: dark) {
    --ion-item-background: #333;
    }
}
</style>

<route lang="yaml">
meta:
  option: tabs
</route>
