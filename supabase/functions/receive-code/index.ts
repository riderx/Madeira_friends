import { serve } from 'https://deno.land/std@0.139.0/http/server.ts'
import { Base64 } from 'https://deno.land/x/bb64/mod.ts'
import { sendOptionsRes, sendRes } from '../_utils/utils.ts'

interface dataPhone {
  phone: string
  code: string
}

serve(async (event: Request) => {
  console.log('method', event.method)
  if (event.method === 'OPTIONS')
    return sendOptionsRes()
  try {
    const body = (await event.json()) as dataPhone
    console.log('body', body)
    if (!body.phone || !body.code || !Deno.env.get('TWILIO_SERVICE_SID'))
      return sendRes({ message: 'Requires phone number or code' }, 400)
    const resp = await fetch(`https://verify.twilio.com/v2/Services/${Deno.env.get('TWILIO_SERVICE_SID')}/VerificationCheck`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Base64.fromString(`${Deno.env.get('TWILIO_SID')}:${Deno.env.get('TWILIO_TOKEN')}`).toString()}`,
      },
      body: new URLSearchParams({ To: body.phone, Code: body.code }),
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
