ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS currency text,
  ADD COLUMN IF NOT EXISTS scans_remaining integer,
  ADD COLUMN IF NOT EXISTS tier text;

UPDATE public.profiles
SET email = COALESCE(email, users.email),
  country = COALESCE(country, 'Nigeria'),
  currency = CASE WHEN COALESCE(country, 'Nigeria') = 'Nigeria' THEN 'NGN' ELSE 'USD' END,
    scans_remaining = COALESCE(scans_remaining, credits, 5),
    tier = CASE WHEN COALESCE(is_premium, false) THEN 'pro' ELSE COALESCE(tier, 'free') END
FROM auth.users AS users
WHERE users.id = profiles.id;

ALTER TABLE public.profiles
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN country SET DEFAULT 'Nigeria',
  ALTER COLUMN country SET NOT NULL,
  ALTER COLUMN currency SET DEFAULT 'NGN',
  ALTER COLUMN currency SET NOT NULL,
  ALTER COLUMN scans_remaining SET DEFAULT 5,
  ALTER COLUMN scans_remaining SET NOT NULL,
  ALTER COLUMN tier SET DEFAULT 'free',
  ALTER COLUMN tier SET NOT NULL;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_tier_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_tier_check CHECK (tier IN ('free', 'pro'));
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_currency_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_currency_check CHECK (currency IN ('NGN', 'USD'));

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;

DROP FUNCTION IF EXISTS public.get_profile_state();
DROP FUNCTION IF EXISTS public.consume_profile_credit();
DROP FUNCTION IF EXISTS public.add_profile_credits(integer);
DROP FUNCTION IF EXISTS public.refund_profile_credit();

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS credits,
  DROP COLUMN IF EXISTS is_premium;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, country, currency, scans_remaining, tier)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'country', 'Nigeria'),
    CASE WHEN COALESCE(new.raw_user_meta_data->>'country', 'Nigeria') = 'Nigeria' THEN 'NGN' ELSE 'USD' END,
    5,
    'free'
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        country = EXCLUDED.country,
        currency = EXCLUDED.currency;
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_profile_scan()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE current_scans integer;
BEGIN
  SELECT scans_remaining INTO current_scans
  FROM public.profiles
  WHERE id = auth.uid() AND tier = 'free';
  IF NOT FOUND OR current_scans <= 0 THEN RETURN false; END IF;
  UPDATE public.profiles
  SET scans_remaining = scans_remaining - 1
  WHERE id = auth.uid() AND tier = 'free' AND scans_remaining = current_scans;
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_profile_scan() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_profile_scan() TO authenticated;