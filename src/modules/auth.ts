import type { definitions } from '~/types/supabase'
import type { UserModule } from '~/types'
import { useMainStore } from '~/stores/main'
import { useSupabase } from '~/services/supabase'

const guard = async (next: any, to: string, from: string) => {
  const supabase = useSupabase()
  const auth = supabase.auth.user()
  // console.log('auth', auth)
  const main = useMainStore()

  if (auth && !main.auth) {
    main.auth = auth
    const lastSignInAt = new Date(Date.parse(auth.last_sign_in_at || ''))
    lastSignInAt.setDate(lastSignInAt.getDate() + 30)
    if (!main.user) {
      try {
        const { data, error } = await supabase
          .from<definitions['users']>('users')
          .select(`
        id,
        city,
        country,
        role,
        image_url,
        last_name,
        first_name,
        enableNotifications,
        optForNewsletters,
        legalAccepted,
        image_url
      `)
          .eq('id', auth?.id)
          .single()
        if (!error && data) { main.user = data }
        else {
          console.log('error', error)
          await main.logout()
          next('/login')
        }
      }
      catch (error) {
        console.log('error', error)
      }
    }

    if (!auth.user_metadata?.isPhoneVerified && !to.includes('/onboarding') && !from.includes('/onboarding'))
      next('/onboarding/phone_code')
    else if ((!auth.user_metadata?.activation?.formFilled || !main.user?.legalAccepted) && !to.includes('/onboarding') && !from.includes('/onboarding'))
      next('/onboarding/activation')
    else next()
  }
  else if (from !== 'login' && !auth) {
    main.auth = null
    next('/login')
  }
  else { next() }
}

// // vueuse/head https://github.com/vueuse/head
export const install: UserModule = ({ router }) => {
  router.beforeEach(async (to, from, next) => {
    if (to.meta.middleware)
      await guard(next, to.path, from.path)
    else
      next()
  })
}
