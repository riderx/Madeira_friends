<script setup lang="ts">
import { IonContent, IonPage } from '@ionic/vue'
import dayjs from 'dayjs'
import { ref, watchEffect } from 'vue'
import type { EventReadyChanged } from 'vue-cal'
import { useRoute } from 'vue-router'
import VueCal from 'vue-cal'
import 'vue-cal/dist/vuecal.css'
import { useSupabase } from '~/services/supabase'
import type { definitions } from '~/types/supabase'
import Spinner from '~/components/Spinner.vue'

interface Event {
  doctor: definitions['users']
}
interface Calendar {
  start: Date
  end: Date
  title: string
  class: string
}

const isLoading = ref(true)
const selectedDate = dayjs().format('YYYY-MM-DD')
const supabase = useSupabase()
const events = ref<Calendar[]>([] as Calendar[])

const route = useRoute()

const colorClasses = [
  'red',
  'orange',
  'yellow',
  'green',
  'cyan',
  'blue',
  'purple',
  'pink',
]

const getEvents = async (endDate: string, startDate: string) => {
  const { data } = await supabase
    .from<definitions['events'] & Event>('events')
    .select(`
        id,
        start_date_time,
        end_date_time,
        title
      `)
    .lte('end_date_time', endDate)
    .gte('start_date_time', startDate)

  if (data) {
    events.value = data.map((value, index) => {
      const bgColor = colorClasses[index] // assuming that there won't be more than 8 events per day initially
      const obj = {
        start: dayjs(value.start_date_time).toDate(),
        end: dayjs(value.end_date_time).toDate(),
        title: value.title,
        class: bgColor,
      }
      return obj
    })
  }
}
const changeView = async (event: EventReadyChanged) => {
  console.log('changeView', event)
  const endDate = dayjs(event.endDate).toISOString()
  const startDate = dayjs(event.startDate).toISOString()
  await getEvents(endDate, startDate)
}
const openEvent = (event, e) => {
  console.log('event', event)
  // Prevent navigating to narrower view (default vue-cal behavior).
  e.stopPropagation()
}

watchEffect(async () => {
  if (route.path === '/app/calendar') {
    isLoading.value = true
    await getEvents(dayjs().endOf('month').toISOString(), dayjs().startOf('month').toISOString())
    isLoading.value = false
  }
})
</script>

<template>
  <IonPage>
    <IonContent :fullscreen="true">
      <section v-if="isLoading" class="flex justify-center">
        <Spinner />
      </section>
      <div v-else id="container" class="py-8 bg-transparentw-full h-full min-h-screen">
        <VueCal
          xsmall
          :selected-date="selectedDate"
          :time-from="8 * 60"
          :disable-views="['years', 'year', 'day']"
          active-view="month"
          :on-event-click="openEvent"
          events-on-month-view="short"
          :events="events"
          style="height: 670px"
          @view-change="changeView"
        />
      </div>
    </IonContent>
  </IonPage>
</template>

<style>
.vuecal__menu::before {
      content: "Calendar";
      margin-top: auto;
      margin-bottom: auto;
      margin-right: 2em;
      font-size: 25px;
      font-weight: 700;
}
.vuecal__title-bar {
  background-color: white;
    @media (prefers-color-scheme: dark) {
    background-color: black;
  }
}

.vuecal__no-event {
  color: transparent;
}
.vuecal__heading{
  background-color: #2AB6CD; color: white;
}

.vuecal--month-view .vuecal__cell {height: 80px;}

.vuecal--month-view .vuecal__cell-content {
  justify-content: flex-start;
  height: 100%;
  align-items: flex-end;
}
.vuecal__menu, .vuecal__cell-events-count {
  background-color: white;
  @media (prefers-color-scheme: dark) {
    background-color: black;
  }
  margin-top: 2em;
  margin-bottom: 2em;
}

.vuecal--month-view .vuecal__cell-date {padding: 4px;}
.vuecal--month-view .vuecal__no-event {display: none;}

.vuecal__event{
  border-radius: 5px;
}
.vuecal__event-title {
  font-size: 10px;
  margin-top: 2px;
}
.vuecal__event-time {
  display: none;
}

.red {
  background-color: #ef4444;
}

.orange {
  background-color: #fb923c;
}

.yellow {
  background-color: #fde047;
}

.green {
  background-color: #a3e635;
}

.cyan  {
  background-color: #67e8f9;
}

.blue {
  background-color: #2563eb;
}

.purple {
  background-color: #c084fc;
}

.pink {
  background-color: #f472b6;
}

/* .gyneco{
  background-color: rgb(64, 185, 185) !important;
}
.general{
  background-color: rgb(152, 211, 96) !important;
}
.pediatre{
  background-color: rgb(236, 186, 194) !important;
} */
</style>

<route lang="yaml">
meta:
  option: tabs
</route>
