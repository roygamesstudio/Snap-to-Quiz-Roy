/*
# Create promo_codes and app_config tables for PhotoQuizzer

1. New Tables
- `promo_codes`: Stores promotional codes that grant bonus scan credits.
  - `id` (uuid, primary key)
  - `code` (text, unique, not null) — the promo code string users enter
  - `credits` (int, not null, default 1) — number of credits awarded on redemption
  - `max_uses` (int, not null, default 100) — maximum total redemptions allowed
  - `times_used` (int, not null, default 0) — current redemption count
  - `is_active` (boolean, not null, default true) — whether the code can be redeemed
  - `created_at` (timestamptz, default now())
- `app_config`: Stores remote app configuration for announcements/update notices.
  - `id` (int, primary key, always 1 — singleton row)
  - `is_active` (boolean, default false) — whether to show the modal
  - `title` (text) — modal title
  - `message` (text) — modal body text
  - `target_url` (text) — URL opened when user taps the update button
  - `updated_at` (timestamptz, default now())

2. New Functions
- `redeem_promo_code(code_text text)`: Validates a promo code for the authenticated
  user. If the code exists, is active, and has not reached max_uses, increments
  times_used and adds the code's credits to the user's profile. Returns jsonb
  with success status and credits_awarded or an error message.

3. Security
- `promo_codes`: RLS enabled. Users can only SELECT (to validate codes) — all
  mutations go through the SECURITY DEFINER redeem_promo_code function. No
  direct INSERT/UPDATE/DELETE policies for authenticated/anon.
- `app_config`: RLS enabled. Public read (anon + authenticated) so the app can
  fetch config on startup. No write policies — config is managed server-side.

4. Important Notes
- The profiles table uses `credits` (int) and `is_premium` (boolean) columns.
- The redeem function adds credits directly to profiles.credits for the
  authenticated user, bypassing the daily ad bonus limit so promo codes
  always grant their full value.
- app_config is a singleton (id = 1). The app fetches row with id=1.
*/

-- ============================================================
-- promo_codes table
-- ============================================================
CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  credits int NOT NULL DEFAULT 1,
  max_uses int NOT NULL DEFAULT 100,
  times_used int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- Users can read promo codes to validate them (code, is_active, max_uses, times_used)
DROP POLICY IF EXISTS "select_promo_codes" ON promo_codes;
CREATE POLICY "select_promo_codes" ON promo_codes FOR SELECT
  TO authenticated USING (true);

-- ============================================================
-- app_config table (singleton)
-- ============================================================
CREATE TABLE IF NOT EXISTS app_config (
  id int PRIMARY KEY DEFAULT 1,
  is_active boolean NOT NULL DEFAULT false,
  title text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  target_url text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_config_singleton CHECK (id = 1)
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Public read so the app can fetch config on startup (no sign-in required)
DROP POLICY IF EXISTS "select_app_config" ON app_config;
CREATE POLICY "select_app_config" ON app_config FOR SELECT
  TO anon, authenticated USING (true);

-- Insert default row if not exists
INSERT INTO app_config (id, is_active, title, message, target_url)
VALUES (1, false, '', '', '')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- redeem_promo_code function
-- ============================================================
CREATE OR REPLACE FUNCTION public.redeem_promo_code(code_text text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  promo_record public.promo_codes%ROWTYPE;
  user_id uuid := auth.uid();
BEGIN
  IF user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'You must be signed in to redeem a promo code.');
  END IF;

  SELECT * INTO promo_record
  FROM public.promo_codes
  WHERE code = code_text
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'This promo code is invalid or does not exist. Please check the code and try again.');
  END IF;

  IF NOT promo_record.is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'This promo code is invalid or does not exist. Please check the code and try again.');
  END IF;

  IF promo_record.times_used >= promo_record.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'This promo code is invalid or does not exist. Please check the code and try again.');
  END IF;

  -- Increment usage count
  UPDATE public.promo_codes
  SET times_used = times_used + 1
  WHERE id = promo_record.id;

  -- Add credits to the user's profile
  UPDATE public.profiles
  SET credits = credits + promo_record.credits
  WHERE id = user_id;

  RETURN jsonb_build_object('success', true, 'credits_awarded', promo_record.credits);
END;
$$;

-- Grant execute to authenticated users only
REVOKE ALL ON FUNCTION public.redeem_promo_code(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.redeem_promo_code(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.redeem_promo_code(text) TO authenticated;