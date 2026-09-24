CREATE OR REPLACE FUNCTION public.get_profile_state()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE profile_row public.profiles%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NULL; END IF;
  INSERT INTO public.profiles (id, email, scans_remaining, tier)
  SELECT auth.uid(), email, 5, 'free' FROM auth.users WHERE id = auth.uid()
  ON CONFLICT (id) DO NOTHING;
    UPDATE public.profiles
    SET scans_remaining = CASE WHEN usage_date < current_date THEN 5 ELSE scans_remaining END,
      daily_free_scans_used = CASE WHEN usage_date < current_date THEN 0 ELSE daily_free_scans_used END,
      daily_ad_bonuses_used = CASE WHEN usage_date < current_date THEN 0 ELSE daily_ad_bonuses_used END,
      usage_date = current_date,
      pro_scans_used = CASE WHEN usage_month < date_trunc('month', current_date)::date THEN 0 ELSE pro_scans_used END,
      usage_month = date_trunc('month', current_date)::date
  WHERE id = auth.uid();
  SELECT * INTO profile_row FROM public.profiles WHERE id = auth.uid();
  IF NOT FOUND THEN RETURN NULL; END IF;
  RETURN jsonb_build_object('scans_remaining', profile_row.scans_remaining, 'tier', profile_row.tier,
    'daily_free_scans_used', profile_row.daily_free_scans_used,
    'daily_ad_bonuses_used', profile_row.daily_ad_bonuses_used,
    'pro_scans_used', profile_row.pro_scans_used);
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_profile_scan()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  UPDATE public.profiles
  SET scans_remaining = CASE WHEN usage_date < current_date THEN 5 ELSE scans_remaining END,
      daily_free_scans_used = CASE WHEN usage_date < current_date THEN 0 ELSE daily_free_scans_used END,
      daily_ad_bonuses_used = CASE WHEN usage_date < current_date THEN 0 ELSE daily_ad_bonuses_used END,
      usage_date = current_date
  WHERE id = auth.uid();
  UPDATE public.profiles SET pro_scans_used = pro_scans_used + 1
  WHERE id = auth.uid() AND tier = 'pro' AND pro_scans_used < 300;
  IF FOUND THEN RETURN true; END IF;
  UPDATE public.profiles SET scans_remaining = scans_remaining - 1, daily_free_scans_used = daily_free_scans_used + 1
  WHERE id = auth.uid() AND tier = 'free' AND scans_remaining > 0 AND daily_free_scans_used < 5;
  IF FOUND THEN RETURN true; END IF;
  UPDATE public.profiles SET scans_remaining = scans_remaining - 1, daily_ad_bonuses_used = daily_ad_bonuses_used + 1
  WHERE id = auth.uid() AND tier = 'free' AND scans_remaining > 0 AND daily_ad_bonuses_used < 5;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_profile_scans(credit_amount int)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR credit_amount <> 1 THEN RETURN false; END IF;
  UPDATE public.profiles
  SET scans_remaining = scans_remaining + credit_amount,
      daily_ad_bonuses_used = daily_ad_bonuses_used + credit_amount
  WHERE id = auth.uid() AND tier = 'free' AND daily_ad_bonuses_used + credit_amount <= 5;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_profile_credit()
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles SET scans_remaining = scans_remaining + 1,
    daily_free_scans_used = GREATEST(daily_free_scans_used - 1, 0)
  WHERE id = auth.uid() AND tier = 'free';
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_profile_scan() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.add_profile_scans(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_profile_scan() TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_profile_scans(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profile_state() TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_profile_credit() TO authenticated;