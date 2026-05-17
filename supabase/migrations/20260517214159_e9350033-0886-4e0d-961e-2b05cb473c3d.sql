
REVOKE ALL ON FUNCTION public.claim_profile_slot(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_profile_slot(TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.touch_profile_slot() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.touch_profile_slot() TO authenticated;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
