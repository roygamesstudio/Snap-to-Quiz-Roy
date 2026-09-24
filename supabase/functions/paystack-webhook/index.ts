import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

const encoder = new TextEncoder()

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function sign(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign'],
  )
  return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(payload)))
}

function getCustomField(fields: unknown, name: string) {
  if (!Array.isArray(fields)) return null
  const field = fields.find(
    (item) => item && typeof item === 'object' && item.variable_name === name,
  )
  return field && typeof field.value === 'string' ? field.value : null
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: corsHeaders,
    })
  }

  try {
    const body = await request.text()
    const signature = request.headers.get('x-paystack-signature')
    const secret = Deno.env.get('PAYSTACK_SECRET_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!signature || !secret || !supabaseUrl || !serviceRoleKey) {
      return new Response('Webhook is not configured', {
        status: 500,
        headers: corsHeaders,
      })
    }

    const expectedSignature = await sign(body, secret)
    if (signature !== expectedSignature) {
      return new Response('Invalid signature', {
        status: 401,
        headers: corsHeaders,
      })
    }

    let event
    try {
      event = JSON.parse(body)
    } catch {
      return new Response('Invalid JSON', {
        status: 400,
        headers: corsHeaders,
      })
    }

    if (event.event !== 'charge.success') {
      return Response.json({ received: true }, { headers: corsHeaders })
    }

    const userId = getCustomField(
      event.data?.metadata?.custom_fields,
      'supabase_user_id',
    )
    if (!userId) {
      return new Response('Missing Supabase user ID', {
        status: 400,
        headers: corsHeaders,
      })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { error: activateError } = await supabase.rpc('activate_pro_subscription', {
      user_id: userId,
    })

    if (activateError) {
      return new Response('Could not activate subscription', {
        status: 500,
        headers: corsHeaders,
      })
    }

    return Response.json({ received: true }, { headers: corsHeaders })
  } catch {
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
