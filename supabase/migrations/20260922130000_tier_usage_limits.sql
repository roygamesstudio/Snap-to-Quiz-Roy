ALTER TABLE public.profiles
  ALTER COLUMN credits SET DEFAULT 5,
  ADD COLUMN IF NOT EXISTS daily_free_scans_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_ad_bonuses_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS usage_date date NOT NULL DEFAULT current_date,
  ADD COLUMN IF NOT EXISTS pro_scans_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS usage_month date NOT NULL DEFAULT date_trunc('month', current_date)::date;

UPDATE public.profiles
SET credits = 5,
    daily_free_scans_used = 0,
    daily_ad_bonuses_used = 0,
    usage_date = current_date
WHERE credits = 0;

CREATE OR REPLACE FUNCTION public.reset_profile_usage(profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET credits = CASE WHEN usage_date < current_date THEN 5 ELSE credits END,
      daily_free_scans_used = CASE WHEN usage_date < current_date THEN 0 ELSE daily_free_scans_used END,
      daily_ad_bonuses_used = CASE WHEN usage_date < current_date THEN 0 ELSE daily_ad_bonuses_used END,
      usage_date = current_date,
      pro_scans_used = CASE
        WHEN usage_month < date_trunc('month', current_date)::date THEN 0
        ELSE pro_scans_used
      END,
      usage_month = date_trunc('month', current_date)::date
  WHERE id = profile_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_profile_state()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE profile_row public.profiles%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NULL; END IF;
  INSERT INTO public.profiles (id, credits)
  VALUES (auth.uid(), 5)
  ON CONFLICT (id) DO NOTHING;
  PERFORM public.reset_profile_usage(auth.uid());
  SELECT * INTO profile_row FROM public.profiles WHERE id = auth.uid();
  IF NOT FOUND THEN RETURN NULL; END IF;

  RETURN jsonb_build_object(
    'credits', profile_row.credits,
    'is_premium', profile_row.is_premium,
    'daily_free_scans_used', profile_row.daily_free_scans_used,
    'daily_ad_bonuses_used', profile_row.daily_ad_bonuses_used,
    'pro_scans_used', profile_row.pro_scans_used
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_profile_credit()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  PERFORM public.reset_profile_usage(auth.uid());

  UPDATE public.profiles
  SET pro_scans_used = pro_scans_used + 1
  WHERE id = auth.uid() AND is_premium AND pro_scans_used < 300;
  IF FOUND THEN RETURN true; END IF;

  UPDATE public.profiles
  SET credits = credits - 1,
      daily_free_scans_used = daily_free_scans_used + 1
  WHERE id = auth.uid()
    AND NOT is_premium
    AND credits > 0
    AND daily_free_scans_used < 5;
  IF FOUND THEN RETURN true; END IF;

  UPDATE public.profiles
  SET credits = credits - 1,
      daily_ad_bonuses_used = daily_ad_bonuses_used + 1
  WHERE id = auth.uid()
    AND NOT is_premium
    AND credits > 0
    AND daily_ad_bonuses_used < 5;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_profile_credits(credit_amount integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR credit_amount <> 1 THEN RETURN false; END IF;
  PERFORM public.reset_profile_usage(auth.uid());
  UPDATE public.profiles
  SET credits = credits + credit_amount,
      daily_ad_bonuses_used = daily_ad_bonuses_used + credit_amount
  WHERE id = auth.uid()
    AND NOT is_premium
    AND daily_ad_bonuses_used + credit_amount <= 5;
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_profile_credit()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  PERFORM public.reset_profile_usage(auth.uid());
  UPDATE public.profiles
  SET credits = credits + 1,
      daily_free_scans_used = GREATEST(daily_free_scans_used - 1, 0)
  WHERE id = auth.uid() AND NOT is_premium;
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.reset_profile_usage(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_profile_state() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_profile_credit() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.add_profile_credits(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refund_profile_credit() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_profile_state() TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_profile_credit() TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_profile_credits(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_profile_credit() TO authenticated;
