import { serve } from 'https://deno.land/std@0.139.0/http/server.ts'
//
import type { definitions } from '../_utils/types_supabase.ts'
import { sendRes } from '../_utils/utils.ts'

serve(async (event: Request) => {
  try {
    const API_SECRET = Deno.env.get('API_SECRET')
    const authorizationSecret = event.headers.get('apisecret')
    if (!authorizationSecret) {
      console.error('Fail Authorization')
      return sendRes({ status: 'Cannot find authorization secret' }, 400)
    }
    if (!authorizationSecret || !API_SECRET || authorizationSecret !== API_SECRET) {
      console.error('Fail Authorization')
      return sendRes({ message: 'Fail Authorization' }, 400)
    }
    const SIB_KEY = Deno.env.get('SIB_KEY')
    // Configure API key authorization: apiKey
    const body = (await event.json()) as { record: definitions['users'] }
    console.log('body', body)
    const record = body.record
    const { email, first_name, last_name, id } = record

    if (!email || !first_name || !last_name || !SIB_KEY) {
      console.error('must include contact detailsn')
      return sendRes({ message: 'must include contact details' }, 400)
    }

    const createContact = {
      email,
      listIds: [8],
      attributes: {
        ACCOUNT_ID: id,
        ROLE: record.role,
        PRENOM: first_name,
        NOM: last_name,
        PAYING: false,
        PHONE_VALID: false,
      },
    }
    const newBody = JSON.stringify(createContact)
    console.log('newBody', newBody)
    const resp = await fetch('https://api.sendinblue.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': SIB_KEY,
      },
      body: newBody,
    })
    console.log('resp', resp)
    if (!resp.ok) {
      console.error('Error', resp)
      return sendRes({ message: 'Error', error: resp }, 400)
    }
    const data = await resp.json()
    console.log('data', data)
    return sendRes({ message: data }, 200)
  }
  catch (e) {
    console.error('Unknow error', e)
    return sendRes({
      status: 'Unknow error',
      error: JSON.stringify(e),
    }, 500)
  }
})
