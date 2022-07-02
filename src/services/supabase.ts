import type { SupabaseClientOptions } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'
import { Http } from '@capacitor-community/http'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const useSupabase = () => {
  const options: SupabaseClientOptions = {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    fetch: (requestInfo, requestInit) => {
      const url = requestInfo.toString()
      if (requestInit?.method === 'POST' && url.includes('/storage/'))
        return fetch(requestInfo, requestInit)

      return Http.request({
        url,
        method: requestInit?.method,
        headers: requestInit?.headers as any || {},
        data: requestInit?.body,
      })
        .then((data) => {
          const type = data.headers['content-type']
          const res = type.includes('application/vnd.pgrst.object+json') ? data.data : JSON.stringify(data.data)
          const resp = new Response(res, {
            status: data.status,
            headers: data.headers,
          })
          return resp
        })
    },
  }
  return createClient(supabaseUrl, supabaseAnonKey, options)
}
