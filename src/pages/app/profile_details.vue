<script setup lang="ts">
import dayjs from 'dayjs'
import {
  IonButton,
  IonContent,
  IonDatetime,
  IonInput,
  IonModal,
  IonPage,
  IonSpinner,
  IonTextarea,
} from '@ionic/vue'
import { useVuelidate } from '@vuelidate/core'
import { email, required } from '@vuelidate/validators'
import { useI18n } from 'vue-i18n'
import { computed, reactive, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { VueTelInput } from 'vue-tel-input'
import 'vue-tel-input/dist/vue-tel-input.css'
import { useSupabase } from '~/services/supabase'
import TitleHead from '~/components/TitleHead.vue'
import { useMainStore } from '~/stores/main'
import type { definitions } from '~/types/supabase'

const router = useRouter()
const main = useMainStore()
const { t } = useI18n()
const supabase = useSupabase()

const form = reactive({
  first_name: '',
  last_name: '',
  phone: main.auth?.user_metadata.phone,
  email: main.auth?.user_metadata.email,
  dob: '',
  bio: '',
  country: '',
  city: '',
  job: '',
})

const isLoading = ref(false)
const errorMessage = ref('')
const isOpenRef = ref(false)
const isOpen1Ref = ref(false)
const humanizedDob = ref('')

const rules = computed(() => ({
  first_name: { required },
  last_name: { required },
  phone: { required },
  email: { required, email },
}))

const v$ = useVuelidate(rules, form)

const cancel = () => {
  console.log('close')
  isOpenRef.value = false
}
const submit = async () => {
  isLoading.value = true
  const isFormCorrect = await v$.value.$validate()
  if (!isFormCorrect)
    isLoading.value = false

  const updateData: Partial<definitions['users']> = {
    first_name: form.first_name,
    last_name: form.last_name,
    dob: form.dob,
    city: form.city,
    country: form.country,
  }

  if (main.auth) {
    const tableData: definitions['public_details'] = {
      id: main.auth.id,
      bio: form.bio,
      first_name: form.first_name,
      last_name: form.last_name,
      image_url: main.user?.image_url,
      role: main.user?.role || 'user',
      city: form.city,
      country: form.country,
    }
    await supabase
      .from('public_details')
      .upsert(
        tableData,
      )
  }

  const { data: usr, error: dbError } = await supabase
    .from<definitions['users']>('users')
    .update(updateData)
    .match({ id: main.auth?.id })

  if (dbError || !usr || usr.length === 0) {
    errorMessage.value = dbError?.message || 'Unknow'
    isLoading.value = false
    return
  }
  main.user = usr[0]
  router.go(-1)
  isLoading.value = false
}
watchEffect(async () => {
  if (main.path === '/app/profile_details') {
    if (main.auth) {
      const { data } = await supabase
        .from<definitions['public_details']>('public_details')
        .select(`
        bio
      `)
        .match({ id: main.auth.id })
      if (data && data.length)
        form.bio = data[0].bio || ''
    }
    const { data: usr } = await supabase
      .from<definitions['users']>('users')
      .select(`
        id,
        first_name,
        last_name,
        city,
        country,
        dob,
        email
      `)
      .match({ id: main.auth?.id })
    if (usr && usr.length) {
      console.log('usr', usr[0])
      form.email = usr[0].email || ''
      form.city = usr[0].city || ''
      form.country = usr[0].country || ''
      form.first_name = usr[0].first_name
      form.last_name = usr[0].last_name
      form.dob = usr[0].dob || ''
    }
  }
})
</script>

<template>
  <IonPage>
    <IonContent :fullscreen="true" class="w-full">
      <div class="grid mx-auto w-full lg:w-1/2 p-8">
        <TitleHead :big="false" :title="t('account.personalInformation')" />
        <form
          class="mt-12 w-full"
          @submit.prevent="submit"
        >
          <p v-if="errorMessage" class="text-sweet-pink-900 text-xs italic mt-2 mb-4">
            {{ errorMessage }}
          </p>
          <div class="w-full grid item-center">
            <div class="py-1">
              <IonInput
                v-model="form.first_name"
                :disabled="isLoading"
                required
                class="z-0 text-left border-b-2 ion-padding-start"
                :placeholder="t('accountProfile.first-name')"
                type="text"
              />

              <div v-for="(error, index) of v$.first_name.$errors" :key="index">
                <p class="text-sweet-pink-900 text-xs italic mt-2 mb-4">
                  {{ t('accountProfile.first-name') }}: {{ error.$message }}
                </p>
              </div>
            </div>
            <div class="py-1">
              <IonInput
                v-model="form.last_name"
                :disabled="isLoading"
                required
                class="z-0 text-left border-b-2 ion-padding-start"
                :placeholder="t('accountProfile.last-name')"
                type="text"
              />
              <div v-for="(error, index) of v$.last_name.$errors" :key="index">
                <p class="text-sweet-pink-900 text-xs italic mt-2 mb-4">
                  {{ t('accountProfile.last-name') }}: {{ error.$message }}
                </p>
              </div>
            </div>
            <div class="py-1">
              <VueTelInput
                v-model="form.phone"
                style="
                  border-top:none;
                  border-left:none;
                  border-right: none;
                  border-radius: 0;
                  box-shadow: none;
                  border-bottom: 2px solid #e5e7eb;
                  color: rgba(0,0,0,0.4)
                "
                disabled
                default-country="fr"
                :placeholder="t('accountProfile.phone')"
                class="px-1 py-2 border-b-2 focus:border-current"
                mode="international"
                :input-options="{ required: true, mode: 'international', showDialCode: true }"
              />
              <div v-for="(error, index) of v$.phone.$errors" :key="index">
                <p class="text-sweet-pink-900 text-xs italic mt-2 mb-4">
                  {{ t('accountProfile.phone') }}: {{ error.$message }}
                </p>
              </div>
            </div>
            <div class="py-1">
              <IonInput
                v-model="form.email"
                required
                disabled
                inputmode="email"
                class="text-left border-b-2 z-0 ion-padding-start"
                :placeholder="t('accountProfile.email')"
                type="email"
              />
              <div v-for="(error, index) of v$.email.$errors" :key="index">
                <p class="text-sweet-pink-900 text-xs italic mt-2 mb-4">
                  {{ t('accountProfile.email') }}: {{ error.$message }}
                </p>
              </div>
            </div>
            <div class="py-1" @click="isOpen1Ref = !isOpen1Ref">
              <IonInput
                :value="humanizedDob"
                required
                class="text-left border-b-2 z-0 ion-padding-start"
                :placeholder="t('accountProfile.dob')"
                type="text"
              />
              <ion-modal :is-open="isOpen1Ref" @did-dismiss="cancel()">
                <IonContent force-overscroll="false">
                  <ion-datetime
                    :value="form.dob"
                    presentation="date"
                    style="--ion-color-primary: #F46E71; --ion-color-primary-shade: #d76163; "
                    @ion-change="(ev: any) => { form.dob = ev.detail.value; isOpen1Ref = !isOpen1Ref; humanizedDob = dayjs(form.dob).format('DD/MM/YYYY') }"
                  />
                </IonContent>
              </ion-modal>
            </div>
            <div class="py-1">
              <IonTextarea v-model="form.bio" :placeholder="t('accountProfile.description')" class="text-left pl-3 border-b-2 z-0" />
            </div>
            <div class="py-1">
              <IonInput
                v-model="form.country"
                :disabled="isLoading"
                required
                class="text-left border-b-2 z-0 ion-padding-start"
                :placeholder="t('accountProfile.country')"
                type="text"
              />
            </div>
            <div class="py-1">
              <IonInput
                v-model="form.city"
                :disabled="isLoading"
                required
                class="text-left border-b-2 z-0 ion-padding-start"
                :placeholder="t('accountProfile.city')"
                type="text"
              />
            </div>

            <div class="py-1 mt-2">
              <IonInput
                v-model="form.job"
                disabled="true"
                required
                inputmode="numeric"
                class="text-left border-b-2 z-0 ion-padding-start"
                :placeholder="t('accountProfile.job')"
                type="text"
              />
            </div>

            <IonButton
              :disabled="isLoading"
              type="submit"
              color="secondary"
              shape="round"
              class="ion-margin-top w-45 mx-auto font-semibold mt-8"
            >
              <span v-if="!isLoading" class="rounded-4xl">
                {{ t('accountProfile.update') }}
              </span>
              <IonSpinner v-else name="crescent" color="light" />
            </IonButton>
          </div>
        </form>
      </div>
    </IonContent>
  </IonPage>
</template>

<style scoped>
ion-datetime {
    height: auto;
    width: auto;

    max-width: 350px;
  }
  ion-modal {
    --width: 290px;
    --height: 382px;
    --border-radius: 8px;
  }

  ion-modal ion-datetime {
    height: 382px;
  }
</style>
