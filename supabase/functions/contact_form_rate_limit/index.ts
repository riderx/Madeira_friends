import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()

    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check for submissions in the last 10 minutes from the same email or IP
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()

    // Query for recent submissions from the same email
    const { data: emailSubmissions, error: emailError } = await supabase
      .from('contact_form')
      .select('created_at')
      .eq('email', email)
      .gte('created_at', tenMinutesAgo)

    if (emailError)
      throw emailError

    // If there are recent submissions from this email, reject the request
    if (emailSubmissions && emailSubmissions.length > 0) {
      return new Response(
        JSON.stringify({
          allowed: false,
          message: 'Rate limit exceeded. Please try again later.',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429,
        },
      )
    }

    // If no recent submissions, allow the request
    return new Response(
      JSON.stringify({ allowed: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  }
  catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
