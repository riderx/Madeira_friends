import { serve } from 'https://deno.land/std@0.139.0/http/server.ts'
import { supabaseAdmin } from '../_utils/supabase.ts'
import type { definitions } from '../_utils/types_supabase.ts'
import { sendRes } from '../_utils/utils.ts'

serve(async (event: Request) => {
  const supabase = supabaseAdmin
  const API_SECRET = Deno.env.get('API_SECRET')
  const authorizationSecret = event.headers.get('apisecret')
  if (!authorizationSecret)
    return sendRes({ status: 'Cannot find authorization secret' }, 400)
  if (!authorizationSecret || !API_SECRET || authorizationSecret !== API_SECRET) {
    console.error('Fail Authorization')
    return sendRes({ message: 'Fail Authorization' }, 400)
  }
  try {
    const body = (await event.json()) as { record: definitions['notification_token'] }
    const record = body.record
    const token = record.token
    const { data: tokens, error: errorSender } = await supabase
      .from<definitions['notification_token']>('notification_token')
      .select()
      .match({ token })
    if (errorSender || !tokens?.length) {
      console.error('Fail to get token', token)
      return sendRes({ message: 'Fail to get token' }, 400)
    }
    // loop on all tokens and remove allbut not the received one
    for (const token of tokens) {
      if (token.id !== record.id) {
        try {
          await supabase
            .from<definitions['notification_token']>('notification_token')
            .delete()
            .match({ id: token.id })
        }
        catch (err) {
          console.error('Error deleting token', err)
        }
      }
    }
    return sendRes()
  }
  catch (e) {
    return sendRes({
      status: 'Error unknow',
      error: JSON.stringify(e),
    }, 500)
  }
})
