ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_pro'
  ) THEN
    UPDATE public.profiles SET is_premium = is_pro WHERE is_pro IS NOT NULL;
    ALTER TABLE public.profiles DROP COLUMN is_pro;
  END IF;
END $$;

ALTER TABLE public.profiles ALTER COLUMN credits SET DEFAULT 5;

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;

CREATE OR REPLACE FUNCTION public.consume_profile_credit()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET credits = CASE WHEN is_premium THEN credits ELSE credits - 1 END
  WHERE id = auth.uid()
    AND (is_premium OR credits > 0);
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_profile_credits(credit_amount int)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF credit_amount < 1 THEN RETURN false; END IF;
  UPDATE public.profiles
  SET credits = credits + credit_amount
  WHERE id = auth.uid() AND NOT is_premium;
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_profile_credit() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.add_profile_credits(int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_profile_credit() TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_profile_credits(int) TO authenticated;
