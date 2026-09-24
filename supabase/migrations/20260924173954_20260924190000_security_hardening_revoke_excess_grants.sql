/*
# Security hardening: revoke excess grants

## Changes
1. Revoke EXECUTE on `activate_pro_subscription` from `authenticated` — this
   function should only be callable by the service role (Paystack webhook),
   never by any frontend client. A user could otherwise call it to grant
   themselves Pro for free.
2. Revoke all table privileges from `anon` on `promo_codes` and
   `promo_redemptions` — these tables should only be accessible to
   authenticated users.
3. Revoke INSERT, UPDATE, DELETE from `authenticated` on `promo_codes` —
   users should only be able to SELECT (verify) promo codes, never create
   or modify them.
4. Revoke INSERT, UPDATE, DELETE from `authenticated` on `promo_redemptions` —
   redemptions are handled by the SECURITY DEFINER function, not direct inserts.
5. Revoke INSERT, UPDATE, DELETE from `authenticated` on `profiles` — all
   mutations go through SECURITY DEFINER functions, never direct table writes.
*/

-- activate_pro_subscription: service-role only (webhook)
REVOKE EXECUTE ON FUNCTION public.activate_pro_subscription(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.activate_pro_subscription(uuid) FROM anon;

-- promo_codes: authenticated can only SELECT
REVOKE INSERT ON public.promo_codes FROM anon;
REVOKE UPDATE ON public.promo_codes FROM anon;
REVOKE DELETE ON public.promo_codes FROM anon;
REVOKE SELECT ON public.promo_codes FROM anon;
REVOKE INSERT ON public.promo_codes FROM authenticated;
REVOKE UPDATE ON public.promo_codes FROM authenticated;
REVOKE DELETE ON public.promo_codes FROM authenticated;

-- promo_redemptions: authenticated can only SELECT their own
REVOKE INSERT ON public.promo_redemptions FROM anon;
REVOKE UPDATE ON public.promo_redemptions FROM anon;
REVOKE DELETE ON public.promo_redemptions FROM anon;
REVOKE SELECT ON public.promo_redemptions FROM anon;
REVOKE INSERT ON public.promo_redemptions FROM authenticated;
REVOKE UPDATE ON public.promo_redemptions FROM authenticated;
REVOKE DELETE ON public.promo_redemptions FROM authenticated;

-- profiles: authenticated can only SELECT (mutations via SECURITY DEFINER functions)
REVOKE INSERT ON public.profiles FROM authenticated;
REVOKE UPDATE ON public.profiles FROM authenticated;
REVOKE DELETE ON public.profiles FROM authenticated;
