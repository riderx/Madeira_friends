import { serve } from 'https://deno.land/std@0.139.0/http/server.ts'
import dayjs from 'https://cdn.skypack.dev/dayjs'
import { supabaseAdmin } from '../_utils/supabase.ts'
import type { definitions } from '../_utils/types_supabase.ts'
import { sendOptionsRes, sendRes } from '../_utils/utils.ts'

interface dataDoctor {
  id: string
  userId: string
}

serve(async (event: Request) => {
  console.log('method', event.method)
  if (event.method === 'OPTIONS')
    return sendOptionsRes()
  const supabase = supabaseAdmin
  const authorization = event.headers.get('authorization')
  let isVerified = false
  try {
    const { user, error } = await supabase.auth.api.getUser(
      authorization?.split('Bearer ')[1] || '',
    )
    isVerified = !!user && !error
  }
  catch (error) {
    isVerified = false
    console.error('Auth error', error)
  }
  if (!authorization || !isVerified) {
    console.error('Requires Authorization', authorization, isVerified)
    return sendRes({ message: 'Requires Authorization', authorization }, 400)
  }
  try {
    const body = (await event.json()) as dataDoctor
    const roomId = body.id
    const userId = body.userId
    if (!roomId || !userId)
      return sendRes({ message: 'Requires roomId and userId' }, 400)
    const { data, error } = await supabase
      .rpc('get_active_conversations_count', {
        now: dayjs().toISOString(),
        start_date: dayjs().startOf('day').toISOString(),
        end_date: dayjs().endOf('day').toISOString(),
      })
    if (error)
      return sendRes({ message: error }, 500)

    if (data && data.length > 0) {
      // select random event
      if (data[0].doctor_id === userId)
        return sendRes({ message: 'Cannot assign self' }, 500)
      const { error: ErrorUpdate } = await supabase
        .from('rooms')
        .update({
          joined_at: dayjs().toISOString(),
          joined_by: data[0].doctor_id,
        })
        .match({ id: roomId })
      if (ErrorUpdate)
        return sendRes({ message: error }, 500)
    }
    else {
      // there are no events then assign doctor marked default in user role
      const { data: defaultUser } = await supabase
        .from<definitions['users']>('users')
        .select()
        .match({ role: 'default' })

      if (defaultUser && defaultUser.length) {
        const { error: ErrorUpdate } = await supabase
          .from('rooms')
          .update({
            joined_at: dayjs().toISOString(),
            joined_by: defaultUser[0].id,
          })
          .match({ id: roomId })
        if (ErrorUpdate)
          return sendRes({ message: error }, 500)
      }
      else {
        // there are no doctors, so delete room and return error
        const { error } = await supabase
          .from('rooms')
          .delete()
          .match({ id: roomId })
        return sendRes({ message: `No doctors available ${error}` }, 424)
      }
    }
    return sendRes()
  }
  catch (e) {
    console.error('Error unknow', e)
    return sendRes({
      status: 'Error unknow',
      error: JSON.stringify(e),
    }, 500)
  }
})
