import { createClient } from 'https://esm.sh/@supabase/supabase-js@^1.35.3'

// Import Supabase client

export const supabaseClient = createClient(
  // Supabase API URL - env var exported by default.
  Deno.env.get('SUPABASE_URL') ?? '',
  // Supabase API ANON KEY - env var exported by default.
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
)

// WARNING: The service role key has admin priviliges and should only be used in secure server environments!
export const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)
