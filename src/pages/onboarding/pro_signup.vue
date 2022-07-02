<script setup lang="ts">
import type { User } from '@supabase/gotrue-js'
import { ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSupabase } from '~/services/supabase'
import Spinner from '~/components/Spinner.vue'
import type { definitions } from '~/types/supabase'

const supabase = useSupabase()
const router = useRouter()
const route = useRoute()

const user = ref<User | null>(null)

const updateDb = async () => {
  let session = null

  if (!route.hash) {
    router.push('/login')
    return
  }
  const queryString = route.hash.replace('#', '')
  const urlParams = new URLSearchParams(queryString)
  const refresh_token = urlParams.get('refresh_token')
  if (!refresh_token) {
    router.push('/login')
    return
  }
  const logSession = await supabase.auth.signIn({
    refreshToken: refresh_token || '',
  })
  if (logSession.session)
    session = logSession.session
  if (logSession.user)
    user.value = logSession.user

  await supabase.auth.update({
    data: {
      needPasswordChange: true,
    },
  })
  const { error } = await supabase
    .from<definitions['users']>('users')
    .insert(
      {
        id: user.value?.id,
        first_name: user.value?.user_metadata.first_name,
        last_name: user.value?.user_metadata.last_name,
        email: user.value?.email,
        role: 'doctor',
      },
    )
  const { error: error2 } = await supabase
    .from<definitions['public_details']>('public_details')
    .insert(
      {
        id: user.value?.id,
        description: '',
        specialisation: session?.user?.user_metadata.job || '',
        first_name: user.value?.user_metadata.first_name,
        last_name: user.value?.user_metadata.last_name,
        image_url: '',
      },
    )
  if (!error && !error2)
    router.push('/onboarding/first_password')
}

watchEffect(() => {
  if (route && route.path === '/onboarding/pro_signup') {
    setTimeout(async () => {
      await updateDb()
    }, 500)
  }
})
</script>

<template>
  <section class="flex justify-center">
    <Spinner />
  </section>
</template>
