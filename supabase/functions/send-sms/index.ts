import { serve } from 'https://deno.land/std@0.139.0/http/server.ts'
import { Base64 } from 'https://deno.land/x/bb64/mod.ts'
import { sendOptionsRes, sendRes } from '../_utils/utils.ts'

interface dataPhone {
  phone: string
}

serve(async (event: Request) => {
  console.log('method', event.method)
  if (event.method === 'OPTIONS')
    return sendOptionsRes()
  try {
    const body = (await event.json()) as dataPhone
    console.log('body', body)
    if (!body.phone || !Deno.env.get('TWILIO_SERVICE_SID'))
      return sendRes({ message: 'Requires phone number' }, 400)

    const resp = await fetch(`https://verify.twilio.com/v2/Services/${Deno.env.get('TWILIO_SERVICE_SID')}/Verifications`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Base64.fromString(`${Deno.env.get('TWILIO_SID')}:${Deno.env.get('TWILIO_TOKEN')}`).toString()}`,
      },
      body: new URLSearchParams({ To: body.phone, Channel: 'sms' }),
    })
    return sendRes(await resp.json(), 200)
  }
  catch (e) {
    return sendRes({
      status: 'Error unknow',
      error: JSON.stringify(e),
    }, 500)
  }
})
