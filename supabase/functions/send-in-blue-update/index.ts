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
    const SIB_KEY = Deno.env.get('SIB_KEY')!
    // Configure API key authorization: apiKey
    const body = (await event.json()) as { record: definitions['users'] }
    const record = body.record
    console.log('record', record)

    const updateContact = {
      attributes: {
        ACCOUNT_ID: record.id,
        PHONE_VALID: true,
        PRENOM: record.first_name,
        NOM: record.last_name,
        ROLE: record.role,
        DATE_DE_NAISSANCE: record.dob,
        VILLE: record.city,
        PAYS: record.country,
        ENCEINTE: record.isPregnant,
        OPTIN_NL: record.optForNewsletters,
        PAYING: record.isPaying,
        NB_ENFANT: record.numberOfChildren,
      },
    }
    const newBody = JSON.stringify(updateContact)
    const identifier = encodeURIComponent(body.record.email)
    console.log('newBody', identifier, newBody)
    const url = `https://api.sendinblue.com/v3/contacts/${identifier}`
    const resp = await fetch(url, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': SIB_KEY,
      },
      body: newBody,
    })
    if (!resp.ok) {
      console.log('Error', resp)
      return sendRes({ message: 'Error', error: resp }, 400)
    }
    return sendRes({ message: 'ok' }, 200)
  }
  catch (e) {
    const err = new Error('Unknow error')
    console.log('Unknow error', JSON.stringify(e), err)
    console.trace()
    return sendRes({
      status: 'Unknow error',
      error: JSON.stringify(e),
    }, 500)
  }
})
