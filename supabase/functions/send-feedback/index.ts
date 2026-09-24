import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const resendKey = Deno.env.get('RESEND_API_KEY')
    const supportEmail = Deno.env.get('SUPPORT_EMAIL')
    if (!supabaseUrl || !anonKey || !resendKey || !supportEmail) {
      return Response.json(
        { error: 'Feedback service is not configured.' },
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return Response.json(
        { error: 'Sign in is required.' },
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      return Response.json(
        { error: 'Sign in is required.' },
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const payload = await request.json().catch(() => null)
    const message = typeof payload?.message === 'string' ? payload.message.trim() : ''
    const type = payload?.type === 'bug' ? 'Bug report' : 'Feedback'
    if (!message || message.length > 5000) {
      return Response.json(
        { error: 'Feedback must be between 1 and 5000 characters.' },
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: Deno.env.get('FEEDBACK_FROM_EMAIL') || 'Snap-to-Quiz <onboarding@resend.dev>',
        to: [supportEmail],
        reply_to: userData.user.email || undefined,
        subject: `${type} from Snap-to-Quiz`,
        text: `${message}\n\nUser ID: ${userData.user.id}\nUser email: ${userData.user.email || ' unavailable'}`,
      }),
    })

    if (!response.ok) {
      return Response.json(
        { error: 'Feedback could not be sent.' },
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    return Response.json(
      { sent: true },
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch {
    return Response.json(
      { error: 'Feedback could not be sent.' },
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
