-- ============================================================
-- Snap-to-Quiz Database Schema
-- Tables: profiles, study_sets
-- Strict Row Level Security (RLS) enabled on all tables
-- ============================================================

-- PROFILES TABLE
-- Stores profile identity, scan balance, and subscription tier.
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  country text NOT NULL DEFAULT 'Nigeria',
  currency text NOT NULL DEFAULT 'NGN' CHECK (currency IN ('NGN', 'USD')),
  scans_remaining int NOT NULL DEFAULT 5,
  tier text NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
  daily_free_scans_used int NOT NULL DEFAULT 0,
  daily_ad_bonuses_used int NOT NULL DEFAULT 0,
  usage_date date NOT NULL DEFAULT current_date,
  pro_scans_used int NOT NULL DEFAULT 0,
  usage_month date NOT NULL DEFAULT date_trunc('month', current_date)::date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only read their own profile
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

-- Profile credits and premium state are changed only by trusted database functions
-- and the service-role Paystack webhook, never by the browser.

-- STUDY_SETS TABLE
-- Stores generated quiz questions and flashcards from photo scans.
CREATE TABLE IF NOT EXISTS study_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  content jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE study_sets ENABLE ROW LEVEL SECURITY;

-- Owner-scoped CRUD: users can only access their own study sets
CREATE POLICY "select_own_study_sets" ON study_sets FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_study_sets" ON study_sets FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_study_sets" ON study_sets FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_study_sets" ON study_sets FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- AUTO-CREATE PROFILE ON SIGNUP
-- Trigger fires when a new user registers via Supabase Auth.
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
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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
