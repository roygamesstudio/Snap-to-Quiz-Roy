/*
# Revoke direct EXECUTE on trigger function handle_new_user

handle_new_user is a trigger function that fires on auth.users INSERT.
It should never be callable via the REST API by any role.
*/

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
