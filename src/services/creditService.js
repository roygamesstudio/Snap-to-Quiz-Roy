import { supabase, supabaseAvailable } from '../lib/supabase'

async function getAuthenticatedUser() {
  if (!supabaseAvailable || !supabase) return null
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) return null
  return data.user
}

export async function getProfileState() {
  if (!supabaseAvailable || !supabase) return null
  const { data, error } = await supabase.rpc('get_profile_state')
  if (error) return null
  return data
}

export async function getCredits() {
  const state = await getProfileState()
  if (!state) return 0
  return state.scans_remaining ?? 0
}

export async function getProExpirationDate() {
  const state = await getProfileState()
  if (!state || state.tier !== 'pro') return null
  return state.pro_expires_at ?? null
}

export async function isPro() {
  const state = await getProfileState()
  return Boolean(state && state.tier === 'pro')
}

export async function deductCredit() {
  if (!supabaseAvailable || !supabase) return false
  const { data, error } = await supabase.rpc('consume_profile_scan')
  if (error) return false
  return Boolean(data)
}

export async function addCredit(amount = 1) {
  if (!supabaseAvailable || !supabase) return false
  const { data, error } = await supabase.rpc('add_profile_scans', {
    credit_amount: amount,
  })
  if (error) return false
  return Boolean(data)
}

export async function refundCredit() {
  if (!supabaseAvailable || !supabase) return false
  const { data, error } = await supabase.rpc('refund_profile_credit')
  if (error) return false
  return Boolean(data)
}

export async function redeemPromoCode(code) {
  if (!supabaseAvailable || !supabase) {
    return { success: false, error: 'Database is not configured.' }
  }
  const user = await getAuthenticatedUser()
  if (!user) {
    return { success: false, error: 'You must be signed in to redeem a promo code.' }
  }
  const { data, error } = await supabase.rpc('redeem_promo_code', {
    code_text: code.trim(),
  })
  if (error) {
    return { success: false, error: error.message }
  }
  return data
}
