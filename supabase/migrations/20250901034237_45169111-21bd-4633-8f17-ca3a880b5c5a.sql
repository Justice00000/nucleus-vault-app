-- Fix the is_admin function to properly check admin status
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE profiles.user_id = check_user_id LIMIT 1),
    false
  );
$$;