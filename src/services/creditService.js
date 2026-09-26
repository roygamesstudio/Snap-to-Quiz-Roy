import { supabase, supabaseAvailable } from '../lib/supabase';

export async function getProfileState() {
  if (!supabaseAvailable || !supabase) return null;
  const { data, error } = await supabase.rpc('get_profile_state');
  if (error) return null;
  return data;
}

export async function getCredits() {
  const state = await getProfileState();
  if (!state) return 0;
  return state.credits ?? 0;
}

export async function isPremium() {
  const state = await getProfileState();
  return Boolean(state && state.is_premium);
}

export async function deductCredit() {
  if (!supabaseAvailable || !supabase) return false;
  const { data, error } = await supabase.rpc('consume_profile_credit');
  if (error) return false;
  return Boolean(data);
}

export async function addCredit(amount = 1) {
  if (!supabaseAvailable || !supabase) return false;
  const { data, error } = await supabase.rpc('add_profile_credits', {
    credit_amount: amount,
  });
  if (error) return false;
  return Boolean(data);
}

export async function refundCredit() {
  if (!supabaseAvailable || !supabase) return false;
  const { data, error } = await supabase.rpc('refund_profile_credit');
  if (error) return false;
  return Boolean(data);
}

export async function redeemPromoCode(code) {
  if (!supabaseAvailable || !supabase) {
    return { success: false, error: 'Database is not configured.' };
  }
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return { success: false, error: 'You must be signed in to redeem a promo code.' };
  }
  const { data, error } = await supabase.rpc('redeem_promo_code', {
    code_text: code.trim(),
  });
  if (error) {
    return {
      success: false,
      error:
        'This promo code is invalid or does not exist. Please check the code and try again.',
    };
  }
  return data;
}

export async function getAppConfig() {
  if (!supabaseAvailable || !supabase) return null;
  const { data, error } = await supabase
    .from('app_config')
    .select('is_active,title,message,target_url')
    .eq('id', 1)
    .maybeSingle();
  if (error) return null;
  return data;
}
