import { GoogleAPI } from 'https://deno.land/x/google_deno_integration/mod.ts'

const api = new GoogleAPI({
  email: 'firebase-adminsdk-i53l9@moispourtoi.iam.gserviceaccount.com',
  //   email: 'firebase-adminsdk-i53l9@moispourtoi.iam.gserviceaccount.com',
  scope: [
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/firebase.messaging',
  ],
  key: '-----BEGIN PRIVATE KEY-----MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCJxXqPYsdux/4aN1Uw0YIjqLEdMQCdEmeUIIeu6uNDQOCiLgTfattsx+pfMfZcjAaNtqt5ySzi4YKaJnpoRJ6w0Cx0Rh7a/HygSu/LF42TgTywasqLyT/sKFDTF0Ll31yKoa/mhrlRo43S3vgOICMgnesfNyOvqMrQ/o4yg06lfc+Hc9/Iji/zFbe4Mr9/6V7Gmt/mFqkUn7BqBGdHg0bf0lwYBbu+iLm87X/DEuXJWPVxqOyzNlOSERPsho9Bc0viyf+OQHELHmQ7Eb6Jbxz5BdLiuj7oFU8tgj912fIJp/h1REQmBAqrLgxc2GAX4DmVQhXfHdNmnkUfBhPhA1XlAgMBAAECggEAOS0uSJyflO/GGp41Kk4AuwjS/IDuNsHBH94CQYs05x/hOh1sI0anKvWq5HgJPO5V9/FEKAZgLQaXG591dJlp3IqAsH67ZnmbxTBkZT5woLNlevfO+IV8lGdE595DAsCYmOYyaLMn7OQ6QzYK713SBkLTpgBNvKSKC4Nhg0AwXwiENsJQO6EwjqCqX2WJHU1+ZLrJc/KGmwmlhjvtI8qQZ04QKFaV+C7w2RbZcPIMI7gqw5nz+xwLKvB/5423o+oou1fXS+rQ+QRyIZeQ0eMc/LNb+sHsgXKIBRZTRTR4e2f5COOFcI5OK+lu0+KtSJufk2uYgqwwm8BYKDzXSJlErwKBgQC+lY4kZoOa6xz69tNryUrmUm7XWtkQ0D89jzW44UfOeI0WEVGhLUlbOXDBv4jTysgh52ocPnoSprnTq1tTPZKFXdLHIw8gLtJoIsaZY0KC9y3UQ1E9kEPH/61++Hm/MTeFkRSWr0i6PaONGGsuOAMfp90U8TCxxhmFRGiZmZ5WqwKBgQC5D1CyrCUdFmE2s0h1sqtn5nMVwa0/XN6uUDA7OVChy48NVQyRItZsA+gYAHwzU1M97eLvfNptQFY9msD8m6mTZFBVpp20PKuCNJlgSqlc0wwb1lr0dqq4tJHBsbmBW/Prja1q++6ZfRuh3lmsEkuqZ8y33mTmZ84m6IWVmT5FrwKBgQC68jzyG9Twe7x7uO5+hn+AGlA70xOl2ICQRBAwgFtNfxb2FJr7/U49u8SNaPIwvnM+Pp/pgKeB8CXMKgR1TKqTRAtj51IJAaTHHYWuJJ2zlf9QfZANUZwLbROkvtu93etWi4+kl+BBQAFUgCVyuuLlhGXrCwP2/hk+jnIEaZnV7QKBgQCxNP0tWrJfXCLS4nKsYd7Iq1/goYlod2G0wYyt6YBQrj/ZoGtcP2PcIxGIik5kR5IaZ0U71u7CVy096IaMXfLP9OsIWXgCM2Z4VC3aiyQKgv3BWk3Wchugqyg3thvQx2CXWx+Ipp4f1DE1m1l68DoMf0EFgKxWBWje0SG50vhSeQKBgQCb6wy/tfSvQAgelEXhTCM8wOM+zhABC5EkEU1b7vFr2DM03ObG3AP2PFebgDdC4hJFY2Yv78+8QFGeaOVFAy/SgAEz5SJmmm898h52d1l/tUSnIi+zXDXuc+JBXuuQSmAHOjSIvBqYGdJvfSes8aJX06iJjKiuqO+2z/sG8N/rFw==-----END PRIVATE KEY-----',
// key: '-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCJxXqPYsdux/4a\nN1Uw0YIjqLEdMQCdEmeUIIeu6uNDQOCiLgTfattsx+pfMfZcjAaNtqt5ySzi4YKa\nJnpoRJ6w0Cx0Rh7a/HygSu/LF42TgTywasqLyT/sKFDTF0Ll31yKoa/mhrlRo43S\n3vgOICMgnesfNyOvqMrQ/o4yg06lfc+Hc9/Iji/zFbe4Mr9/6V7Gmt/mFqkUn7Bq\nBGdHg0bf0lwYBbu+iLm87X/DEuXJWPVxqOyzNlOSERPsho9Bc0viyf+OQHELHmQ7\nEb6Jbxz5BdLiuj7oFU8tgj912fIJp/h1REQmBAqrLgxc2GAX4DmVQhXfHdNmnkUf\nBhPhA1XlAgMBAAECggEAOS0uSJyflO/GGp41Kk4AuwjS/IDuNsHBH94CQYs05x/h\nOh1sI0anKvWq5HgJPO5V9/FEKAZgLQaXG591dJlp3IqAsH67ZnmbxTBkZT5woLNl\nevfO+IV8lGdE595DAsCYmOYyaLMn7OQ6QzYK713SBkLTpgBNvKSKC4Nhg0AwXwiE\nNsJQO6EwjqCqX2WJHU1+ZLrJc/KGmwmlhjvtI8qQZ04QKFaV+C7w2RbZcPIMI7gq\nw5nz+xwLKvB/5423o+oou1fXS+rQ+QRyIZeQ0eMc/LNb+sHsgXKIBRZTRTR4e2f5\nCOOFcI5OK+lu0+KtSJufk2uYgqwwm8BYKDzXSJlErwKBgQC+lY4kZoOa6xz69tNr\nyUrmUm7XWtkQ0D89jzW44UfOeI0WEVGhLUlbOXDBv4jTysgh52ocPnoSprnTq1tT\nPZKFXdLHIw8gLtJoIsaZY0KC9y3UQ1E9kEPH/61++Hm/MTeFkRSWr0i6PaONGGsu\nOAMfp90U8TCxxhmFRGiZmZ5WqwKBgQC5D1CyrCUdFmE2s0h1sqtn5nMVwa0/XN6u\nUDA7OVChy48NVQyRItZsA+gYAHwzU1M97eLvfNptQFY9msD8m6mTZFBVpp20PKuC\nNJlgSqlc0wwb1lr0dqq4tJHBsbmBW/Prja1q++6ZfRuh3lmsEkuqZ8y33mTmZ84m\n6IWVmT5FrwKBgQC68jzyG9Twe7x7uO5+hn+AGlA70xOl2ICQRBAwgFtNfxb2FJr7\n/U49u8SNaPIwvnM+Pp/pgKeB8CXMKgR1TKqTRAtj51IJAaTHHYWuJJ2zlf9QfZAN\nUZwLbROkvtu93etWi4+kl+BBQAFUgCVyuuLlhGXrCwP2/hk+jnIEaZnV7QKBgQCx\nNP0tWrJfXCLS4nKsYd7Iq1/goYlod2G0wYyt6YBQrj/ZoGtcP2PcIxGIik5kR5Ia\nZ0U71u7CVy096IaMXfLP9OsIWXgCM2Z4VC3aiyQKgv3BWk3Wchugqyg3thvQx2CX\nWx+Ipp4f1DE1m1l68DoMf0EFgKxWBWje0SG50vhSeQKBgQCb6wy/tfSvQAgelEXh\nTCM8wOM+zhABC5EkEU1b7vFr2DM03ObG3AP2PFebgDdC4hJFY2Yv78+8QFGeaOVF\nAy/SgAEz5SJmmm898h52d1l/tUSnIi+zXDXuc+JBXuuQSmAHOjSIvBqYGdJvfSes\n8aJX06iJjKiuqO+2z/sG8N/rFw==\n-----END PRIVATE KEY-----\n',
})

// const body = {
//   message: {
//     notification: {
//       title: 'test 2',
//       body: 'bodyy',
//     },
//     android: {
//       priority: 'HIGH',
//       notification: {
//         image: 'https://www.remove.bg/images/remove_image_background.jpg',
//         color: '#f46e71',
//         sound: 'default',
//         default_sound: true,
//         default_light_settings: true,
//         default_vibrate_timings: true,
//       },
//     },
//     webpush: {
//       headers: {
//         Urgency: 'high',
//       },
//       notification: {
//         image: 'https://www.remove.bg/images/remove_image_background.jpg',
//       },
//       fcmOptions: {
//         link: '/',
//       },
//     },
//     data: {
//       link: '/',
//     },
//     apns: {
//       headers: {
//         'apns-priority': '10',
//       },
//       payload: {
//         aps: {
//           'sound': 'default',
//           'mutable-content': 1,
//           'badge': 1,
//         },
//       },
//       fcmOptions: {
//         image: 'https://www.remove.bg/images/remove_image_background.jpg',
//       },
//     },
//     token: 'd8uwmDX_EE_-p5OCC5TxTy:APA91bHjTyoX-cvjOJxCJIJHGxZ9KC19QjyrR7vwtJa1tlwz2kq4r31WrfiAgRdOPHKwWOg54N4aLvUyaSpk7VizUnkEsWkgPDqkszrfxOE44TBvlOG85vc-urbMUXddsHc5lA2619nS',
//   },
// }
const body = {
  message: {
    notification: {
      title: 'Message de Pauline Fetu',
      body: 'test 4',
    },
    android: {
      priority: 'HIGH',
      notification: {
        image: 'https://pbijvhcybgzxzcfqquek.supabase.co/storage/v1/object/public/images/5912deff-3f71-473e-9ebc-b5285083f457/1652923764356.png',
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
        image: 'https://pbijvhcybgzxzcfqquek.supabase.co/storage/v1/object/public/images/5912deff-3f71-473e-9ebc-b5285083f457/1652923764356.png',
      },
      fcmOptions: {
        link: 'https://neufmoispourtoi.app//chat/8f703943-b2d0-4382-b398-cd6f1efeff78',
      },
    },
    data: {
      link: '/chat/8f703943-b2d0-4382-b398-cd6f1efeff78',
    },
    apns: {
      headers: {
        'apns-priority': '10',
      },
      payload: {
        aps: {
          'sound': 'default',
          'mutable-content': 1,
          'badge': 1,
        },
      },
      fcmOptions: {
        image: 'https://pbijvhcybgzxzcfqquek.supabase.co/storage/v1/object/public/images/5912deff-3f71-473e-9ebc-b5285083f457/1652923764356.png',
      },
    },
    token: 'd8uwmDX_EE_-p5OCC5TxTy:APA91bHjTyoX-cvjOJxCJIJHGxZ9KC19QjyrR7vwtJa1tlwz2kq4r31WrfiAgRdOPHKwWOg54N4aLvUyaSpk7VizUnkEsWkgPDqkszrfxOE44TBvlOG85vc-urbMUXddsHc5lA2619nS',
  },
}
const response = await api.post('https://fcm.googleapis.com/v1/projects/moispourtoi/messages:send', body)
console.log('api', response)
