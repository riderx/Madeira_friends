import type { JwtUser } from './types.ts'

export const jwtDecoder = (jwt: string): JwtUser =>
  JSON.parse(atob(jwt.split('.')[1]))

const basicHeaders = {
  'Access-Control-Expose-Headers': 'Content-Length, X-JSON',
  'Content-Type': 'application/json',
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export const sendRes = (data: any = { status: 'ok' }, statusCode = 200) => (new Response(
  JSON.stringify(data),
  {
    status: statusCode,
    headers: { ...basicHeaders, ...corsHeaders },
  },
))

export const sendOptionsRes = () => (new Response(
  'ok',
  {
    headers: {
      ...corsHeaders,
    },
  },
))
