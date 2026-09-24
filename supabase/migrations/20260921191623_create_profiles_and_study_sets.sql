/*
# Create profiles and study_sets tables for Snap-to-Quiz

1. New Tables
   - `profiles`: user profile with credits and pro status. id matches auth.users id.
     - id (uuid, primary key, references auth.users)
     - credits (int, default 3 — free scan limit)
    - is_premium (boolean, default false — upgraded by verified Paystack webhook)
     - created_at (timestamptz, default now())
   - `study_sets`: saved quiz/flashcard sets generated from photos.
     - id (uuid, primary key, default gen_random_uuid())
     - user_id (uuid, not null, default auth.uid(), references auth.users, cascade delete)
     - title (text)
     - content (jsonb — stores questions and flashcards arrays)
     - created_at (timestamptz, default now())

2. Security
   - Enable RLS on both tables.
   - `profiles`: users can read/update only their own profile (auth.uid() = id).
     INSERT handled by a trigger that auto-creates a profile on signup, so no
     direct INSERT policy for users. A service-role trigger inserts the row.
   - `study_sets`: full owner-scoped CRUD (auth.uid() = user_id) for authenticated users.

3. Notes
   - A trigger `handle_new_user` auto-creates a profile row when a new auth.user
     is created via Supabase Auth, so users get 3 free credits on signup.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits int NOT NULL DEFAULT 5,
  is_premium boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS study_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  content jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sets ENABLE ROW LEVEL SECURITY;

-- profiles policies
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);


-- study_sets policies
DROP POLICY IF EXISTS "select_own_study_sets" ON study_sets;
CREATE POLICY "select_own_study_sets" ON study_sets FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_study_sets" ON study_sets;
CREATE POLICY "insert_own_study_sets" ON study_sets FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_study_sets" ON study_sets;
CREATE POLICY "update_own_study_sets" ON study_sets FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_study_sets" ON study_sets;
CREATE POLICY "delete_own_study_sets" ON study_sets FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (new.id);
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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
