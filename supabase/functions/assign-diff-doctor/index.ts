import { serve } from 'https://deno.land/std@0.139.0/http/server.ts'
import dayjs from 'https://cdn.skypack.dev/dayjs'
import { supabaseAdmin } from '../_utils/supabase.ts'
import type { definitions } from '../_utils/types_supabase.ts'
import { sendOptionsRes, sendRes } from '../_utils/utils.ts'
import { sendNotification } from '../_utils/notif.ts'

interface dataDoctor {
  id: string
  exitDocId: string
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
    console.error(error)
  }
  if (!authorization || !isVerified) {
    console.error('Requires Authorization', authorization, isVerified)
    return sendRes({ message: 'Requires Authorization' }, 400)
  }
  try {
    const body = (await event.json()) as dataDoctor
    const roomId = body.id
    const exitDocId = body.exitDocId
    const { data, error } = await supabase
      .rpc('get_active_conversations_count', {
        now: dayjs().toISOString(),
        start_date: dayjs().startOf('day').toISOString(),
        end_date: dayjs().endOf('day').toISOString(),
      })
    if (error)
      return sendRes({ message: error }, 500)

    // filter out events where doctor is the exiting doctor
    let filtered = []
    if (data && data.length)
      filtered = data.filter(event => event.doctor_id !== exitDocId)
    if (filtered && filtered.length > 0) {
      const { error: ErrorUpdate } = await supabase
        .from<definitions['rooms']>('rooms')
        .update({
          joined_at: dayjs().toISOString(),
          joined_by: filtered[0].doctor_id,
        })
        .match({ id: roomId })
      if (ErrorUpdate)
        return sendRes({ message: 'Error updating chat' }, 500)

      await sendNotification(filtered[0].doctor_id, 'Reassigned', 'You have been assigned a new patient', `/chat/${roomId}`)
    }
    else {
    // there are no events then assign doctor marked default in user role
      const { data } = await supabase
        .from('users')
        .select()
        .match({ role: 'default' })

      if (data && data.length) {
        const { error: ErrorUpdate } = await supabase
          .from<definitions['rooms']>('rooms')
          .update({
            joined_at: dayjs().toISOString(),
            joined_by: data[0].id,
          })
          .match({ id: roomId })
        if (ErrorUpdate)
          return sendRes({ message: 'Error updating chat' }, 500)

        await sendNotification(data[0].doctor_id, 'Reassigned', 'You have been assigned a new patient', `/chat/${roomId}`)
      }
      else {
      // there are no doctors, so delete room and return error
        const { error } = await supabase
          .from('rooms')
          .delete()
          .match({ id: roomId })
        return sendRes({ message: `No doctors available ${error?.message}` }, 424)
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
