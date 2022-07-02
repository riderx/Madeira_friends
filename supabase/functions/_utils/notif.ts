import { GoogleAPI } from 'https://deno.land/x/google_deno_integration/mod.ts'
import type { definitions } from '../_utils/types_supabase.ts'
import { supabaseAdmin } from '../_utils/supabase.ts'

const sendRequestFirebase = (token: string, totalUnread: number, title: string, body: string, link = '', imageUrl?: string | undefined) => {
  const key = Deno.env.get('FIREBASE_PRIVATE_KEY') || ''
  const email = Deno.env.get('FIREBASE_SERVICE_EMAIL') || ''
  const project = Deno.env.get('FIREBASE_PROJECT') || ''
  const api = new GoogleAPI({
    email,
    scope: [
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/firebase.messaging',
    ],
    key: `-----BEGIN PRIVATE KEY-----${key}-----END PRIVATE KEY-----`,
  })
  const payload = {
    message: {
      notification: {
        title,
        body,
      },
      android: {
        priority: 'HIGH',
        notification: {
          image: imageUrl,
          color: '#f46e71',
          sound: 'default',
          default_sound: true,
          default_light_settings: true,
          default_vibrate_timings: true,
        },
      },
      webpush: {
        headers: {
          Urgency: 'high',
        },
        notification: {
          image: imageUrl,
        },
        fcmOptions: {
          link: `${Deno.env.get('BASE_URL')}${link}`,
        },
      },
      data: {
        link: link || '/',
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
        payload: {
          aps: {
            'sound': 'default',
            'mutable-content': 1,
            'badge': totalUnread,
          },
        },
        fcmOptions: {
          image: imageUrl,
        },
      },
      token,
    },
  }
  return api.post(`https://fcm.googleapis.com/v1/projects/${project}/messages:send`, payload)
}

export async function sendNotification(receiver: string, title: string, body: string, link = '', imageUrl?: string | undefined) {
  const supabase = supabaseAdmin
  try {
    const { data: receiverData, error: errorReceiver } = await supabase
      .from<definitions['users']>('users')
      .select()
      .match({ id: receiver })
    const { data: totalUnread, error: erroUnread } = await supabase.rpc<number>('get_total_unread', { userid: receiver })
    if ((receiverData && receiverData.length && !receiverData[0].enableNotifications) || errorReceiver || erroUnread) {
      console.log('notif disabled', errorReceiver || erroUnread)
      return
    }
    // console.log('Total unread', totalUnread)
    const { data: token, error: tokenError } = await supabase
      .from<definitions['notification_token']>('notification_token')
      .select()
      .match({ created_by: receiver })

    if (tokenError || !token) {
      console.error(tokenError)
      return
    }
    const msg: Promise<any>[] = []
    for (const t of token) {
      console.log('Send to token: ', t.token)
      msg.push(sendRequestFirebase(t.token, Number(totalUnread), title, body, link, imageUrl))
    }
    await Promise.all(msg).then((res) => {
      console.log('res notif', res)
    })
  }
  catch (error) {
    console.error('sendNotification', error)
  }
}
