import { serve } from 'https://deno.land/std@0.139.0/http/server.ts'
import { sendNotification } from '../_utils/notif.ts'
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
    const body = (await event.json()) as { record: definitions['room_messages'] }
    const record = body.record
    const senderId = record.created_by
    const message = record.message || ''
    const fileMode = !!record.file_url
    const roomId = record.room_id
    const { data: sender, error: errorSender } = await supabase
      .from<definitions['users']>('users')
      .select()
      .match({ id: senderId })
    if (errorSender || !sender?.length) {
      console.error('Fail to get sender', senderId)
      return sendRes({ message: 'Fail to get sender' }, 400)
    }

    const title = `Message de ${sender[0].first_name} ${sender[0].last_name}`
    const { data, error } = await supabase
      .from<definitions['rooms']>('rooms')
      .select()
      .match({ id: roomId })

    if (error || !data?.length) {
      console.error('Room not found', roomId)
      return sendRes({ message: 'Room not found' }, 500)
    }

    //  find out receiver's UUID
    const receiver = data[0].created_by === senderId ? data[0].joined_by : data[0].created_by
    if (!receiver) {
      console.error('Fail to get receiver', data)
      return sendRes({ message: 'Fail to get receiver' }, 400)
    }
    try {
      await sendNotification(receiver, title, fileMode ? 'Fichier' : message, `/chat/${roomId}`, sender[0].image_url ? sender[0].image_url : undefined)
    }
    catch (err) {
      console.error('Error sending notification', err)
      return sendRes({ message: err }, 500)
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
